import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MealPlanService } from './meal-plan.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { CreateMealPlanDto } from '../dto/meal-plan/create-meal-plan.dto';
import { UpdateMealPlanDto } from '../dto/meal-plan/update-meal-plan.dto';
import { CreatePlanDayDto } from '../dto/meal-plan/create-plan-day.dto';
import { CreatePlanMealDto } from '../dto/meal-plan/create-plan-meal.dto';
import { CreatePlanMealItemDto } from '../dto/meal-plan/create-plan-meal-item.dto';
import { UpdatePlanMealItemDto } from '../dto/meal-plan/update-plan-meal-item.dto';
import { UpdatePlanMealDto } from '../dto/meal-plan/update-plan-meal.dto';
import { ActivateMealPlanDto } from '../dto/meal-plan/activate-meal-plan.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Meal Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meal-plans')
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  // ─── Meal Plans ───────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a meal plan' })
  @ApiResponse({ status: 201, description: 'Meal plan created' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateMealPlanDto) {
    return this.mealPlanService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my meal plans' })
  @ApiResponse({ status: 200, description: 'List of meal plans' })
  findMyPlans(@CurrentUser('id') userId: number) {
    return this.mealPlanService.findMyPlans(userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get currently active meal plan' })
  @ApiResponse({ status: 200, description: 'Active meal plan' })
  getActivePlan(@CurrentUser('id') userId: number) {
    return this.mealPlanService.getActivePlan(userId);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public meal plans' })
  @ApiResponse({ status: 200, description: 'List of public meal plans' })
  findPublicPlans(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.mealPlanService.findPublicPlans(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      search,
    );
  }

  @Get('friends')
  @ApiOperation({ summary: 'Get meal plans from friends' })
  @ApiResponse({ status: 200, description: 'List of meal plans' })
  findFriendsPlans(@CurrentUser('id') userId: number) {
    return this.mealPlanService.findFriendsPlans(userId);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved meal plans' })
  @ApiResponse({ status: 200, description: 'List of saved meal plans' })
  findSavedPlans(@CurrentUser('id') userId: number) {
    return this.mealPlanService.findSavedPlans(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get meal plans for another user' })
  @ApiResponse({ status: 200, description: 'List of meal plans' })
  findMealPlansForUser(
    @CurrentUser('id') currentUserId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
  ) {
    return this.mealPlanService.findMealPlansForUser(
      currentUserId,
      targetUserId,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a meal plan by ID with days, meals, and items',
  })
  @ApiResponse({ status: 200, description: 'Meal plan data' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealPlanService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan deleted' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.remove(id, userId);
  }

  // ─── Plan Days ────────────────────────────────────

  @Post(':id/days')
  @ApiOperation({ summary: 'Add a day to a meal plan' })
  @ApiResponse({ status: 201, description: 'Day added' })
  addDay(
    @Param('id', ParseIntPipe) planId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreatePlanDayDto,
  ) {
    return this.mealPlanService.addDay(planId, userId, dto);
  }

  @Delete(':id/days/:dayId')
  @ApiOperation({ summary: 'Remove a day from a meal plan' })
  @ApiResponse({ status: 200, description: 'Day removed' })
  removeDay(
    @Param('id', ParseIntPipe) planId: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.removeDay(planId, dayId, userId);
  }

  // ─── Plan Meals ───────────────────────────────────

  @Post(':id/days/:dayId/meals')
  @ApiOperation({ summary: 'Add a meal to a plan day' })
  @ApiResponse({ status: 201, description: 'Meal added' })
  addMeal(
    @Param('id', ParseIntPipe) planId: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreatePlanMealDto,
  ) {
    return this.mealPlanService.addMeal(planId, dayId, userId, dto);
  }

  @Patch(':id/meals/:mealId')
  @ApiOperation({ summary: 'Update a plan meal (time, type, order)' })
  @ApiResponse({ status: 200, description: 'Plan meal updated' })
  updatePlanMeal(
    @Param('id', ParseIntPipe) planId: number,
    @Param('mealId', ParseIntPipe) mealId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdatePlanMealDto,
  ) {
    return this.mealPlanService.updatePlanMeal(planId, mealId, userId, dto);
  }

  @Delete(':id/meals/:mealId')
  @ApiOperation({ summary: 'Remove a meal from a plan' })
  @ApiResponse({ status: 200, description: 'Meal removed' })
  removeMeal(
    @Param('id', ParseIntPipe) planId: number,
    @Param('mealId', ParseIntPipe) mealId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.removeMeal(planId, mealId, userId);
  }

  // ─── Plan Meal Items ──────────────────────────────

  @Post(':id/meals/:mealId/items')
  @ApiOperation({ summary: 'Add a food item to a meal' })
  @ApiResponse({ status: 201, description: 'Meal item added' })
  addMealItem(
    @Param('id', ParseIntPipe) planId: number,
    @Param('mealId', ParseIntPipe) mealId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreatePlanMealItemDto,
  ) {
    return this.mealPlanService.addMealItem(planId, mealId, userId, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update a food item in a meal' })
  @ApiResponse({ status: 200, description: 'Meal item updated' })
  updateMealItem(
    @Param('id', ParseIntPipe) planId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdatePlanMealItemDto,
  ) {
    return this.mealPlanService.updateMealItem(planId, itemId, userId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove a food item from a meal' })
  @ApiResponse({ status: 200, description: 'Meal item removed' })
  removeMealItem(
    @Param('id', ParseIntPipe) planId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.removeMealItem(planId, itemId, userId);
  }

  // ─── Activation ───────────────────────────────────

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a meal plan' })
  @ApiResponse({ status: 201, description: 'Meal plan activated' })
  activatePlan(
    @Param('id', ParseIntPipe) planId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: ActivateMealPlanDto,
  ) {
    return this.mealPlanService.activatePlan(userId, planId, dto);
  }

  @Post('deactivate')
  @ApiOperation({ summary: 'Deactivate current meal plan' })
  @ApiResponse({ status: 201, description: 'Meal plan deactivated' })
  deactivatePlan(@CurrentUser('id') userId: number) {
    return this.mealPlanService.deactivatePlan(userId);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save a meal plan' })
  @ApiResponse({ status: 201, description: 'Meal plan saved' })
  savePlan(
    @Param('id', ParseIntPipe) planId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.savePlan(planId, userId);
  }

  @Delete(':id/save')
  @ApiOperation({ summary: 'Unsave a meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan unsaved' })
  unsavePlan(
    @Param('id', ParseIntPipe) planId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.unsavePlan(planId, userId);
  }
}
