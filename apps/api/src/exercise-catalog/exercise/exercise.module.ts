import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseEntity } from '../entities/exercise.entity';
import { ExerciseMuscleEntity } from '../entities/exercise-muscle.entity';
import { TrackingTypeEntity } from '../entities/tracking-type.entity';
import { VisibilityTypeEntity } from '../entities/visibility-type.entity';
import { LogExerciseEntity } from '../../workouts-service/entities/log-exercise.entity';
import { TemplateExerciseEntity } from '../../workouts-service/entities/template-exercise.entity';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExerciseEntity,
      ExerciseMuscleEntity,
      TrackingTypeEntity,
      VisibilityTypeEntity,
      LogExerciseEntity,
      TemplateExerciseEntity,
    ]),
  ],
  controllers: [ExerciseController],
  providers: [ExerciseService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
