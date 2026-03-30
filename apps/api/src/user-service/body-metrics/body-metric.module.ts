import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyMetricService } from './body-metric.service';
import { BodyMetricController } from './body-metric.controller';
import { BodyMetricEntity } from './entities/body-metric.entity';
import { MetricTypeEntity } from './entities/metric-type.entity';
import { UnitEntity } from './entities/unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BodyMetricEntity, MetricTypeEntity, UnitEntity]),
  ],
  controllers: [BodyMetricController],
  providers: [BodyMetricService],
})
export class BodyMetricModule {}
