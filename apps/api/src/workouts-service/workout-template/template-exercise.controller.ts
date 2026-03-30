import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { TemplateExerciseService } from './template-exercise.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateTemplateExerciseDto } from '../dto/template-exercise/create-template-exercise.dto';
import { UpdateTemplateExerciseDto } from '../dto/template-exercise/update-template-exercise.dto';

@UseGuards(JwtAuthGuard)
@Controller('templates/:templateId/exercises')
export class TemplateExerciseController {
  constructor(private readonly templateExerciseService: TemplateExerciseService) {}

  @Post()
  create(
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateTemplateExerciseDto,
  ) {
    return this.templateExerciseService.create(templateId, userId, dto);
  }

  @Patch(':id')
  update(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateTemplateExerciseDto,
  ) {
    return this.templateExerciseService.update(id, templateId, userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.templateExerciseService.remove(id, templateId, userId);
  }
}
