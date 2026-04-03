import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      order: { updatedAt: 'DESC' },
    });
  }

  async getExerciseRecord(userId: number, exerciseId: number) {
    return this.userExerciseRecordRepo.findOne({
      where: { userId, exerciseId },
    });
  }

  /**
   * Called after a set is created/updated.
   * Updates personal records and checks exercise-specific achievements.
   */
  async checkAndUpdateRecords(userId: number, logExerciseId: number): Promise<void> {
    const logExercise = await this.logExerciseRepo.findOne({
      where: { id: logExerciseId },
      relations: { exercise: { trackingType: true }, sets: true },
    });
    if (!logExercise) return;

    const exerciseId = logExercise.exerciseId;
    const trackingTypeName = logExercise.exercise?.trackingType?.name ?? 'WEIGHT_AND_REPS';

    // Get or create the user exercise record
    let record = await this.userExerciseRecordRepo.findOne({
      where: { userId, exerciseId },
    });

    if (!record) {
      record = this.userExerciseRecordRepo.create({ userId, exerciseId });
    }

    let updated = false;

    // Evaluate all completed sets for this log exercise
    for (const set of logExercise.sets) {
      if (!set.isCompleted) continue;

      switch (trackingTypeName) {
        case 'WEIGHT_AND_REPS': {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          if (weight > 0 && (record.bestWeight === null || weight > Number(record.bestWeight))) {
            record.bestWeight = weight;
            updated = true;
          }
          if (reps > 0 && (record.bestReps === null || reps > Number(record.bestReps))) {
            record.bestReps = reps;
            updated = true;
          }
          // Epley formula: 1RM = weight × (1 + reps / 30)
          if (weight > 0 && reps > 0) {
            const estimated = weight * (1 + reps / 30);
            const rounded = parseFloat(estimated.toFixed(2));
            if (record.estimated1rm === null || rounded > Number(record.estimated1rm)) {
              record.estimated1rm = rounded;
              updated = true;
            }
          }
          break;
        }
        case 'REPS_ONLY': {
          const reps = Number(set.reps) || 0;
          if (reps > 0 && (record.bestReps === null || reps > Number(record.bestReps))) {
            record.bestReps = reps;
            updated = true;
          }
          break;
        }
        case 'TIME_BASED': {
          const duration = Number(set.duration) || 0;
          const distance = Number(set.distance) || 0;
          if (duration > 0 && (record.bestDuration === null || duration > Number(record.bestDuration))) {
            record.bestDuration = duration;
            updated = true;
          }
          if (distance > 0 && (record.bestDistance === null || distance > Number(record.bestDistance))) {
            record.bestDistance = distance;
            updated = true;
          }
          break;
        }
      }
    }

    if (updated) {
      await this.userExerciseRecordRepo.save(record);

      // Check exercise-specific achievements
      const exerciseAchievements = await this.achievementRepo.find({
        where: { type: AchievementType.EXERCISE_PERSONAL_RECORD, exerciseId },
      });

      for (const achievement of exerciseAchievements) {
        await this.tryUnlockAchievement(userId, achievement, record);
      }
    }
  }

  /**
   * Called after a workout is completed.
   * Checks global achievements (workouts, sets, weight).
   */
  async checkGlobalAchievements(userId: number): Promise<void> {
    // Total completed workouts
    const totalWorkouts = await this.workoutRepo.count({
      where: { userId, status: WorkoutStatus.COMPLETED },
    });

    // Total completed sets
    const totalSets = await this.logSetRepo
      .createQueryBuilder('ls')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getCount();

    // Total weight lifted (weight * reps)
    const totalWeightResult = await this.logSetRepo
      .createQueryBuilder('ls')
      .select('COALESCE(SUM(ls.weight * ls.reps), 0)', 'total')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getRawOne();

    const totalWeight = parseFloat(totalWeightResult?.total ?? '0');

    // Get all global achievements
    const globalAchievements = await this.achievementRepo.find({
      where: [
        { type: AchievementType.GLOBAL_WORKOUTS },
        { type: AchievementType.GLOBAL_SETS },
        { type: AchievementType.GLOBAL_WEIGHT },
      ],
    });

    // Get already unlocked achievement IDs for this user
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
    record: UserExerciseRecordEntity,
  ): Promise<void> {
    // Check if already unlocked
    const existing = await this.userAchievementRepo.findOne({
      where: { userId, achievementId: achievement.id },
    });
    if (existing) return;

    let currentValue = 0;
    switch (achievement.trackingMetric) {
      case 'WEIGHT':
        currentValue = Number(record.bestWeight) || 0;
        break;
      case 'REPS':
        currentValue = Number(record.bestReps) || 0;
        break;
      case 'DURATION':
        currentValue = Number(record.bestDuration) || 0;
        break;
      case 'DISTANCE':
        currentValue = Number(record.bestDistance) || 0;
        break;
      case 'ESTIMATED_1RM':
        currentValue = Number(record.estimated1rm) || 0;
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
