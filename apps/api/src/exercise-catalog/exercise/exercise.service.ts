import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { WorkoutStatus } from '@athlo/shared';
import { ExerciseEntity } from '../entities/exercise.entity';
import { ExerciseMuscleEntity } from '../entities/exercise-muscle.entity';
import { LogExerciseEntity } from '../../workouts-service/entities/log-exercise.entity';
import { TemplateExerciseEntity } from '../../workouts-service/entities/template-exercise.entity';
import { GetExercisesQueryDto } from '../dto/get-exercises-query.dto';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(ExerciseEntity)
    private readonly exerciseRepository: Repository<ExerciseEntity>,
    @InjectRepository(ExerciseMuscleEntity)
    private readonly exerciseMuscleRepository: Repository<ExerciseMuscleEntity>,
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepository: Repository<LogExerciseEntity>,
    @InjectRepository(TemplateExerciseEntity)
    private readonly templateExerciseRepository: Repository<TemplateExerciseEntity>,
  ) {}

  async findAll(query: GetExercisesQueryDto, userId?: number) {
    const { page = 1, limit = 20, muscleId, equipmentId, search } = query;

    const qb: SelectQueryBuilder<ExerciseEntity> = this.exerciseRepository
      .createQueryBuilder('exercise')
      .leftJoinAndSelect('exercise.equipment', 'equipment')
      .leftJoinAndSelect('exercise.trackingType', 'trackingType')
      .leftJoinAndSelect('exercise.exerciseMuscles', 'exerciseMuscles')
      .leftJoinAndSelect('exerciseMuscles.muscle', 'muscle')
      .andWhere('exercise.deletedAt IS NULL');

    if (userId) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('exercise.userId IS NULL')
            .orWhere('exercise.userId = :userId', { userId });
        }),
      );
    } else {
      qb.andWhere('exercise.userId IS NULL');
    }

    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('exercise.name ILIKE :search', { search: `%${search}%` })
            .orWhere('equipment.name ILIKE :search', { search: `%${search}%` })
            .orWhere('muscle.name ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (equipmentId) {
      if (equipmentId === -1) {
        qb.andWhere('exercise.equipmentId IS NULL');
      } else {
        qb.andWhere('exercise.equipmentId = :equipmentId', { equipmentId });
      }
    }

    if (muscleId) {
      qb.andWhere('exerciseMuscles.muscleId = :muscleId', { muscleId });
    }

    if (userId) {
      qb.addSelect((subQuery) => {
        return subQuery
          .select('COUNT(ls_sub.id)', 'count')
          .from('log_sets', 'ls_sub')
          .innerJoin(
            'log_exercises',
            'le_sub',
            'le_sub.id = ls_sub.log_exercise_id',
          )
          .innerJoin('workouts', 'w_sub', 'w_sub.id = le_sub.workout_id')
          .where('le_sub.exercise_id = exercise.id')
          .andWhere('w_sub.user_id = :userId', { userId })
          .andWhere('w_sub.status = :status', {
            status: WorkoutStatus.COMPLETED,
          })
          .andWhere('ls_sub.is_completed = true');
      }, 'frequency');
      qb.orderBy('frequency', 'DESC');
    }

    qb.addOrderBy('exercise.name', 'ASC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    if (userId && data.length > 0) {
      const exerciseIds = data.map((e) => e.id);
      const stats = await this.exerciseRepository.manager
        .createQueryBuilder()
        .select('le.exercise_id', 'exerciseId')
        .addSelect('COUNT(DISTINCT ls.id)::int', 'totalSets')
        .addSelect('COUNT(DISTINCT w.id)::int', 'totalWorkouts')
        .from('log_sets', 'ls')
        .innerJoin('log_exercises', 'le', 'le.id = ls.log_exercise_id')
        .innerJoin('workouts', 'w', 'w.id = le.workout_id')
        .where('le.exercise_id IN (:...exerciseIds)', { exerciseIds })
        .andWhere('w.user_id = :userId', { userId })
        .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
        .andWhere('ls.is_completed = true')
        .groupBy('le.exercise_id')
        .getRawMany();

      const statsMap = stats.reduce(
        (acc, s) => {
          acc[s.exerciseId] = s;
          return acc;
        },
        {} as Record<number, { totalSets: number; totalWorkouts: number }>,
      );

      data.forEach((ex) => {
        (ex as any).totalSets = statsMap[ex.id]?.totalSets || 0;
        (ex as any).totalWorkouts = statsMap[ex.id]?.totalWorkouts || 0;
      });
    }

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

  async findById(id: number, userId?: number) {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
      relations: {
        equipment: true,
        trackingType: true,
        exerciseMuscles: { muscle: true },
      },
      withDeleted: false,
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    if (exercise.userId !== null && exercise.userId !== userId) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    const logSetsCount = await this.logExerciseRepository.count({
      where: { exerciseId: id },
    });
    (exercise as any).hasLoggedHistory = logSetsCount > 0;

    return exercise;
  }

  async create(userId: number, dto: CreateExerciseDto) {
    const exercise = this.exerciseRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      equipmentId: dto.equipmentId ?? null,
      trackingTypeId: dto.trackingTypeId,
      userId,
      visibilityTypeId: 1,
    });

    const saved = await this.exerciseRepository.save(exercise);

    if (dto.muscles?.length) {
      const muscles = dto.muscles.map((m) =>
        this.exerciseMuscleRepository.create({
          exerciseId: saved.id,
          muscleId: m.muscleId,
          isPrimary: m.isPrimary ?? true,
          impactPercentage: m.impactPercentage ?? 100,
        }),
      );
      await this.exerciseMuscleRepository.save(muscles);
    }

    return this.findById(saved.id, userId);
  }

  async update(id: number, userId: number, dto: UpdateExerciseDto) {
    const exercise = await this.exerciseRepository.findOne({ where: { id } });
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    if (exercise.userId !== userId) {
      throw new ForbiddenException('You can only update your own exercises');
    }

    if (
      dto.trackingTypeId !== undefined &&
      dto.trackingTypeId !== exercise.trackingTypeId
    ) {
      const logCount = await this.logExerciseRepository.count({
        where: { exerciseId: id },
      });
      if (logCount > 0) {
        throw new ConflictException(
          'Cannot change tracking type — exercise has logged history',
        );
      }
    }

    if (dto.name !== undefined) exercise.name = dto.name;
    if (dto.description !== undefined)
      exercise.description = dto.description ?? null;
    if (dto.equipmentId !== undefined)
      exercise.equipmentId = dto.equipmentId ?? null;
    if (dto.trackingTypeId !== undefined)
      exercise.trackingTypeId = dto.trackingTypeId;

    await this.exerciseRepository.save(exercise);

    if (dto.muscles !== undefined) {
      await this.exerciseMuscleRepository.delete({ exerciseId: id });

      if (dto.muscles.length) {
        const muscles = dto.muscles.map((m) =>
          this.exerciseMuscleRepository.create({
            exerciseId: id,
            muscleId: m.muscleId,
            isPrimary: m.isPrimary ?? true,
            impactPercentage: m.impactPercentage ?? 100,
          }),
        );
        await this.exerciseMuscleRepository.save(muscles);
      }
    }

    return this.findById(id, userId);
  }

  async remove(id: number, userId: number) {
    const exercise = await this.exerciseRepository.findOne({ where: { id } });
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    if (exercise.userId !== userId) {
      throw new ForbiddenException('You can only delete your own exercises');
    }

    const [logCount, templateCount] = await Promise.all([
      this.logExerciseRepository.count({ where: { exerciseId: id } }),
      this.templateExerciseRepository.count({ where: { exerciseId: id } }),
    ]);

    if (logCount > 0 || templateCount > 0) {
      await this.exerciseRepository.softDelete(id);
    } else {
      await this.exerciseRepository.remove(exercise);
    }

    return { message: 'Exercise deleted successfully' };
  }
}
