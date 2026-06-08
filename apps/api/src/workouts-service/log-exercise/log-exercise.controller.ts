import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LogExerciseService } from './log-exercise.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { CreateLogExerciseDto } from '../dto/log-exercise/create-log-exercise.dto';
import { UpdateLogExerciseDto } from '../dto/log-exercise/update-log-exercise.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Workout Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workouts/:workoutId/exercises')
export class LogExerciseController {
  constructor(private readonly logExerciseService: LogExerciseService) {}

  @Post()
  @ApiOperation({ summary: 'Add an exercise to a workout' })
  @ApiResponse({ status: 201, description: 'Exercise added to workout' })
  create(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLogExerciseDto,
  ) {
    return this.logExerciseService.create(workoutId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workout exercise' })
  @ApiResponse({ status: 200, description: 'Workout exercise updated' })
  update(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateLogExerciseDto,
  ) {
    return this.logExerciseService.update(id, workoutId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an exercise from a workout' })
  @ApiResponse({ status: 200, description: 'Workout exercise removed' })
  remove(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.logExerciseService.remove(id, workoutId, userId);
  }
}
