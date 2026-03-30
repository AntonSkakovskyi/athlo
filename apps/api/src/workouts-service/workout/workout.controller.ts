import { Body, Controller, Post } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import type { InitiateWorkoutDto } from '../dto/workout/init-workout.dto';

@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post('initiate')
  initiateWorkout(@Body() initiateWorkoutDto: InitiateWorkoutDto) {
    const { userId } = initiateWorkoutDto;
    return this.workoutService.initiateWorkout(userId);
  }
}
