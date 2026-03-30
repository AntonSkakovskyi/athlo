import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { NutritionLogService } from './nutrition-log.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateLogMealDto } from '../dto/nutrition-log/create-log-meal.dto';
import { CreateLogMealItemDto } from '../dto/nutrition-log/create-log-meal-item.dto';
import { CreateWaterLogDto } from '../dto/nutrition-log/create-water-log.dto';

@UseGuards(JwtAuthGuard)
@Controller('nutrition-log')
export class NutritionLogController {
  constructor(private readonly nutritionLogService: NutritionLogService) {}

  // ─── Daily Summary ────────────────────────────────

  @Get('summary')
  getDailySummary(@CurrentUser('id') userId: number, @Query('date') date: string) {
    return this.nutritionLogService.getDailySummary(userId, date || new Date().toISOString().split('T')[0]);
  }

  // ─── Log Meals ────────────────────────────────────

  @Post('meals')
  createMeal(@CurrentUser('id') userId: number, @Body() dto: CreateLogMealDto) {
    return this.nutritionLogService.createMeal(userId, dto);
  }

  @Get('meals')
  getMealsByDate(@CurrentUser('id') userId: number, @Query('date') date: string) {
    return this.nutritionLogService.getMealsByDate(userId, date || new Date().toISOString().split('T')[0]);
  }

  @Get('meals/:id')
  getMealById(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.nutritionLogService.getMealById(id, userId);
  }

  @Delete('meals/:id')
  removeMeal(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.nutritionLogService.removeMeal(id, userId);
  }

  // ─── Log Meal Items ───────────────────────────────

  @Post('meals/:mealId/items')
  addMealItem(
    @Param('mealId', ParseIntPipe) mealId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLogMealItemDto,
  ) {
    return this.nutritionLogService.addMealItem(mealId, userId, dto);
  }

  @Delete('meal-items/:itemId')
  removeMealItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.nutritionLogService.removeMealItem(itemId, userId);
  }

  // ─── Water Logs ───────────────────────────────────

  @Post('water')
  addWaterLog(@CurrentUser('id') userId: number, @Body() dto: CreateWaterLogDto) {
    return this.nutritionLogService.addWaterLog(userId, dto);
  }

  @Get('water')
  getWaterLogsByDate(@CurrentUser('id') userId: number, @Query('date') date: string) {
    return this.nutritionLogService.getWaterLogsByDate(userId, date || new Date().toISOString().split('T')[0]);
  }

  @Delete('water/:id')
  removeWaterLog(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.nutritionLogService.removeWaterLog(id, userId);
  }
}
