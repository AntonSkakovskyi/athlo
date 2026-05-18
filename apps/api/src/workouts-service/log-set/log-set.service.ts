import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { CreateLogSetDto } from '../dto/log-set/create-log-set.dto';
import { UpdateLogSetDto } from '../dto/log-set/update-log-set.dto';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class LogSetService {
  constructor(
    @InjectRepository(LogSetEntity)
    private readonly logSetRepository: Repository<LogSetEntity>,
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepository: Repository<LogExerciseEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    private readonly achievementService: AchievementService,
  ) {}

  private async validateOwnership(workoutId: number, logExerciseId: number, userId: number) {
    const workout = await this.workoutRepository.findOne({ where: { id: workoutId } });
    if (!workout) {
      throw new NotFoundException(`Workout with ID ${workoutId} not found`);
    }
    if (workout.userId !== userId) {
      throw new ForbiddenException('You do not have access to this workout');
    }

    const logExercise = await this.logExerciseRepository.findOne({
      where: { id: logExerciseId, workoutId },
    });
    if (!logExercise) {
      throw new NotFoundException(`Log exercise with ID ${logExerciseId} not found in workout ${workoutId}`);
    }

    return logExercise;
  }

  async create(workoutId: number, logExerciseId: number, userId: number, dto: CreateLogSetDto) {
    await this.validateOwnership(workoutId, logExerciseId, userId);

    const set = this.logSetRepository.create({
      logExerciseId,
      ...dto,
    });

    const saved = await this.logSetRepository.save(set);
    await this.achievementService.checkAndUpdateRecords(userId, logExerciseId);
    
    // Return with relations
    return this.logSetRepository.findOne({
      where: { id: saved.id },
      relations: { achievement: true },
    });
  }

  async update(id: number, workoutId: number, logExerciseId: number, userId: number, dto: UpdateLogSetDto) {
    await this.validateOwnership(workoutId, logExerciseId, userId);

    const set = await this.logSetRepository.findOne({
      where: { id, logExerciseId },
    });

    if (!set) {
      throw new NotFoundException(`Set with ID ${id} not found`);
    }

    Object.assign(set, dto);
    const saved = await this.logSetRepository.save(set);
    await this.achievementService.checkAndUpdateRecords(userId, logExerciseId);

    // Return with relations
    return this.logSetRepository.findOne({
      where: { id: saved.id },
      relations: { achievement: true },
    });
  }

  async remove(id: number, workoutId: number, logExerciseId: number, userId: number) {
    await this.validateOwnership(workoutId, logExerciseId, userId);

    const set = await this.logSetRepository.findOne({
      where: { id, logExerciseId },
    });

    if (!set) {
      throw new NotFoundException(`Set with ID ${id} not found`);
    }

    await this.logSetRepository.remove(set);
    await this.achievementService.checkAndUpdateRecords(userId, logExerciseId);
  }
}
