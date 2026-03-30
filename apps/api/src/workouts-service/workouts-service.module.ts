import { Module } from '@nestjs/common';
import { WorkoutModule } from './workout/workout.module';

@Module({
  imports: [WorkoutModule]
})
export class WorkoutsServiceModule {}
