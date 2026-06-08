import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { CreateWorkoutDto } from '../dto/workout/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/workout/update-workout.dto';
import { CompleteWorkoutDto } from '../dto/workout/complete-workout.dto';
import { BatchLastPerformanceDto } from '../dto/workout/batch-last-performance.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkoutStatus } from '@athlo/shared';

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
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: WorkoutStatus })
  @ApiResponse({ status: 200, description: 'Paginated list of workouts' })
  findAll(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: WorkoutStatus,
  ) {
    return this.workoutService.findAllByUser(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      status,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get workouts for another user (visibility aware)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of workouts' })
  findWorkoutsForUser(
    @CurrentUser('id') currentUserId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workoutService.findWorkoutsForUser(
      currentUserId,
      targetUserId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workout by ID with exercises and sets' })
  @ApiResponse({
    status: 200,
    description: 'Workout data with exercises and sets',
  })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
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

  @Get('exercises/:exerciseId/last-performance')
  @ApiOperation({ summary: 'Get last performance data for an exercise' })
  @ApiResponse({ status: 200, description: 'Last performance data or null' })
  getLastPerformance(
    @CurrentUser('id') userId: number,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
  ) {
    return this.workoutService.getLastPerformance(userId, exerciseId);
  }

  @Post('last-performance')
  @ApiOperation({ summary: 'Get last performance data for multiple exercises' })
  @ApiResponse({
    status: 200,
    description: 'Map of exerciseId to last performance data',
  })
  getBatchLastPerformance(
    @CurrentUser('id') userId: number,
    @Body() dto: BatchLastPerformanceDto,
  ) {
    return this.workoutService.getBatchLastPerformance(userId, dto.exerciseIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workout' })
  @ApiResponse({ status: 200, description: 'Workout deleted' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.workoutService.remove(id, userId);
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy a workout to a new one' })
  @ApiResponse({ status: 201, description: 'Workout copied' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  copy(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.workoutService.copyWorkout(id, userId);
  }
}
