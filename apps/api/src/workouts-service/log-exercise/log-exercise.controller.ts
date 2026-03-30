import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { LogExerciseService } from './log-exercise.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateLogExerciseDto } from '../dto/log-exercise/create-log-exercise.dto';
import { UpdateLogExerciseDto } from '../dto/log-exercise/update-log-exercise.dto';

@UseGuards(JwtAuthGuard)
@Controller('workouts/:workoutId/exercises')
export class LogExerciseController {
  constructor(private readonly logExerciseService: LogExerciseService) {}

  @Post()
  create(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLogExerciseDto,
  ) {
    return this.logExerciseService.create(workoutId, userId, dto);
  }

  @Patch(':id')
  update(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateLogExerciseDto,
  ) {
    return this.logExerciseService.update(id, workoutId, userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.logExerciseService.remove(id, workoutId, userId);
  }
}
