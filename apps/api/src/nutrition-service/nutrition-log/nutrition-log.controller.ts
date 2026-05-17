import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NutritionLogService } from './nutrition-log.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { CreateLogMealDto } from '../dto/nutrition-log/create-log-meal.dto';
import { CreateLogMealItemDto } from '../dto/nutrition-log/create-log-meal-item.dto';
import { CreateWaterLogDto } from '../dto/nutrition-log/create-water-log.dto';
import { UpdateWaterLogDto } from '../dto/nutrition-log/update-water-log.dto';
import { UpdateLogMealDto } from '../dto/nutrition-log/update-log-meal.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Nutrition Log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition-log')
export class NutritionLogController {
  constructor(private readonly nutritionLogService: NutritionLogService) {}

  // ─── Daily Summary ────────────────────────────────

  @Get('summary')
  @ApiOperation({ summary: 'Get daily nutrition summary (calories, macros, water)' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Daily nutrition summary' })
  getDailySummary(@CurrentUser('id') userId: number, @Query('date') date: string) {
    return this.nutritionLogService.getDailySummary(userId, date || new Date().toISOString().split('T')[0]);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get nutrition history (daily summaries for a date range)' })
  @ApiQuery({ name: 'from', required: true, description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'to', required: true, description: 'End date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Array of daily nutrition summaries' })
  getHistory(
    @CurrentUser('id') userId: number,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.nutritionLogService.getHistory(userId, from, to);
  }

  // ─── Log Meals ────────────────────────────────────

  @Post('meals')
  @ApiOperation({ summary: 'Log a meal' })
  @ApiResponse({ status: 201, description: 'Meal logged' })
  createMeal(@CurrentUser('id') userId: number, @Body() dto: CreateLogMealDto) {
    return this.nutritionLogService.createMeal(userId, dto);
  }

  @Get('meals')
  @ApiOperation({ summary: 'Get logged meals by date' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'List of logged meals' })
  getMealsByDate(@CurrentUser('id') userId: number, @Query('date') date: string) {
    return this.nutritionLogService.getMealsByDate(userId, date || new Date().toISOString().split('T')[0]);
  }

  @Get('meals/:id')
  @ApiOperation({ summary: 'Get a logged meal by ID' })
  @ApiResponse({ status: 200, description: 'Logged meal data' })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  getMealById(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.nutritionLogService.getMealById(id, userId);
  }

  @Patch('meals/:id')
  @ApiOperation({ summary: 'Update a logged meal' })
  @ApiResponse({ status: 200, description: 'Meal updated' })
  updateMeal(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateLogMealDto,
  ) {
    return this.nutritionLogService.updateMeal(id, userId, dto);
  }

  @Delete('meals/:id')
  @ApiOperation({ summary: 'Delete a logged meal' })
  @ApiResponse({ status: 200, description: 'Meal deleted' })
  removeMeal(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.nutritionLogService.removeMeal(id, userId);
  }

  // ─── Log Meal Items ───────────────────────────────

  @Post('meals/:mealId/items')
  @ApiOperation({ summary: 'Add a food item to a logged meal' })
  @ApiResponse({ status: 201, description: 'Item added to meal' })
  addMealItem(
    @Param('mealId', ParseIntPipe) mealId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLogMealItemDto,
  ) {
    return this.nutritionLogService.addMealItem(mealId, userId, dto);
  }

  @Delete('meal-items/:itemId')
  @ApiOperation({ summary: 'Remove a food item from a logged meal' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  removeMealItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.nutritionLogService.removeMealItem(itemId, userId);
  }

  // ─── Water Logs ───────────────────────────────────

  @Post('water')
  @ApiOperation({ summary: 'Log water intake' })
  @ApiResponse({ status: 201, description: 'Water log created' })
  addWaterLog(@CurrentUser('id') userId: number, @Body() dto: CreateWaterLogDto) {
    return this.nutritionLogService.addWaterLog(userId, dto);
  }

  @Get('water')
  @ApiOperation({ summary: 'Get water logs by date' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'List of water logs' })
  getWaterLogsByDate(@CurrentUser('id') userId: number, @Query('date') date: string) {
    return this.nutritionLogService.getWaterLogsByDate(userId, date || new Date().toISOString().split('T')[0]);
  }

  @Patch('water/:id')
  @ApiOperation({ summary: 'Update a water log (amount or time)' })
  @ApiResponse({ status: 200, description: 'Water log updated' })
  updateWaterLog(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateWaterLogDto,
  ) {
    return this.nutritionLogService.updateWaterLog(id, userId, dto);
  }

  @Delete('water/:id')
  @ApiOperation({ summary: 'Delete a water log' })
  @ApiResponse({ status: 200, description: 'Water log deleted' })
  removeWaterLog(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.nutritionLogService.removeWaterLog(id, userId);
  }
}
