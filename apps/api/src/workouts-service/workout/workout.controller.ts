import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateWorkoutDto } from '../dto/workout/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/workout/update-workout.dto';
import { CompleteWorkoutDto } from '../dto/workout/complete-workout.dto';

@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  create(@CurrentUser('id') userId: number, @Body() dto: CreateWorkoutDto) {
    return this.workoutService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.workoutService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.workoutService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workoutService.update(id, userId, dto);
  }

  @Patch(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CompleteWorkoutDto,
  ) {
    return this.workoutService.complete(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.workoutService.remove(id, userId);
  }
}
