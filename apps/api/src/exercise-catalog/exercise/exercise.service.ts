import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { ExerciseEntity } from '../entities/exercise.entity';
import { ExerciseMuscleEntity } from '../entities/exercise-muscle.entity';
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
  ) {}

  async findAll(query: GetExercisesQueryDto, userId?: number) {
    const { page = 1, limit = 20, muscleId, equipmentId, search } = query;

    const qb: SelectQueryBuilder<ExerciseEntity> = this.exerciseRepository
      .createQueryBuilder('exercise')
      .leftJoinAndSelect('exercise.equipment', 'equipment')
      .leftJoinAndSelect('exercise.trackingType', 'trackingType')
      .leftJoinAndSelect('exercise.exerciseMuscles', 'exerciseMuscles')
      .leftJoinAndSelect('exerciseMuscles.muscle', 'muscle');

    if (userId) {
      qb.andWhere(
        new Brackets((sub) => {
          sub.where('exercise.userId IS NULL').orWhere('exercise.userId = :userId', { userId });
        }),
      );
    } else {
      qb.andWhere('exercise.userId IS NULL');
    }

    if (search) {
      qb.andWhere('exercise.name ILIKE :search', { search: `%${search}%` });
    }

    if (equipmentId) {
      qb.andWhere('exercise.equipmentId = :equipmentId', { equipmentId });
    }

    if (muscleId) {
      qb.andWhere('exerciseMuscles.muscleId = :muscleId', { muscleId });
    }

    qb.orderBy('exercise.name', 'ASC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

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
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    if (exercise.userId !== null && exercise.userId !== userId) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

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

    if (dto.name !== undefined) exercise.name = dto.name;
    if (dto.description !== undefined) exercise.description = dto.description ?? null;
    if (dto.equipmentId !== undefined) exercise.equipmentId = dto.equipmentId ?? null;
    if (dto.trackingTypeId !== undefined) exercise.trackingTypeId = dto.trackingTypeId;

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

    await this.exerciseRepository.remove(exercise);

    return { message: 'Exercise deleted successfully' };
  }
}
