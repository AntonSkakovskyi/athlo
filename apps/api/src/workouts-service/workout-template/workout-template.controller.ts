import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { WorkoutTemplateService } from './workout-template.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { CreateWorkoutTemplateDto } from '../dto/workout-template/create-workout-template.dto';
import { UpdateWorkoutTemplateDto } from '../dto/workout-template/update-workout-template.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Workout Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class WorkoutTemplateController {
  constructor(private readonly templateService: WorkoutTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a workout template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateWorkoutTemplateDto) {
    return this.templateService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my workout templates' })
  @ApiResponse({ status: 200, description: 'List of own templates' })
  findMyTemplates(@CurrentUser('id') userId: number) {
    return this.templateService.findMyTemplates(userId);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public and friends-only templates' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of accessible templates' })
  findPublicTemplates(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.templateService.findPublicTemplates(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      search,
    );
  }

  @Get('friends')
  @ApiOperation({ summary: 'Get templates of friends' })
  @ApiResponse({ status: 200, description: 'List of templates from friends' })
  findFriendsTemplates(@CurrentUser('id') userId: number) {
    return this.templateService.findFriendsTemplates(userId);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved templates' })
  @ApiResponse({ status: 200, description: 'List of saved templates' })
  getSavedTemplates(@CurrentUser('id') userId: number) {
    return this.templateService.getSavedTemplates(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get templates for another user' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  findTemplatesForUser(
    @CurrentUser('id') currentUserId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
  ) {
    return this.templateService.findTemplatesForUser(currentUserId, targetUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiResponse({ status: 200, description: 'Template data' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template (owner only)' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 403, description: 'Only owner can edit' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateWorkoutTemplateDto,
  ) {
    return this.templateService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template (owner only)' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  @ApiResponse({ status: 403, description: 'Only owner can delete' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.remove(id, userId);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save a public template' })
  @ApiResponse({ status: 201, description: 'Template saved' })
  @ApiResponse({ status: 400, description: 'Cannot save own template or already saved' })
  saveTemplate(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.saveTemplate(id, userId);
  }

  @Delete(':id/save')
  @ApiOperation({ summary: 'Unsave a template' })
  @ApiResponse({ status: 200, description: 'Template unsaved' })
  @ApiResponse({ status: 404, description: 'Saved template not found' })
  unsaveTemplate(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.unsaveTemplate(id, userId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a workout from a template' })
  @ApiResponse({ status: 201, description: 'Workout created from template' })
  startFromTemplate(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.templateService.startFromTemplate(id, userId);
  }

  @Post('from-workout/:workoutId')
  @ApiOperation({ summary: 'Create a template from an existing workout' })
  @ApiResponse({ status: 201, description: 'Template created from workout' })
  createFromWorkout(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @CurrentUser('id') userId: number,
    @Body('name') name: string,
  ) {
    return this.templateService.createFromWorkout(workoutId, userId, name);
  }
}
