import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { GetExercisesQueryDto } from '../dto/get-exercises-query.dto';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  @ApiOperation({ summary: 'Get exercises with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Paginated list of exercises' })
  findAll(
    @CurrentUser('id') userId: number,
    @Query() query: GetExercisesQueryDto,
  ) {
    return this.exerciseService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exercise by ID' })
  @ApiResponse({ status: 200, description: 'Exercise found' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  findById(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.exerciseService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user exercise' })
  @ApiResponse({ status: 201, description: 'Exercise created successfully' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user exercise' })
  @ApiResponse({ status: 200, description: 'Exercise updated successfully' })
  @ApiResponse({ status: 403, description: 'Can only update own exercises' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.exerciseService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user exercise' })
  @ApiResponse({ status: 200, description: 'Exercise deleted successfully' })
  @ApiResponse({ status: 403, description: 'Can only delete own exercises' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.exerciseService.remove(id, userId);
  }
}
