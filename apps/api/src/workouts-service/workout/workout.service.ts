import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { Repository } from 'typeorm';
import { CreateWorkoutDto } from '../dto/workout/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/workout/update-workout.dto';
import { CompleteWorkoutDto } from '../dto/workout/complete-workout.dto';
import { WorkoutStatus } from '@athlo/shared';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutsRepository: Repository<WorkoutEntity>,
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

  async findAllByUser(userId: number) {
    return this.workoutsRepository.find({
      where: { userId },
      order: { started_at: 'DESC' },
    });
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

    return this.workoutsRepository.save(workout);
  }

  async remove(id: number, userId: number) {
    const workout = await this.findOne(id, userId);
    await this.workoutsRepository.remove(workout);
  }
}
