import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { GetExercisesQueryDto } from '../dto/get-exercises-query.dto';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  findAll(@Query() query: GetExercisesQueryDto) {
    return this.exerciseService.findAll(query);
  }
}
