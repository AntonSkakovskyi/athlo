import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { BodyMetricEntity } from '../../user-service/body-metrics/entities/body-metric.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutEntity,
      LogExerciseEntity,
      LogSetEntity,
      BodyMetricEntity,
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
