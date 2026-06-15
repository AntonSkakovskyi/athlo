import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AchievementEntity } from './entities/achievement.entity';
import { UserAchievementEntity } from './entities/user-achievement.entity';
import { UserExerciseRecordEntity } from './entities/user-exercise-record.entity';
import { TrackingMetricEntity } from '../../exercise-catalog/entities/tracking-metric.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import {
  AchievementType,
  TrackingMetric,
  TrackingType,
  WorkoutStatus,
} from '@athlo/shared';

@Injectable()
export class AchievementService {
  private metricIdCache: Map<string, number> | null = null;

  constructor(
    @InjectRepository(AchievementEntity)
    private readonly achievementRepo: Repository<AchievementEntity>,
    @InjectRepository(UserAchievementEntity)
    private readonly userAchievementRepo: Repository<UserAchievementEntity>,
    @InjectRepository(UserExerciseRecordEntity)
    private readonly userExerciseRecordRepo: Repository<UserExerciseRecordEntity>,
    @InjectRepository(TrackingMetricEntity)
    private readonly trackingMetricRepo: Repository<TrackingMetricEntity>,
    @InjectRepository(LogSetEntity)
    private readonly logSetRepo: Repository<LogSetEntity>,
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepo: Repository<LogExerciseEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepo: Repository<WorkoutEntity>,
  ) {}

  private async ensureMetricCache(): Promise<Map<string, number>> {
    if (!this.metricIdCache) {
      const metrics = await this.trackingMetricRepo.find();
      this.metricIdCache = new Map(metrics.map((m) => [m.name, m.id]));
    }
    return this.metricIdCache;
  }

  async getAll() {
    return this.achievementRepo.find({
      relations: { trackingMetricRelation: true },
      order: { type: 'ASC', threshold: 'ASC' },
    });
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
      relations: { trackingMetric: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getExerciseRecord(userId: number, exerciseId: number) {
    return this.userExerciseRecordRepo.find({
      where: { userId, exerciseId },
      relations: { trackingMetric: true },
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
    const trackingTypeName = (logExercise.exercise?.trackingType?.name ??
      TrackingType.WEIGHT_AND_REPS) as TrackingType;

    const metricIds = await this.ensureMetricCache();
    const getMetricId = (name: TrackingMetric): number => metricIds.get(name)!;

    // Sort sets by order to correctly identify the first set that broke the record
    const sets = [...logExercise.sets].sort((a, b) => a.order - b.order);
    const logSetIds = sets.map((s) => s.id);

    // Rollback: clear any existing PR records for this specific set of logs
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

    // Досягнення цієї вправи — один запит на весь перерахунок, а не в циклі по сетах
    const exerciseAchievements = await this.achievementRepo.find({
      where: { type: AchievementType.EXERCISE_PERSONAL_RECORD, exerciseId },
    });

    const getAbsoluteMax = (metricTypeId: number) => {
      const records = currentRecords.filter((r) => r.metricTypeId === metricTypeId);
      if (records.length === 0) return 0;
      return Math.max(...records.map((r) => Number(r.value)));
    };

    const newRecordsToSave: UserExerciseRecordEntity[] = [];
    const setsToSave: LogSetEntity[] = [];

    for (const set of sets) {
      if (!set.isCompleted) {
        if (set.isPR || set.achievementId) {
          set.isPR = false;
          set.achievementId = null;
          setsToSave.push(set);
        }
        continue;
      }

      let setIsPR = false;
      let triggeredAchievementId: number | null = null;

      const checkMetric = (metricType: TrackingMetric, newValue: number) => {
        if (newValue > 0) {
          const metricTypeId = getMetricId(metricType);
          const currentMax = getAbsoluteMax(metricTypeId);
          if (newValue > currentMax) {
            const newRecord = this.userExerciseRecordRepo.create({
              userId,
              exerciseId,
              metricTypeId,
              value: newValue,
              logSetId: set.id,
            });
            newRecordsToSave.push(newRecord);
            currentRecords.push(newRecord);
            setIsPR = true;
          }
        }
      };

      switch (trackingTypeName) {
        case TrackingType.WEIGHT_AND_REPS: {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          checkMetric(TrackingMetric.WEIGHT, weight);
          checkMetric(TrackingMetric.REPS, reps);
          if (weight > 0 && reps > 0) {
            checkMetric(TrackingMetric.VOLUME, weight * reps);
            const estimated = parseFloat((weight * (1 + reps / 30)).toFixed(2));
            checkMetric(TrackingMetric.ESTIMATED_1RM, estimated);
          }
          break;
        }
        case TrackingType.REPS_ONLY: {
          const reps = Number(set.reps) || 0;
          checkMetric(TrackingMetric.REPS, reps);
          break;
        }
        case TrackingType.TIME_BASED: {
          const duration = Number(set.duration) || 0;
          checkMetric(TrackingMetric.DURATION, duration);
          break;
        }
        case TrackingType.DISTANCE_AND_TIME: {
          const duration = Number(set.duration) || 0;
          const distance = Number(set.distance) || 0;
          checkMetric(TrackingMetric.DURATION, duration);
          checkMetric(TrackingMetric.DISTANCE, distance);
          break;
        }
        case TrackingType.DISTANCE_ONLY: {
          const distance = Number(set.distance) || 0;
          checkMetric(TrackingMetric.DISTANCE, distance);
          break;
        }
      }

      if (setIsPR) {
        set.isPR = true;

        for (const achievement of exerciseAchievements) {
          if (achievement.trackingMetricId == null) continue;
          const newlyAddedRecord = newRecordsToSave.find(
            (r) =>
              r.metricTypeId === achievement.trackingMetricId &&
              r.logSetId === set.id,
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
        setsToSave.push(set);
      } else {
        if (set.isPR || set.achievementId) {
          set.isPR = false;
          set.achievementId = null;
          setsToSave.push(set);
        }
      }
    }

    // Сети та рекорди зберігаються батчем — два запити замість запиту на сет
    if (setsToSave.length > 0) {
      await this.logSetRepo.save(setsToSave);
    }
    if (newRecordsToSave.length > 0) {
      await this.userExerciseRecordRepo.save(newRecordsToSave);
    }

    // Re-check exercise achievements: revoke if actual max no longer meets threshold.
    const existingUnlocks =
      exerciseAchievements.length > 0
        ? await this.userAchievementRepo.find({
            where: {
              userId,
              achievementId: In(exerciseAchievements.map((a) => a.id)),
            },
          })
        : [];
    const unlocksByAchievement = new Map(
      existingUnlocks.map((u) => [u.achievementId, u]),
    );

    for (const achievement of exerciseAchievements) {
      if (achievement.trackingMetricId == null) continue;

      const allRecords = currentRecords.filter(
        (r) => r.metricTypeId === achievement.trackingMetricId,
      );
      const currentMax =
        allRecords.length > 0
          ? Math.max(...allRecords.map((r) => Number(r.value)))
          : 0;

      const existing = unlocksByAchievement.get(achievement.id);

      if (!existing) {
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
      .andWhere('ls.is_completed = true')
      .andWhere('ls.weight IS NOT NULL')
      .andWhere('ls.reps IS NOT NULL')
      .getRawOne();

    const rawWeight = parseFloat(totalWeightResult?.total ?? '0');
    const totalWeight = Number.isFinite(rawWeight) ? rawWeight : 0;

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
