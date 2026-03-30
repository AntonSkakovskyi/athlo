import { Module } from '@nestjs/common';
import { WorkoutModule } from './workout/workout.module';
import { LogExerciseModule } from './log-exercise/log-exercise.module';
import { LogSetModule } from './log-set/log-set.module';

@Module({
  imports: [WorkoutModule, LogExerciseModule, LogSetModule],
})
export class WorkoutsServiceModule {}
