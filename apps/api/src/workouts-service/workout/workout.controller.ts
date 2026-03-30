import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateWorkoutDto } from '../dto/workout/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/workout/update-workout.dto';
import { CompleteWorkoutDto } from '../dto/workout/complete-workout.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Workouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new workout' })
  @ApiResponse({ status: 201, description: 'Workout created' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateWorkoutDto) {
    return this.workoutService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workouts for current user' })
  @ApiResponse({ status: 200, description: 'List of workouts' })
  findAll(@CurrentUser('id') userId: number) {
    return this.workoutService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workout by ID with exercises and sets' })
  @ApiResponse({ status: 200, description: 'Workout data with exercises and sets' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.workoutService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workout' })
  @ApiResponse({ status: 200, description: 'Workout updated' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workoutService.update(id, userId, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a workout' })
  @ApiResponse({ status: 200, description: 'Workout completed' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CompleteWorkoutDto,
  ) {
    return this.workoutService.complete(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workout' })
  @ApiResponse({ status: 200, description: 'Workout deleted' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.workoutService.remove(id, userId);
  }
}
