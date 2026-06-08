import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingTypeEntity } from '../entities/tracking-type.entity';

@Injectable()
export class TrackingTypeService {
  constructor(
    @InjectRepository(TrackingTypeEntity)
    private readonly trackingTypeRepository: Repository<TrackingTypeEntity>,
  ) {}

  findAll(): Promise<TrackingTypeEntity[]> {
    return this.trackingTypeRepository.find({ order: { id: 'ASC' } });
  }
}
