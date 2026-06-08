import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AchievementEntity } from './entities/achievement.entity';
import { UserAchievementEntity } from './entities/user-achievement.entity';
import { UserExerciseRecordEntity } from './entities/user-exercise-record.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { AchievementType, WorkoutStatus } from '@athlo/shared';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(AchievementEntity)
    private readonly achievementRepo: Repository<AchievementEntity>,
    @InjectRepository(UserAchievementEntity)
    private readonly userAchievementRepo: Repository<UserAchievementEntity>,
    @InjectRepository(UserExerciseRecordEntity)
    private readonly userExerciseRecordRepo: Repository<UserExerciseRecordEntity>,
    @InjectRepository(LogSetEntity)
    private readonly logSetRepo: Repository<LogSetEntity>,
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepo: Repository<LogExerciseEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepo: Repository<WorkoutEntity>,
  ) {}

  async getAll() {
    return this.achievementRepo.find({ order: { order: 'ASC' } });
  }

  async getUserAchievements(userId: number) {
    return this.userAchievementRepo.find({
      where: { userId },
      relations: { achievement: true },
      order: { unlockedAt: 'DESC' },
    });
  }

  async getUserExerciseRecords(userId: number) {
    return this.userExerciseRecordRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getExerciseRecord(userId: number, exerciseId: number) {
    return this.userExerciseRecordRepo.find({
      where: { userId, exerciseId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Called after a set is created/updated.
   * Updates personal records and checks exercise-specific achievements.
   */
  async checkAndUpdateRecords(
    userId: number,
    logExerciseId: number,
  ): Promise<void> {
    const logExercise = await this.logExerciseRepo.findOne({
      where: { id: logExerciseId },
      relations: { exercise: { trackingType: true }, sets: true },
    });
    if (!logExercise) return;

    const exerciseId = logExercise.exerciseId;
    const trackingTypeName =
      logExercise.exercise?.trackingType?.name ?? 'WEIGHT_AND_REPS';

    // Sort sets by order to correctly identify the first set that broke the record
    const sets = [...logExercise.sets].sort((a, b) => a.order - b.order);
    const logSetIds = sets.map((s) => s.id);

    // Rollback: clear any existing PR records for this specific set of logs
    // so we can re-evaluate correctly (handles decreasing weight, unchecking set, etc.)
    if (logSetIds.length > 0) {
      await this.userExerciseRecordRepo.delete({
        userId,
        exerciseId,
        logSetId: In(logSetIds),
      });
    }

    // Get all current records for this user and exercise
    const currentRecords = await this.userExerciseRecordRepo.find({
      where: { userId, exerciseId },
    });

    const getAbsoluteMax = (metricType: string) => {
      const records = currentRecords.filter((r) => r.metricType === metricType);
      if (records.length === 0) return 0;
      return Math.max(...records.map((r) => Number(r.value)));
    };

    const newRecordsToSave: UserExerciseRecordEntity[] = [];

    for (const set of sets) {
      if (!set.isCompleted) {
        if (set.isPR || set.achievementId) {
          set.isPR = false;
          set.achievementId = null;
          await this.logSetRepo.save(set);
        }
        continue;
      }

      let setIsPR = false;
      let triggeredAchievementId: number | null = null;

      const checkMetric = (metricType: string, newValue: number) => {
        if (newValue > 0) {
          const currentMax = getAbsoluteMax(metricType);
          if (newValue > currentMax) {
            const newRecord = this.userExerciseRecordRepo.create({
              userId,
              exerciseId,
              metricType,
              value: newValue,
              logSetId: set.id,
            });
            newRecordsToSave.push(newRecord);
            currentRecords.push(newRecord); // To update the max for subsequent sets
            setIsPR = true;
          }
        }
      };

      switch (trackingTypeName) {
        case 'WEIGHT_AND_REPS': {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          checkMetric('WEIGHT', weight);
          checkMetric('REPS', reps);
          if (weight > 0 && reps > 0) {
            checkMetric('VOLUME', weight * reps);
            const estimated = parseFloat((weight * (1 + reps / 30)).toFixed(2));
            checkMetric('1RM', estimated);
          }
          break;
        }
        case 'REPS_ONLY': {
          const reps = Number(set.reps) || 0;
          checkMetric('REPS', reps);
          break;
        }
        case 'TIME_BASED': {
          const duration = Number(set.duration) || 0;
          checkMetric('DURATION', duration);
          break;
        }
        case 'DISTANCE_AND_TIME': {
          const duration = Number(set.duration) || 0;
          const distance = Number(set.distance) || 0;
          checkMetric('DURATION', duration);
          checkMetric('DISTANCE', distance);
          break;
        }
        case 'DISTANCE_ONLY': {
          const distance = Number(set.distance) || 0;
          checkMetric('DISTANCE', distance);
          break;
        }
      }

      if (setIsPR) {
        set.isPR = true;

        // If it's a PR, also check for achievements
        const exerciseAchievements = await this.achievementRepo.find({
          where: { type: AchievementType.EXERCISE_PERSONAL_RECORD, exerciseId },
        });

        // We use the latest max value for this set
        for (const achievement of exerciseAchievements) {
          const metricType = achievement.trackingMetric || '';
          const newlyAddedRecord = newRecordsToSave.find(
            (r) => r.metricType === metricType && r.logSetId === set.id,
          );

          if (newlyAddedRecord) {
            const unlocked = await this.tryUnlockAchievement(
              userId,
              achievement,
              newlyAddedRecord,
            );
            if (unlocked) {
              triggeredAchievementId = achievement.id;
            }
          }
        }

        set.achievementId = triggeredAchievementId;
        await this.logSetRepo.save(set);
      } else {
        // If not a PR, ensure flags are cleared (in case it was updated to lower values)
        if (set.isPR || set.achievementId) {
          set.isPR = false;
          set.achievementId = null;
          await this.logSetRepo.save(set);
        }
      }
    }

    if (newRecordsToSave.length > 0) {
      await this.userExerciseRecordRepo.save(newRecordsToSave);
    }

    // Re-check exercise achievements: revoke if actual max no longer meets threshold
    const exerciseAchievements = await this.achievementRepo.find({
      where: { type: AchievementType.EXERCISE_PERSONAL_RECORD, exerciseId },
    });

    for (const achievement of exerciseAchievements) {
      const metricType = achievement.trackingMetric || '';

      const allRecords = await this.userExerciseRecordRepo.find({
        where: { userId, exerciseId, metricType },
      });
      const currentMax =
        allRecords.length > 0
          ? Math.max(...allRecords.map((r) => Number(r.value)))
          : 0;

      const existing = await this.userAchievementRepo.findOne({
        where: { userId, achievementId: achievement.id },
      });

      if (!existing) {
        // If not unlocked yet, but current max meets threshold, unlock it now
        if (currentMax >= Number(achievement.threshold)) {
          await this.userAchievementRepo.save(
            this.userAchievementRepo.create({
              userId,
              achievementId: achievement.id,
              value: currentMax,
            }),
          );
        }
        continue;
      }

      if (currentMax < Number(achievement.threshold)) {
        await this.userAchievementRepo.remove(existing);
      } else if (Number(existing.value) !== currentMax) {
        existing.value = currentMax;
        await this.userAchievementRepo.save(existing);
      }
    }
  }

  /**
   * Called after a workout is completed.
   * Checks global achievements (workouts, sets, weight, time, unique exercises).
   */
  async checkGlobalAchievements(userId: number): Promise<void> {
    const totalWorkouts = await this.workoutRepo.count({
      where: { userId, status: WorkoutStatus.COMPLETED },
    });

    const totalSets = await this.logSetRepo
      .createQueryBuilder('ls')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getCount();

    const totalWeightResult = await this.logSetRepo
      .createQueryBuilder('ls')
      .select('COALESCE(SUM(ls.weight * ls.reps), 0)', 'total')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getRawOne();

    const totalWeight = parseFloat(totalWeightResult?.total ?? '0');

    const totalTimeResult = await this.workoutRepo
      .createQueryBuilder('w')
      .select(
        'COALESCE(SUM(EXTRACT(EPOCH FROM (w.ended_at - w.started_at))), 0)',
        'total',
      )
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getRawOne();

    const totalTimeSeconds = parseFloat(totalTimeResult?.total ?? '0');

    const uniqueExercisesResult = await this.logExerciseRepo
      .createQueryBuilder('le')
      .select('COUNT(DISTINCT le.exercise_id)', 'count')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getRawOne();

    const totalUniqueExercises = parseInt(uniqueExercisesResult?.count ?? '0');

    const globalAchievements = await this.achievementRepo.find({
      where: [
        { type: AchievementType.GLOBAL_WORKOUTS },
        { type: AchievementType.GLOBAL_SETS },
        { type: AchievementType.GLOBAL_WEIGHT },
        { type: AchievementType.GLOBAL_TIME },
        { type: AchievementType.GLOBAL_EXERCISES },
      ],
    });

    const unlocked = await this.userAchievementRepo.find({
      where: { userId },
      select: ['achievementId'],
    });
    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

    for (const achievement of globalAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let currentValue = 0;
      switch (achievement.type) {
        case AchievementType.GLOBAL_WORKOUTS:
          currentValue = totalWorkouts;
          break;
        case AchievementType.GLOBAL_SETS:
          currentValue = totalSets;
          break;
        case AchievementType.GLOBAL_WEIGHT:
          currentValue = totalWeight;
          break;
        case AchievementType.GLOBAL_TIME:
          currentValue = totalTimeSeconds;
          break;
        case AchievementType.GLOBAL_EXERCISES:
          currentValue = totalUniqueExercises;
          break;
      }

      if (currentValue >= Number(achievement.threshold)) {
        await this.userAchievementRepo.save(
          this.userAchievementRepo.create({
            userId,
            achievementId: achievement.id,
            value: currentValue,
          }),
        );
      }
    }
  }

  private async tryUnlockAchievement(
    userId: number,
    achievement: AchievementEntity,
    record: UserExerciseRecordEntity | undefined,
  ): Promise<UserAchievementEntity | null> {
    if (!record) return null;

    // Check if already unlocked
    const existing = await this.userAchievementRepo.findOne({
      where: { userId, achievementId: achievement.id },
    });
    if (existing) return null;

    if (record.value >= Number(achievement.threshold)) {
      return await this.userAchievementRepo.save(
        this.userAchievementRepo.create({
          userId,
          achievementId: achievement.id,
          value: record.value,
        }),
      );
    }
    return null;
  }
}
