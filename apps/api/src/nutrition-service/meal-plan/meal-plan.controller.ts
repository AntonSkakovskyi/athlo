import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { MealPlanService } from './meal-plan.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateMealPlanDto } from '../dto/meal-plan/create-meal-plan.dto';
import { UpdateMealPlanDto } from '../dto/meal-plan/update-meal-plan.dto';
import { CreatePlanDayDto } from '../dto/meal-plan/create-plan-day.dto';
import { CreatePlanMealDto } from '../dto/meal-plan/create-plan-meal.dto';
import { CreatePlanMealItemDto } from '../dto/meal-plan/create-plan-meal-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('meal-plans')
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  // ─── Meal Plans ───────────────────────────────────

  @Post()
  create(@CurrentUser('id') userId: number, @Body() dto: CreateMealPlanDto) {
    return this.mealPlanService.create(userId, dto);
  }

  @Get()
  findMyPlans(@CurrentUser('id') userId: number) {
    return this.mealPlanService.findMyPlans(userId);
  }

  @Get('active')
  getActivePlan(@CurrentUser('id') userId: number) {
    return this.mealPlanService.getActivePlan(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.mealPlanService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealPlanService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.mealPlanService.remove(id, userId);
  }

  // ─── Plan Days ────────────────────────────────────

  @Post(':id/days')
  addDay(
    @Param('id', ParseIntPipe) planId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreatePlanDayDto,
  ) {
    return this.mealPlanService.addDay(planId, userId, dto);
  }

  @Delete(':id/days/:dayId')
  removeDay(
    @Param('id', ParseIntPipe) planId: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.removeDay(planId, dayId, userId);
  }

  // ─── Plan Meals ───────────────────────────────────

  @Post(':id/days/:dayId/meals')
  addMeal(
    @Param('id', ParseIntPipe) planId: number,
    @Param('dayId', ParseIntPipe) dayId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreatePlanMealDto,
  ) {
    return this.mealPlanService.addMeal(planId, dayId, userId, dto);
  }

  @Delete(':id/meals/:mealId')
  removeMeal(
    @Param('id', ParseIntPipe) planId: number,
    @Param('mealId', ParseIntPipe) mealId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.removeMeal(planId, mealId, userId);
  }

  // ─── Plan Meal Items ──────────────────────────────

  @Post(':id/meals/:mealId/items')
  addMealItem(
    @Param('id', ParseIntPipe) planId: number,
    @Param('mealId', ParseIntPipe) mealId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreatePlanMealItemDto,
  ) {
    return this.mealPlanService.addMealItem(planId, mealId, userId, dto);
  }

  @Delete(':id/items/:itemId')
  removeMealItem(
    @Param('id', ParseIntPipe) planId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.mealPlanService.removeMealItem(planId, itemId, userId);
  }

  // ─── Activation ───────────────────────────────────

  @Post(':id/activate')
  activatePlan(@Param('id', ParseIntPipe) planId: number, @CurrentUser('id') userId: number) {
    return this.mealPlanService.activatePlan(userId, planId);
  }

  @Post('deactivate')
  deactivatePlan(@CurrentUser('id') userId: number) {
    return this.mealPlanService.deactivatePlan(userId);
  }
}
