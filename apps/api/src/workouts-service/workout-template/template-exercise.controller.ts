import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { TemplateExerciseService } from './template-exercise.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { CreateTemplateExerciseDto } from '../dto/template-exercise/create-template-exercise.dto';
import { UpdateTemplateExerciseDto } from '../dto/template-exercise/update-template-exercise.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Template Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates/:templateId/exercises')
export class TemplateExerciseController {
  constructor(private readonly templateExerciseService: TemplateExerciseService) {}

  @Post()
  @ApiOperation({ summary: 'Add an exercise to a template' })
  @ApiResponse({ status: 201, description: 'Exercise added to template' })
  create(
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateTemplateExerciseDto,
  ) {
    return this.templateExerciseService.create(templateId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template exercise' })
  @ApiResponse({ status: 200, description: 'Template exercise updated' })
  update(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateTemplateExerciseDto,
  ) {
    return this.templateExerciseService.update(id, templateId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an exercise from a template' })
  @ApiResponse({ status: 200, description: 'Template exercise removed' })
  remove(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.templateExerciseService.remove(id, templateId, userId);
  }
}
