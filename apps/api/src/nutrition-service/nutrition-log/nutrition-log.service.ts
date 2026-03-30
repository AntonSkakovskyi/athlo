import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LogMealEntity } from '../entities/log-meal.entity';
import { LogMealItemEntity } from '../entities/log-meal-item.entity';
import { WaterLogEntity } from '../entities/water-log.entity';
import { CreateLogMealDto } from '../dto/nutrition-log/create-log-meal.dto';
import { CreateLogMealItemDto } from '../dto/nutrition-log/create-log-meal-item.dto';
import { CreateWaterLogDto } from '../dto/nutrition-log/create-water-log.dto';

@Injectable()
export class NutritionLogService {
  constructor(
    @InjectRepository(LogMealEntity)
    private readonly logMealRepository: Repository<LogMealEntity>,
    @InjectRepository(LogMealItemEntity)
    private readonly logMealItemRepository: Repository<LogMealItemEntity>,
    @InjectRepository(WaterLogEntity)
    private readonly waterLogRepository: Repository<WaterLogEntity>,
  ) {}

  // ─── Log Meals ────────────────────────────────────

  async createMeal(userId: number, dto: CreateLogMealDto) {
    const meal = this.logMealRepository.create({
      userId,
      mealTypeId: dto.mealTypeId,
      name: dto.name,
      originalPlanMealId: dto.originalPlanMealId,
    });
    return this.logMealRepository.save(meal);
  }

  async getMealsByDate(userId: number, date: string) {
    return this.logMealRepository.find({
      where: { userId, dayLogDate: new Date(date) },
      relations: {
        mealType: true,
        items: { food: true, unit: true },
      },
      order: { consumedAt: 'ASC' },
    });
  }

  async getMealById(id: number, userId: number) {
    const meal = await this.logMealRepository.findOne({
      where: { id },
      relations: {
        mealType: true,
        items: { food: true, unit: true },
      },
    });

    if (!meal) {
      throw new NotFoundException(`Log meal with ID ${id} not found`);
    }
    if (meal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal log');
    }
    return meal;
  }

  async removeMeal(id: number, userId: number) {
    const meal = await this.getMealById(id, userId);
    await this.logMealRepository.remove(meal);
  }

  // ─── Log Meal Items ───────────────────────────────

  async addMealItem(mealId: number, userId: number, dto: CreateLogMealItemDto) {
    await this.getMealById(mealId, userId);
    const item = this.logMealItemRepository.create({
      logMealId: mealId,
      foodId: dto.foodId,
      unitId: dto.unitId,
      amount: dto.amount,
      calculatedWeightG: dto.calculatedWeightG,
    });
    return this.logMealItemRepository.save(item);
  }

  async removeMealItem(itemId: number, userId: number) {
    const item = await this.logMealItemRepository.findOne({
      where: { id: itemId },
      relations: { logMeal: true },
    });
    if (!item) {
      throw new NotFoundException(`Log meal item with ID ${itemId} not found`);
    }
    if (item.logMeal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal item');
    }
    await this.logMealItemRepository.remove(item);
  }

  // ─── Water Logs ───────────────────────────────────

  async addWaterLog(userId: number, dto: CreateWaterLogDto) {
    const log = this.waterLogRepository.create({
      userId,
      amountMl: dto.amountMl,
    });
    return this.waterLogRepository.save(log);
  }

  async getWaterLogsByDate(userId: number, date: string) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    return this.waterLogRepository.find({
      where: { userId, consumedAt: Between(start, end) },
      order: { consumedAt: 'ASC' },
    });
  }

  async removeWaterLog(id: number, userId: number) {
    const log = await this.waterLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Water log with ID ${id} not found`);
    }
    if (log.userId !== userId) {
      throw new ForbiddenException('You do not have access to this water log');
    }
    await this.waterLogRepository.remove(log);
  }

  // ─── Daily Summary ────────────────────────────────

  async getDailySummary(userId: number, date: string) {
    const meals = await this.getMealsByDate(userId, date);
    const waterLogs = await this.getWaterLogsByDate(userId, date);

    let totalCalories = 0;
    let totalProteins = 0;
    let totalFats = 0;
    let totalCarbs = 0;

    for (const meal of meals) {
      for (const item of meal.items) {
        const multiplier = Number(item.amount);
        totalCalories += Number(item.food.calories) * multiplier;
        totalProteins += Number(item.food.proteins) * multiplier;
        totalFats += Number(item.food.fats) * multiplier;
        totalCarbs += Number(item.food.carbs) * multiplier;
      }
    }

    const totalWaterMl = waterLogs.reduce((sum, log) => sum + log.amountMl, 0);

    return {
      date,
      totalCalories: Math.round(totalCalories * 100) / 100,
      totalProteins: Math.round(totalProteins * 100) / 100,
      totalFats: Math.round(totalFats * 100) / 100,
      totalCarbs: Math.round(totalCarbs * 100) / 100,
      totalWaterMl,
      mealsCount: meals.length,
      meals,
      waterLogs,
    };
  }
}
