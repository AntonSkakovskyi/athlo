import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseService } from './log-exercise.service';
import { LogExerciseController } from './log-exercise.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LogExerciseEntity, WorkoutEntity])],
  controllers: [LogExerciseController],
  providers: [LogExerciseService],
  exports: [LogExerciseService],
})
export class LogExerciseModule {}
