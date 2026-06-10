import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { CreateLogExerciseDto } from '../dto/log-exercise/create-log-exercise.dto';
import { UpdateLogExerciseDto } from '../dto/log-exercise/update-log-exercise.dto';
import { WorkoutService } from '../workout/workout.service';

@Injectable()
export class LogExerciseService {
  constructor(
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepository: Repository<LogExerciseEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    private readonly workoutService: WorkoutService,
    private readonly dataSource: DataSource,
  ) {}

  private async validateWorkoutOwnership(
    workoutId: number,
    userId: number,
  ): Promise<WorkoutEntity> {
    const workout = await this.workoutRepository.findOne({
      where: { id: workoutId },
    });
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

    const lastPerformance = await this.workoutService.getLastPerformance(
      userId,
      dto.exerciseId,
    );
    const prevSets = lastPerformance?.sets ?? [];

    // Вправа разом із prefill-сетами (порожні рядки за кількістю сетів
    // минулого виконання) створюється атомарно — клієнт не шле N окремих POST-ів
    return this.dataSource.transaction(async (em) => {
      const logExercise = em.create(LogExerciseEntity, {
        workoutId,
        exerciseId: dto.exerciseId,
        order: dto.order,
        notes: dto.notes,
        restTime: dto.restTime ?? 0,
      });
      const saved = await em.save(logExercise);

      saved.sets =
        prevSets.length > 0
          ? await em.save(
              prevSets.map((_, idx) =>
                em.create(LogSetEntity, {
                  logExerciseId: saved.id,
                  order: idx + 1,
                  isCompleted: false,
                }),
              ),
            )
          : [];

      return saved;
    });
  }

  async update(
    id: number,
    workoutId: number,
    userId: number,
    dto: UpdateLogExerciseDto,
  ) {
    await this.validateWorkoutOwnership(workoutId, userId);

    const logExercise = await this.logExerciseRepository.findOne({
      where: { id, workoutId },
    });

    if (!logExercise) {
      throw new NotFoundException(
        `Log exercise with ID ${id} not found in workout ${workoutId}`,
      );
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
      throw new NotFoundException(
        `Log exercise with ID ${id} not found in workout ${workoutId}`,
      );
    }

    await this.logExerciseRepository.remove(logExercise);
  }
}
