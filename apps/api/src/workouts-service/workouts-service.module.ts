import { Module } from '@nestjs/common';
import { WorkoutModule } from './workout/workout.module';
import { LogExerciseModule } from './log-exercise/log-exercise.module';
import { LogSetModule } from './log-set/log-set.module';
import { WorkoutTemplateModule } from './workout-template/workout-template.module';

@Module({
  imports: [WorkoutModule, LogExerciseModule, LogSetModule, WorkoutTemplateModule],
})
export class WorkoutsServiceModule {}
