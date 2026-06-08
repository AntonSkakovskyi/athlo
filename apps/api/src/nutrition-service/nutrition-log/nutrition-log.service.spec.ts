import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NutritionLogService } from './nutrition-log.service';
import { LogMealEntity } from '../entities/log-meal.entity';
import { LogMealItemEntity } from '../entities/log-meal-item.entity';
import { WaterLogEntity } from '../entities/water-log.entity';
import { UserEntity } from '../../user-service/user/entities/user.entity';
import { BodyMetricEntity } from '../../user-service/body-metrics/entities/body-metric.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('NutritionLogService', () => {
  let service: NutritionLogService;
  let logMealRepo: ReturnType<typeof createMockRepository>;
  let logMealItemRepo: ReturnType<typeof createMockRepository>;
  let waterLogRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let bodyMetricRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionLogService,
        {
          provide: getRepositoryToken(LogMealEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(LogMealItemEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(WaterLogEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(BodyMetricEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<NutritionLogService>(NutritionLogService);
    logMealRepo = module.get(getRepositoryToken(LogMealEntity));
    logMealItemRepo = module.get(getRepositoryToken(LogMealItemEntity));
    waterLogRepo = module.get(getRepositoryToken(WaterLogEntity));
    userRepo = module.get(getRepositoryToken(UserEntity));
    bodyMetricRepo = module.get(getRepositoryToken(BodyMetricEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── getMealById ──────────────────────────────────

  describe('getMealById', () => {
    it('should return meal when it belongs to the user', async () => {
      const meal = { id: 1, userId: 1, items: [] };
      logMealRepo.findOne.mockResolvedValue(meal);

      const result = await service.getMealById(1, 1);

      expect(result).toEqual(meal);
    });

    it('should throw NotFoundException when meal not found', async () => {
      logMealRepo.findOne.mockResolvedValue(null);

      await expect(service.getMealById(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when meal belongs to another user', async () => {
      logMealRepo.findOne.mockResolvedValue({ id: 1, userId: 2, items: [] });

      await expect(service.getMealById(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── addMealItem ──────────────────────────────────

  describe('addMealItem', () => {
    it('should create meal item without calculatedWeightG', async () => {
      logMealRepo.findOne.mockResolvedValue({ id: 1, userId: 1, items: [] });
      const dto = { foodId: 5, unitId: 2, amount: 150 };
      const item = { id: 10, logMealId: 1, ...dto };
      logMealItemRepo.create.mockReturnValue(item);
      logMealItemRepo.save.mockResolvedValue(item);

      const result = await service.addMealItem(1, 1, dto);

      expect(logMealItemRepo.create).toHaveBeenCalledWith({
        logMealId: 1,
        foodId: dto.foodId,
        unitId: dto.unitId,
        amount: dto.amount,
      });
      expect(result).toEqual(item);
    });

    it('should throw ForbiddenException when meal belongs to another user', async () => {
      logMealRepo.findOne.mockResolvedValue({ id: 1, userId: 2, items: [] });

      await expect(
        service.addMealItem(1, 1, { foodId: 5, unitId: 2, amount: 100 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── updateMealItem ───────────────────────────────

  describe('updateMealItem', () => {
    it('should update amount when user owns the meal', async () => {
      const item = {
        id: 1,
        logMealId: 1,
        logMeal: { userId: 1 },
        amount: 100,
        unitId: 2,
      };
      logMealItemRepo.findOne.mockResolvedValue(item);
      logMealItemRepo.save.mockResolvedValue({ ...item, amount: 200 });

      const result = await service.updateMealItem(1, 1, { amount: 200 });

      expect(logMealItemRepo.save).toHaveBeenCalled();
      expect(result.amount).toBe(200);
    });

    it('should throw NotFoundException when item not found', async () => {
      logMealItemRepo.findOne.mockResolvedValue(null);

      await expect(service.updateMealItem(999, 1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when item belongs to another user', async () => {
      logMealItemRepo.findOne.mockResolvedValue({
        id: 1,
        logMeal: { userId: 2 },
      });

      await expect(service.updateMealItem(1, 1, {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── removeMealItem ───────────────────────────────

  describe('removeMealItem', () => {
    it('should remove item when user owns the meal', async () => {
      const item = { id: 1, logMeal: { userId: 1 } };
      logMealItemRepo.findOne.mockResolvedValue(item);
      logMealItemRepo.remove.mockResolvedValue(item);

      await service.removeMealItem(1, 1);

      expect(logMealItemRepo.remove).toHaveBeenCalledWith(item);
    });

    it('should throw ForbiddenException when item belongs to another user', async () => {
      logMealItemRepo.findOne.mockResolvedValue({
        id: 1,
        logMeal: { userId: 2 },
      });

      await expect(service.removeMealItem(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── Water Logs ───────────────────────────────────

  describe('addWaterLog', () => {
    it('should create and save a water log', async () => {
      const dto = { amountMl: 500 };
      const log = { id: 1, userId: 1, amountMl: 500 };
      waterLogRepo.create.mockReturnValue(log);
      waterLogRepo.save.mockResolvedValue(log);

      const result = await service.addWaterLog(1, dto);

      expect(waterLogRepo.create).toHaveBeenCalledWith({
        userId: 1,
        amountMl: 500,
      });
      expect(result).toEqual(log);
    });
  });

  describe('updateWaterLog', () => {
    it('should update water amount when user owns it', async () => {
      const log = { id: 1, userId: 1, amountMl: 300 };
      waterLogRepo.findOne.mockResolvedValue(log);
      waterLogRepo.save.mockResolvedValue({ ...log, amountMl: 600 });

      const result = await service.updateWaterLog(1, 1, { amountMl: 600 });

      expect(result.amountMl).toBe(600);
    });

    it('should throw ForbiddenException when log belongs to another user', async () => {
      waterLogRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(
        service.updateWaterLog(1, 1, { amountMl: 200 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeWaterLog', () => {
    it('should remove water log when user owns it', async () => {
      const log = { id: 1, userId: 1 };
      waterLogRepo.findOne.mockResolvedValue(log);
      waterLogRepo.remove.mockResolvedValue(log);

      await service.removeWaterLog(1, 1);

      expect(waterLogRepo.remove).toHaveBeenCalledWith(log);
    });

    it('should throw ForbiddenException when log belongs to another user', async () => {
      waterLogRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(service.removeWaterLog(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── getDailySummary ──────────────────────────────

  describe('getDailySummary', () => {
    const date = '2025-06-01';

    it('should calculate macros using new NutritionFact multiplier logic', async () => {
      // foodUnit: 100g serving = 200 cal, 10g protein, 5g fat, 30g carbs
      // item: amount=50 → multiplier = 50/100 = 0.5
      // expected: 100cal, 5g protein, 2.5g fat, 15g carbs
      const meals = [
        {
          id: 1,
          consumedAt: new Date(date),
          items: [
            {
              id: 1,
              foodId: 1,
              unitId: 2,
              amount: 50,
              food: {
                units: [
                  {
                    unitId: 2,
                    amount: 100,
                    calories: 200,
                    proteins: 10,
                    fats: 5,
                    carbs: 30,
                  },
                ],
              },
            },
          ],
        },
      ];
      logMealRepo.find.mockResolvedValue(meals);
      waterLogRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({
        settings: {
          waterGoal: 2000,
          proteinGoal: 150,
          fatGoal: 60,
          carbGoal: 250,
        },
      });

      const result = await service.getDailySummary(1, date);

      expect(result.totalCalories).toBe(100);
      expect(result.totalProteins).toBe(5);
      expect(result.totalFats).toBe(2.5);
      expect(result.totalCarbs).toBe(15);
      expect(result.waterGoal).toBe(2000);
    });

    it('should skip items with no matching NutritionFact for their unitId', async () => {
      const meals = [
        {
          id: 1,
          consumedAt: new Date(date),
          items: [
            {
              id: 1,
              foodId: 1,
              unitId: 99, // no matching unit
              amount: 100,
              food: {
                units: [
                  {
                    unitId: 1,
                    amount: 100,
                    calories: 200,
                    proteins: 10,
                    fats: 5,
                    carbs: 30,
                  },
                ],
              },
            },
          ],
        },
      ];
      logMealRepo.find.mockResolvedValue(meals);
      waterLogRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({ settings: null });
      bodyMetricRepo.findOne.mockResolvedValue(null);

      const result = await service.getDailySummary(1, date);

      expect(result.totalCalories).toBe(0);
      expect(result.totalProteins).toBe(0);
    });

    it('should sum water intake from water logs', async () => {
      logMealRepo.find.mockResolvedValue([]);
      waterLogRepo.find.mockResolvedValue([
        { amountMl: 300 },
        { amountMl: 200 },
      ]);
      userRepo.findOne.mockResolvedValue({ settings: { waterGoal: 2000 } });

      const result = await service.getDailySummary(1, date);

      expect(result.totalWaterMl).toBe(500);
    });

    it('should derive water goal from body weight when no setting exists', async () => {
      logMealRepo.find.mockResolvedValue([]);
      waterLogRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({ settings: null });
      bodyMetricRepo.findOne.mockResolvedValue({
        value: 80,
        metricType: { name: 'Body Weight' },
      });

      const result = await service.getDailySummary(1, date);

      // 80kg * 35 = 2800 ml
      expect(result.waterGoal).toBe(2800);
    });

    it('should return null waterGoal when no setting and no body weight', async () => {
      logMealRepo.find.mockResolvedValue([]);
      waterLogRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({ settings: null });
      bodyMetricRepo.findOne.mockResolvedValue(null);

      const result = await service.getDailySummary(1, date);

      expect(result.waterGoal).toBeNull();
    });

    it('should return goals from user settings', async () => {
      logMealRepo.find.mockResolvedValue([]);
      waterLogRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({
        settings: {
          waterGoal: 2500,
          proteinGoal: 160,
          fatGoal: 70,
          carbGoal: 300,
        },
      });

      const result = await service.getDailySummary(1, date);

      expect(result.proteinGoal).toBe(160);
      expect(result.fatGoal).toBe(70);
      expect(result.carbGoal).toBe(300);
    });
  });
});
