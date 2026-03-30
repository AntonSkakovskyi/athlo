import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { CreateLogExerciseDto } from '../dto/log-exercise/create-log-exercise.dto';
import { UpdateLogExerciseDto } from '../dto/log-exercise/update-log-exercise.dto';

@Injectable()
export class LogExerciseService {
  constructor(
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepository: Repository<LogExerciseEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
  ) {}

  private async validateWorkoutOwnership(workoutId: number, userId: number): Promise<WorkoutEntity> {
    const workout = await this.workoutRepository.findOne({ where: { id: workoutId } });
    if (!workout) {
      throw new NotFoundException(`Workout with ID ${workoutId} not found`);
    }
    if (workout.userId !== userId) {
      throw new ForbiddenException('You do not have access to this workout');
    }
    return workout;
  }

  async create(workoutId: number, userId: number, dto: CreateLogExerciseDto) {
    await this.validateWorkoutOwnership(workoutId, userId);

    const logExercise = this.logExerciseRepository.create({
      workoutId,
      exerciseId: dto.exerciseId,
      order: dto.order,
      notes: dto.notes,
      restTime: dto.restTime ?? 0,
    });

    return this.logExerciseRepository.save(logExercise);
  }

  async update(id: number, workoutId: number, userId: number, dto: UpdateLogExerciseDto) {
    await this.validateWorkoutOwnership(workoutId, userId);

    const logExercise = await this.logExerciseRepository.findOne({
      where: { id, workoutId },
    });

    if (!logExercise) {
      throw new NotFoundException(`Log exercise with ID ${id} not found in workout ${workoutId}`);
    }

    Object.assign(logExercise, dto);
    return this.logExerciseRepository.save(logExercise);
  }

  async remove(id: number, workoutId: number, userId: number) {
    await this.validateWorkoutOwnership(workoutId, userId);

    const logExercise = await this.logExerciseRepository.findOne({
      where: { id, workoutId },
    });

    if (!logExercise) {
      throw new NotFoundException(`Log exercise with ID ${id} not found in workout ${workoutId}`);
    }

    await this.logExerciseRepository.remove(logExercise);
  }
}
