import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealTypeEntity } from '../entities/meal-type.entity';

@Injectable()
export class MealTypeService {
  constructor(
    @InjectRepository(MealTypeEntity)
    private readonly mealTypeRepository: Repository<MealTypeEntity>,
  ) {}

  async findAll() {
    return this.mealTypeRepository.find({ order: { id: 'ASC' } });
  }
}
