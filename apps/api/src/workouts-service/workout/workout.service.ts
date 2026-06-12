import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateWorkoutDto } from '../dto/workout/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/workout/update-workout.dto';
import { CompleteWorkoutDto } from '../dto/workout/complete-workout.dto';
import { WorkoutStatus, VISIBILITY_TYPE_ID, VisibilityType } from '@athlo/shared';
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
    private readonly dataSource: DataSource,
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

  async findOneReadable(id: number, currentUserId: number) {
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

    if (workout.userId === currentUserId) return workout;

    if (workout.visibilityTypeId === VISIBILITY_TYPE_ID[VisibilityType.PUBLIC]) return workout;

    if (workout.visibilityTypeId === VISIBILITY_TYPE_ID[VisibilityType.FRIENDS_ONLY]) {
      const areFriends = await this.friendService.isFriend(currentUserId, workout.userId);
      if (areFriends) return workout;
    }

    throw new ForbiddenException('You do not have access to this workout');
  }

  async update(id: number, userId: number, dto: UpdateWorkoutDto) {
    const workout = await this.findOne(id, userId);
    const { visibility, ...fields } = dto;
    Object.assign(workout, fields);
    if (visibility) {
      workout.visibilityTypeId = VISIBILITY_TYPE_ID[visibility];
    }
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

    const exercisesForAchievements: number[] = [];

    // Видалення та перезапис сетів — атомарно: збій посередині
    // не залишить тренування без даних
    const saved = await this.dataSource.transaction(async (em) => {
      if (toDelete.length > 0) {
        await em.remove(toDelete);
      }

      for (const fe of finalized) {
        await em.delete(LogSetEntity, { logExerciseId: fe.logExerciseId });
        const newSets = fe.sets.map((s, idx) =>
          em.create(LogSetEntity, {
            logExerciseId: fe.logExerciseId,
            order: idx + 1,
            weight: s.weight ?? null,
            reps: s.reps ?? null,
            duration: s.duration ?? null,
            distance: s.distance ?? null,
            isCompleted: true,
          }),
        );
        await em.save(newSets);
        exercisesForAchievements.push(fe.logExerciseId);
      }

      workout.status = WorkoutStatus.COMPLETED;
      workout.ended_at = new Date();

      if (dto.calories !== undefined) workout.calories = dto.calories;
      if (dto.avgHeartRate !== undefined)
        workout.avgHeartRate = dto.avgHeartRate;
      if (dto.maxHeartRate !== undefined)
        workout.maxHeartRate = dto.maxHeartRate;
      if (dto.rpe !== undefined) workout.rpe = dto.rpe;
      if (dto.feelingScore !== undefined)
        workout.feelingScore = dto.feelingScore;
      if (dto.visibility !== undefined)
        workout.visibilityTypeId = VISIBILITY_TYPE_ID[dto.visibility];
      if (dto.description !== undefined) workout.description = dto.description;

      return em.save(workout);
    });

    // Досягнення — після коміту: їхній збій не відкотить збережене тренування
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
    const original = await this.findOneReadable(id, userId);

    // Копія створюється атомарно: або повне тренування з вправами й сетами,
    // або нічого
    const savedWorkout = await this.dataSource.transaction(async (em) => {
      const workout = em.create(WorkoutEntity, {
        userId,
        name: original.name,
        description: original.description,
        status: WorkoutStatus.IN_PROGRESS,
      });
      const savedCopy = await em.save(workout);

      if (original.logExercises?.length) {
        for (const ex of original.logExercises) {
          const logExercise = em.create(LogExerciseEntity, {
            workoutId: savedCopy.id,
            exerciseId: ex.exerciseId,
            order: ex.order,
            notes: ex.notes,
            restTime: ex.restTime,
          });
          const savedLogExercise = await em.save(logExercise);

          if (ex.sets?.length) {
            const sets = ex.sets.map((s) =>
              em.create(LogSetEntity, {
                logExerciseId: savedLogExercise.id,
                order: s.order,
                weight: s.weight,
                reps: s.reps,
                duration: s.duration,
                distance: s.distance,
                isCompleted: false, // Reset completion status for the new workout
              }),
            );
            await em.save(sets);
          }
        }
      }

      return savedCopy;
    });

    return this.findOne(savedWorkout.id, userId);
  }

  async getLastPerformance(
    userId: number,
    exerciseId: number,
  ): Promise<ILastPerformance | null> {
    const batch = await this.getBatchLastPerformance(userId, [exerciseId]);
    return batch[exerciseId] ?? null;
  }

  async getBatchLastPerformance(
    userId: number,
    exerciseIds: number[],
  ): Promise<Record<number, ILastPerformance>> {
    if (exerciseIds.length === 0) return {};

    // Останній log_exercise кожної вправи (у найсвіжішому завершеному
    // тренуванні) — один запит на весь батч замість 3×N
    const rows: {
      exercise_id: number;
      log_exercise_id: number;
      workout_id: number;
      workout_name: string;
      started_at: Date;
    }[] = await this.logExerciseRepository
      .createQueryBuilder('le')
      .innerJoin('le.workout', 'w')
      .distinctOn(['le.exerciseId'])
      .select('le.exerciseId', 'exercise_id')
      .addSelect('le.id', 'log_exercise_id')
      .addSelect('w.id', 'workout_id')
      .addSelect('w.name', 'workout_name')
      .addSelect('w.started_at', 'started_at')
      .where('w.userId = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere('le.exerciseId IN (:...exerciseIds)', { exerciseIds })
      .orderBy('le.exerciseId')
      .addOrderBy('w.started_at', 'DESC')
      .addOrderBy('le.order', 'DESC')
      .addOrderBy('le.id', 'DESC')
      .getRawMany();

    if (rows.length === 0) return {};

    // Завершені сети всіх знайдених log_exercises — один IN-запит
    const sets = await this.logSetRepository.find({
      where: {
        logExerciseId: In(rows.map((r) => r.log_exercise_id)),
        isCompleted: true,
      },
      order: { order: 'ASC' },
    });
    const setsByLogExercise = new Map<number, LogSetEntity[]>();
    for (const set of sets) {
      const list = setsByLogExercise.get(set.logExerciseId) ?? [];
      list.push(set);
      setsByLogExercise.set(set.logExerciseId, list);
    }

    const result: Record<number, ILastPerformance> = {};
    for (const row of rows) {
      result[row.exercise_id] = {
        workoutId: row.workout_id,
        workoutName: row.workout_name,
        date: new Date(row.started_at).toISOString().split('T')[0],
        sets: setsByLogExercise.get(row.log_exercise_id) ?? [],
      };
    }
    return result;
  }
}
