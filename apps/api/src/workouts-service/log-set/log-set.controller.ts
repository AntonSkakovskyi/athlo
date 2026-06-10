import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { LogSetService } from './log-set.service';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { CreateLogSetDto } from '../dto/log-set/create-log-set.dto';
import { UpdateLogSetDto } from '../dto/log-set/update-log-set.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Workout Sets')
@ApiBearerAuth()
@Controller('workouts/:workoutId/exercises/:logExerciseId/sets')
export class LogSetController {
  constructor(private readonly logSetService: LogSetService) {}

  @Post()
  @ApiOperation({ summary: 'Add a set to a workout exercise' })
  @ApiResponse({ status: 201, description: 'Set added' })
  create(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('logExerciseId', ParseIntPipe) logExerciseId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLogSetDto,
  ) {
    return this.logSetService.create(workoutId, logExerciseId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workout set' })
  @ApiResponse({ status: 200, description: 'Set updated' })
  update(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('logExerciseId', ParseIntPipe) logExerciseId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateLogSetDto,
  ) {
    return this.logSetService.update(id, workoutId, logExerciseId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a set from a workout exercise' })
  @ApiResponse({ status: 200, description: 'Set removed' })
  remove(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('logExerciseId', ParseIntPipe) logExerciseId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.logSetService.remove(id, workoutId, logExerciseId, userId);
  }
}
