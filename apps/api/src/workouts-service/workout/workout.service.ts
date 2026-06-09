import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { In, Repository } from 'typeorm';
import { CreateWorkoutDto } from '../dto/workout/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/workout/update-workout.dto';
import { CompleteWorkoutDto } from '../dto/workout/complete-workout.dto';
import { WorkoutStatus } from '@athlo/shared';
import { LogSetEntity } from '../entities/log-set.entity';
import { ILastPerformance } from '@athlo/shared';
import { AchievementService } from '../achievement/achievement.service';
import { FriendService } from '../../user-service/friends/friend.service';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutsRepository: Repository<WorkoutEntity>,
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepository: Repository<LogExerciseEntity>,
    @InjectRepository(LogSetEntity)
    private readonly logSetRepository: Repository<LogSetEntity>,
    private readonly achievementService: AchievementService,
    private readonly friendService: FriendService,
  ) {}

  async create(userId: number, dto: CreateWorkoutDto) {
    const workout = this.workoutsRepository.create({
      userId,
      name: dto.name,
      description: dto.description,
      status: WorkoutStatus.IN_PROGRESS,
    });
    return this.workoutsRepository.save(workout);
  }

  async findWorkoutsForUser(
    currentUserId: number,
    targetUserId: number,
    page = 1,
    limit = 10,
  ) {
    const isFriend = await this.friendService.isFriend(
      currentUserId,
      targetUserId,
    );
    const visibilityIds = [2]; // PUBLIC
    if (isFriend) {
      visibilityIds.push(3); // FRIENDS_ONLY
    }

    const [data, total] = await this.workoutsRepository.findAndCount({
      where: {
        userId: targetUserId,
        status: WorkoutStatus.COMPLETED,
        visibilityTypeId: In(visibilityIds),
      },
      relations: {
        logExercises: {
          exercise: true,
          sets: {
            achievement: true,
          },
        },
      },
      order: {
        started_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllByUser(
    userId: number,
    page = 1,
    limit = 10,
    status?: WorkoutStatus,
  ) {
    const [data, total] = await this.workoutsRepository.findAndCount({
      where: status ? { userId, status } : { userId },
      relations: {
        logExercises: {
          exercise: true,
          sets: {
            achievement: true,
          },
        },
      },
      order: {
        started_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Sort relations in memory since TypeORM pagination breaks when ordering by relations
    data.forEach((workout) => {
      if (workout.logExercises) {
        workout.logExercises.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        workout.logExercises.forEach((le) => {
          if (le.sets) {
            le.sets.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }
        });
      }
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number) {
    const workout = await this.workoutsRepository.findOne({
      where: { id },
      relations: {
        logExercises: {
          exercise: true,
          sets: {
            achievement: true,
          },
        },
      },
      order: {
        logExercises: {
          order: 'ASC',
          sets: { order: 'ASC' },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException(`Workout with ID ${id} not found`);
    }

    if (workout.userId !== userId) {
      throw new ForbiddenException('You do not have access to this workout');
    }

    return workout;
  }

  async update(id: number, userId: number, dto: UpdateWorkoutDto) {
    const workout = await this.findOne(id, userId);
    Object.assign(workout, dto);
    return this.workoutsRepository.save(workout);
  }

  async complete(id: number, userId: number, dto: CompleteWorkoutDto) {
    const workout = await this.findOne(id, userId);

    const finalized = (dto.finalizedExercises ?? []).filter(
      (fe) => fe.sets && fe.sets.length > 0,
    );

    if (finalized.length === 0) {
      throw new BadRequestException(
        'Workout must have at least one completed set',
      );
    }

    const ownLogExerciseIds = new Set(
      (workout.logExercises ?? []).map((le) => le.id),
    );
    for (const fe of finalized) {
      if (!ownLogExerciseIds.has(fe.logExerciseId)) {
        throw new BadRequestException(
          `LogExercise ${fe.logExerciseId} does not belong to this workout`,
        );
      }
    }

    const finalizedIds = new Set(finalized.map((fe) => fe.logExerciseId));
    const toDelete = (workout.logExercises ?? []).filter(
      (le) => !finalizedIds.has(le.id),
    );
    if (toDelete.length > 0) {
      await this.logExerciseRepository.remove(toDelete);
    }

    const exercisesForAchievements: number[] = [];
    for (const fe of finalized) {
      await this.logSetRepository.delete({ logExerciseId: fe.logExerciseId });
      const newSets = fe.sets.map((s, idx) =>
        this.logSetRepository.create({
          logExerciseId: fe.logExerciseId,
          order: idx + 1,
          weight: s.weight ?? null,
          reps: s.reps ?? null,
          duration: s.duration ?? null,
          distance: s.distance ?? null,
          isCompleted: true,
        }),
      );
      await this.logSetRepository.save(newSets);
      exercisesForAchievements.push(fe.logExerciseId);
    }

    workout.status = WorkoutStatus.COMPLETED;
    workout.ended_at = new Date();

    if (dto.calories !== undefined) workout.calories = dto.calories;
    if (dto.avgHeartRate !== undefined) workout.avgHeartRate = dto.avgHeartRate;
    if (dto.maxHeartRate !== undefined) workout.maxHeartRate = dto.maxHeartRate;
    if (dto.rpe !== undefined) workout.rpe = dto.rpe;
    if (dto.feelingScore !== undefined) workout.feelingScore = dto.feelingScore;

    const saved = await this.workoutsRepository.save(workout);

    for (const logExerciseId of exercisesForAchievements) {
      await this.achievementService.checkAndUpdateRecords(
        userId,
        logExerciseId,
      );
    }
    await this.achievementService.checkGlobalAchievements(userId);

    return saved;
  }

  async remove(id: number, userId: number) {
    const workout = await this.findOne(id, userId);
    await this.workoutsRepository.delete({ id: workout.id });
  }

  async copyWorkout(id: number, userId: number) {
    const original = await this.findOne(id, userId);

    const workout = this.workoutsRepository.create({
      userId,
      name: original.name,
      description: original.description,
      status: WorkoutStatus.IN_PROGRESS,
    });
    const savedWorkout = await this.workoutsRepository.save(workout);

    if (original.logExercises?.length) {
      for (const ex of original.logExercises) {
        const logExercise = this.logExerciseRepository.create({
          workoutId: savedWorkout.id,
          exerciseId: ex.exerciseId,
          order: ex.order,
          notes: ex.notes,
          restTime: ex.restTime,
        });
        const savedLogExercise =
          await this.logExerciseRepository.save(logExercise);

        if (ex.sets?.length) {
          const sets = ex.sets.map((s) =>
            this.logSetRepository.create({
              logExerciseId: savedLogExercise.id,
              order: s.order,
              weight: s.weight,
              reps: s.reps,
              duration: s.duration,
              distance: s.distance,
              isCompleted: false, // Reset completion status for the new workout
            }),
          );
          await this.logSetRepository.save(sets);
        }
      }
    }

    return this.findOne(savedWorkout.id, userId);
  }

  async getLastPerformance(
    userId: number,
    exerciseId: number,
  ): Promise<ILastPerformance | null> {
    // Find the most recent completed workout containing this exercise
    const workout = await this.workoutsRepository
      .createQueryBuilder('w')
      .innerJoin('w.logExercises', 'le')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere('le.exercise_id = :exerciseId', { exerciseId })
      .orderBy('w.started_at', 'DESC')
      .getOne();

    if (!workout) return null;

    // Pick the latest log_exercise instance for this exerciseId in the workout
    // (a user can add the same exercise more than once in a workout).
    const logExercise = await this.logExerciseRepository
      .createQueryBuilder('le')
      .where('le.workout_id = :workoutId', { workoutId: workout.id })
      .andWhere('le.exercise_id = :exerciseId', { exerciseId })
      .orderBy('le.order', 'DESC')
      .addOrderBy('le.id', 'DESC')
      .getOne();

    if (!logExercise) return null;

    const sets = await this.logSetRepository
      .createQueryBuilder('ls')
      .where('ls.log_exercise_id = :logExerciseId', {
        logExerciseId: logExercise.id,
      })
      .andWhere('ls.is_completed = :isCompleted', { isCompleted: true })
      .orderBy('ls.order', 'ASC')
      .getMany();

    return {
      workoutId: workout.id,
      workoutName: workout.name,
      date: workout.started_at.toISOString().split('T')[0],
      sets,
    };
  }

  async getBatchLastPerformance(
    userId: number,
    exerciseIds: number[],
  ): Promise<Record<number, ILastPerformance>> {
    const result: Record<number, ILastPerformance> = {};

    for (const exerciseId of exerciseIds) {
      const performance = await this.getLastPerformance(userId, exerciseId);
      if (performance) {
        result[exerciseId] = performance;
      }
    }

    return result;
  }
}
