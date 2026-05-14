import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { Repository } from 'typeorm';
import { CreateWorkoutDto } from '../dto/workout/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/workout/update-workout.dto';
import { CompleteWorkoutDto } from '../dto/workout/complete-workout.dto';
import { WorkoutStatus } from '@athlo/shared';
import { LogSetEntity } from '../entities/log-set.entity';
import type { ILastPerformance } from '@athlo/shared';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutsRepository: Repository<WorkoutEntity>,
    @InjectRepository(LogSetEntity)
    private readonly logSetRepository: Repository<LogSetEntity>,
    private readonly achievementService: AchievementService,
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

  async findAllByUser(userId: number, page = 1, limit = 10) {
    const [data, total] = await this.workoutsRepository.findAndCount({
      where: { userId },
      relations: {
        logExercises: {
          exercise: true,
          sets: true,
        },
      },
      order: {
        started_at: 'DESC',
        logExercises: { order: 'ASC' },
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

  async findOne(id: number, userId: number) {
    const workout = await this.workoutsRepository.findOne({
      where: { id },
      relations: {
        logExercises: {
          exercise: true,
          sets: true,
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
    workout.status = WorkoutStatus.COMPLETED;
    workout.ended_at = new Date();

    if (dto.calories !== undefined) workout.calories = dto.calories;
    if (dto.avgHeartRate !== undefined) workout.avgHeartRate = dto.avgHeartRate;
    if (dto.maxHeartRate !== undefined) workout.maxHeartRate = dto.maxHeartRate;
    if (dto.rpe !== undefined) workout.rpe = dto.rpe;
    if (dto.feelingScore !== undefined) workout.feelingScore = dto.feelingScore;

    const saved = await this.workoutsRepository.save(workout);
    await this.achievementService.checkGlobalAchievements(userId);
    return saved;
  }

  async remove(id: number, userId: number) {
    const workout = await this.findOne(id, userId);
    await this.workoutsRepository.remove(workout);
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

    // Get the sets for this exercise in that workout
    const sets = await this.logSetRepository
      .createQueryBuilder('ls')
      .innerJoin('ls.logExercise', 'le')
      .where('le.workout_id = :workoutId', { workoutId: workout.id })
      .andWhere('le.exercise_id = :exerciseId', { exerciseId })
      .orderBy('ls.order', 'ASC')
      .getMany();

    return {
      workoutId: workout.id,
      workoutName: workout.name,
      date: (workout.started_at as Date).toISOString().split('T')[0],
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
