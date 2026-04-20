import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseEntity } from '../entities/exercise.entity';
import { ExerciseMuscleEntity } from '../entities/exercise-muscle.entity';
import { TrackingTypeEntity } from '../entities/tracking-type.entity';
import { VisibilityTypeEntity } from '../entities/visibility-type.entity';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExerciseEntity, ExerciseMuscleEntity, TrackingTypeEntity, VisibilityTypeEntity])],
  controllers: [ExerciseController],
  providers: [ExerciseService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
