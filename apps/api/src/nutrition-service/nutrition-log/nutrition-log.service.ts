import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LogMealEntity } from '../entities/log-meal.entity';
import { LogMealItemEntity } from '../entities/log-meal-item.entity';
import { WaterLogEntity } from '../entities/water-log.entity';
import { UserEntity } from '../../user-service/user/entities/user.entity';
import { BodyMetricEntity } from '../../user-service/body-metrics/entities/body-metric.entity';
import { CreateLogMealDto } from '../dto/nutrition-log/create-log-meal.dto';
import { CreateLogMealItemDto } from '../dto/nutrition-log/create-log-meal-item.dto';
import { CreateWaterLogDto } from '../dto/nutrition-log/create-water-log.dto';
import { UpdateWaterLogDto } from '../dto/nutrition-log/update-water-log.dto';
import { UpdateLogMealDto } from '../dto/nutrition-log/update-log-meal.dto';
import { UpdateLogMealItemDto } from '../dto/nutrition-log/update-log-meal-item.dto';

@Injectable()
export class NutritionLogService {
  constructor(
    @InjectRepository(LogMealEntity)
    private readonly logMealRepository: Repository<LogMealEntity>,
    @InjectRepository(LogMealItemEntity)
    private readonly logMealItemRepository: Repository<LogMealItemEntity>,
    @InjectRepository(WaterLogEntity)
    private readonly waterLogRepository: Repository<WaterLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BodyMetricEntity)
    private readonly bodyMetricRepository: Repository<BodyMetricEntity>,
  ) {}

  // ─── Log Meals ────────────────────────────────────

  async createMeal(userId: number, dto: CreateLogMealDto) {
    const meal = this.logMealRepository.create({
      userId,
      mealTypeId: dto.mealTypeId,
      name: dto.name,
      originalPlanMealId: dto.originalPlanMealId,
      ...(dto.consumedAt ? { consumedAt: new Date(dto.consumedAt) } : {}),
      ...(dto.dayLogDate ? { dayLogDate: new Date(dto.dayLogDate) } : {}),
    });
    return this.logMealRepository.save(meal);
  }

  async getMealsByDate(userId: number, date: string) {
    return this.logMealRepository.find({
      where: { userId, dayLogDate: new Date(date) },
      relations: {
        mealType: true,
        items: { food: { units: true }, unit: true },
      },
      order: { consumedAt: 'ASC' },
    });
  }

  async getMealById(id: number, userId: number) {
    const meal = await this.logMealRepository.findOne({
      where: { id },
      relations: {
        mealType: true,
        items: { food: { units: true }, unit: true },
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

  async updateMeal(id: number, userId: number, dto: UpdateLogMealDto) {
    const meal = await this.getMealById(id, userId);
    if (dto.mealTypeId !== undefined) meal.mealTypeId = dto.mealTypeId;
    if (dto.name !== undefined) meal.name = dto.name;
    if (dto.consumedAt !== undefined) meal.consumedAt = new Date(dto.consumedAt);
    return this.logMealRepository.save(meal);
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

  async updateMealItem(itemId: number, userId: number, dto: UpdateLogMealItemDto) {
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
    if (dto.unitId !== undefined) item.unitId = dto.unitId;
    if (dto.amount !== undefined) item.amount = dto.amount;
    if (dto.calculatedWeightG !== undefined) item.calculatedWeightG = dto.calculatedWeightG;
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
      ...(dto.consumedAt ? { consumedAt: new Date(dto.consumedAt) } : {}),
    });
    return this.waterLogRepository.save(log);
  }

  async updateWaterLog(id: number, userId: number, dto: UpdateWaterLogDto) {
    const log = await this.waterLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Water log with ID ${id} not found`);
    }
    if (log.userId !== userId) {
      throw new ForbiddenException('You do not have access to this water log');
    }
    if (dto.amountMl !== undefined) log.amountMl = dto.amountMl;
    if (dto.consumedAt !== undefined) log.consumedAt = new Date(dto.consumedAt);
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
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['settings']
    });

    let calculatedWaterGoal: number | null = user?.settings?.waterGoal ?? null;

    if (!calculatedWaterGoal) {
      const latestWeight = await this.bodyMetricRepository.findOne({
        where: { userId, metricType: { name: 'Body Weight' } },
        order: { recordedAt: 'DESC' },
        relations: ['metricType'],
      });
      if (latestWeight) {
        calculatedWaterGoal = Math.round(Number(latestWeight.value) * 35);
      }
    }

    let totalCalories = 0;
    let totalProteins = 0;
    let totalFats = 0;
    let totalCarbs = 0;

    for (const meal of meals) {
      for (const item of meal.items) {
        const multiplier = Number(item.calculatedWeightG ?? item.amount) / 100;
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
      waterGoal: calculatedWaterGoal,
      mealsCount: meals.length,
      meals,
      waterLogs,
    };
  }

  // ─── History (Date Range) ─────────────────────────

  async getHistory(userId: number, from: string, to: string) {
    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T23:59:59`);

    const meals = await this.logMealRepository.find({
      where: { userId, consumedAt: Between(startDate, endDate) },
      relations: { items: { food: true } },
      order: { consumedAt: 'ASC' },
    });

    const waterLogs = await this.waterLogRepository.find({
      where: { userId, consumedAt: Between(startDate, endDate) },
      order: { consumedAt: 'ASC' },
    });

    // Group by date
    const dayMap = new Map<string, { calories: number; proteins: number; fats: number; carbs: number; waterMl: number }>();

    for (const meal of meals) {
      const date = new Date(meal.consumedAt).toISOString().split('T')[0];
      if (!dayMap.has(date)) {
        dayMap.set(date, { calories: 0, proteins: 0, fats: 0, carbs: 0, waterMl: 0 });
      }
      const day = dayMap.get(date)!;
      for (const item of meal.items) {
        const multiplier = Number(item.calculatedWeightG ?? item.amount) / 100;
        day.calories += Number(item.food.calories) * multiplier;
        day.proteins += Number(item.food.proteins) * multiplier;
        day.fats += Number(item.food.fats) * multiplier;
        day.carbs += Number(item.food.carbs) * multiplier;
      }
    }

    for (const log of waterLogs) {
      const date = new Date(log.consumedAt).toISOString().split('T')[0];
      if (!dayMap.has(date)) {
        dayMap.set(date, { calories: 0, proteins: 0, fats: 0, carbs: 0, waterMl: 0 });
      }
      dayMap.get(date)!.waterMl += log.amountMl;
    }

    // Fill missing dates with zeros so the frontend always gets a continuous range
    const cursor = new Date(`${from}T00:00:00`);
    const rangeEnd = new Date(`${to}T00:00:00`);
    while (cursor <= rangeEnd) {
      const dateStr = cursor.toISOString().split('T')[0];
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { calories: 0, proteins: 0, fats: 0, carbs: 0, waterMl: 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const history = Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        calories: Math.round(data.calories * 100) / 100,
        proteins: Math.round(data.proteins * 100) / 100,
        fats: Math.round(data.fats * 100) / 100,
        carbs: Math.round(data.carbs * 100) / 100,
        waterMl: data.waterMl,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return history;
  }
}
