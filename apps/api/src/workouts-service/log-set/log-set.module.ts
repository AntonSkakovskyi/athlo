import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogSetService } from './log-set.service';
import { LogSetController } from './log-set.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LogSetEntity, LogExerciseEntity, WorkoutEntity])],
  controllers: [LogSetController],
  providers: [LogSetService],
  exports: [LogSetService],
})
export class LogSetModule {}
