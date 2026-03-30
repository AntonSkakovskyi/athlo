import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { WorkoutTemplateService } from './workout-template.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateWorkoutTemplateDto } from '../dto/workout-template/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from '../dto/workout-template/update-workout-template.dto';

@UseGuards(JwtAuthGuard)
@Controller('templates')
export class WorkoutTemplateController {
  constructor(private readonly templateService: WorkoutTemplateService) {}

  @Post()
  create(@CurrentUser('id') userId: number, @Body() dto: CreateWorkoutTemplateDto) {
    return this.templateService.create(userId, dto);
  }

  @Get()
  findMyTemplates(@CurrentUser('id') userId: number) {
    return this.templateService.findMyTemplates(userId);
  }

  @Get('public')
  findPublicTemplates(@CurrentUser('id') userId: number) {
    return this.templateService.findPublicTemplates(userId);
  }

  @Get('saved')
  getSavedTemplates(@CurrentUser('id') userId: number) {
    return this.templateService.getSavedTemplates(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateWorkoutTemplateDto,
  ) {
    return this.templateService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.remove(id, userId);
  }

  @Post(':id/save')
  saveTemplate(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.saveTemplate(id, userId);
  }

  @Delete(':id/save')
  unsaveTemplate(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.unsaveTemplate(id, userId);
  }

  @Post(':id/start')
  startFromTemplate(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.startFromTemplate(id, userId);
  }
}
