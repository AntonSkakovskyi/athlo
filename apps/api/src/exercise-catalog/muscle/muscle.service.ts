import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MuscleEntity } from '../entities/muscle.entity';

@Injectable()
export class MuscleService {
  constructor(
    @InjectRepository(MuscleEntity)
    private readonly muscleRepository: Repository<MuscleEntity>,
  ) {}

  findAll() {
    return this.muscleRepository.find({ order: { name: 'ASC' } });
  }
}
