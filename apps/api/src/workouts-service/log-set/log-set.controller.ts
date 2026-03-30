import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { LogSetService } from './log-set.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateLogSetDto } from '../dto/log-set/create-log-set.dto';
import { UpdateLogSetDto } from '../dto/log-set/update-log-set.dto';

@UseGuards(JwtAuthGuard)
@Controller('workouts/:workoutId/exercises/:logExerciseId/sets')
export class LogSetController {
  constructor(private readonly logSetService: LogSetService) {}

  @Post()
  create(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('logExerciseId', ParseIntPipe) logExerciseId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLogSetDto,
  ) {
    return this.logSetService.create(workoutId, logExerciseId, userId, dto);
  }

  @Patch(':id')
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
  remove(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('logExerciseId', ParseIntPipe) logExerciseId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.logSetService.remove(id, workoutId, logExerciseId, userId);
  }
}
