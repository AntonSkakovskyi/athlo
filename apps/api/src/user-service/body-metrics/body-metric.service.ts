import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyMetricEntity } from './entities/body-metric.entity';
import { MetricTypeEntity } from './entities/metric-type.entity';
import { UnitEntity } from './entities/unit.entity';
import { CreateBodyMetricDto } from './dto/create-body-metric.dto';
import { UpdateBodyMetricDto } from './dto/update-body-metric.dto';

@Injectable()
export class BodyMetricService {
  constructor(
    @InjectRepository(BodyMetricEntity)
    private readonly bodyMetricRepository: Repository<BodyMetricEntity>,
    @InjectRepository(MetricTypeEntity)
    private readonly metricTypeRepository: Repository<MetricTypeEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
  ) {}

  async getMetricTypes() {
    return this.metricTypeRepository.find({ relations: ['unit'] });
  }

  async getUnits() {
    return this.unitRepository.find();
  }

  async create(userId: number, dto: CreateBodyMetricDto) {
    const metric = this.bodyMetricRepository.create({
      userId,
      metricTypeId: dto.metricTypeId,
      value: dto.value,
      ...(dto.recordedAt && { recordedAt: dto.recordedAt }),
    });
    return this.bodyMetricRepository.save(metric);
  }

  async findAllByUser(userId: number, metricTypeId?: number) {
    const where: Record<string, unknown> = { userId };
    if (metricTypeId) {
      where.metricTypeId = metricTypeId;
    }
    return this.bodyMetricRepository.find({
      where,
      relations: { metricType: { unit: true } },
      order: { recordedAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const metric = await this.bodyMetricRepository.findOne({
      where: { id },
      relations: { metricType: { unit: true } },
    });

    if (!metric) {
      throw new NotFoundException(`Body metric with ID ${id} not found`);
    }

    if (metric.userId !== userId) {
      throw new ForbiddenException('You do not have access to this metric');
    }

    return metric;
  }

  async update(id: number, userId: number, dto: UpdateBodyMetricDto) {
    const metric = await this.findOne(id, userId);
    Object.assign(metric, dto);
    return this.bodyMetricRepository.save(metric);
  }

  async remove(id: number, userId: number) {
    const metric = await this.findOne(id, userId);
    await this.bodyMetricRepository.remove(metric);
  }
}
