import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { GetExercisesQueryDto } from '../dto/get-exercises-query.dto';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  @ApiOperation({ summary: 'Get exercises with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Paginated list of exercises' })
  findAll(@Query() query: GetExercisesQueryDto) {
    return this.exerciseService.findAll(query);
  }
}
