import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { TemplateSetService } from './template-set.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateTemplateSetDto } from '../dto/template-set/create-template-set.dto';
import { UpdateTemplateSetDto } from '../dto/template-set/update-template-set.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Template Sets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates/:templateId/exercises/:templateExerciseId/sets')
export class TemplateSetController {
  constructor(private readonly templateSetService: TemplateSetService) {}

  @Post()
  @ApiOperation({ summary: 'Add a set to a template exercise' })
  @ApiResponse({ status: 201, description: 'Set added to template exercise' })
  create(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('templateExerciseId', ParseIntPipe) templateExerciseId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateTemplateSetDto,
  ) {
    return this.templateSetService.create(templateId, templateExerciseId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template set' })
  @ApiResponse({ status: 200, description: 'Template set updated' })
  update(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('templateExerciseId', ParseIntPipe) templateExerciseId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateTemplateSetDto,
  ) {
    return this.templateSetService.update(id, templateId, templateExerciseId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a set from a template exercise' })
  @ApiResponse({ status: 200, description: 'Template set removed' })
  remove(
    @Param('templateId', ParseIntPipe) templateId: number,
    @Param('templateExerciseId', ParseIntPipe) templateExerciseId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.templateSetService.remove(id, templateId, templateExerciseId, userId);
  }
}
