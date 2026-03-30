import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ExerciseEntity } from '../entities/exercise.entity';
import { GetExercisesQueryDto } from '../dto/get-exercises-query.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(ExerciseEntity)
    private readonly exerciseRepository: Repository<ExerciseEntity>,
  ) {}

  async findAll(query: GetExercisesQueryDto) {
    const { page = 1, limit = 20, muscleId, equipmentId, search } = query;

    const qb: SelectQueryBuilder<ExerciseEntity> = this.exerciseRepository
      .createQueryBuilder('exercise')
      .leftJoinAndSelect('exercise.equipment', 'equipment')
      .leftJoinAndSelect('exercise.trackingType', 'trackingType')
      .leftJoinAndSelect('exercise.exerciseMuscles', 'exerciseMuscles')
      .leftJoinAndSelect('exerciseMuscles.muscle', 'muscle');

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
}
