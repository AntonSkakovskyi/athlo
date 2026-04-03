import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutTemplateEntity } from '../entities/workout-template.entity';
import { TemplateExerciseEntity } from '../entities/template-exercise.entity';
import { TemplateSetEntity } from '../entities/template-set.entity';
import { UserWorkoutTemplateEntity } from '../entities/saved-template.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { WorkoutTemplateService } from './workout-template.service';
import { TemplateExerciseService } from './template-exercise.service';
import { TemplateSetService } from './template-set.service';
import { WorkoutTemplateController } from './workout-template.controller';
import { TemplateExerciseController } from './template-exercise.controller';
import { TemplateSetController } from './template-set.controller';
import { UserServiceModule } from '../../user-service/user-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutTemplateEntity,
      TemplateExerciseEntity,
      TemplateSetEntity,
      UserWorkoutTemplateEntity,
      WorkoutEntity,
      LogExerciseEntity,
      LogSetEntity,
    ]),
    UserServiceModule,
  ],
  controllers: [WorkoutTemplateController, TemplateExerciseController, TemplateSetController],
  providers: [WorkoutTemplateService, TemplateExerciseService, TemplateSetService],
  exports: [WorkoutTemplateService],
})
export class WorkoutTemplateModule {}
