import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { FoodService } from './food.service';
import { FoodEntity } from '../entities/food.entity';
import { NutritionFactEntity } from '../entities/nutrition-fact.entity';
import { LogMealItemEntity } from '../entities/log-meal-item.entity';
import { PlanMealItemEntity } from '../entities/plan-meal-item.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
  softDelete: jest.fn(),
  count: jest.fn(),
});

describe('FoodService', () => {
  let service: FoodService;
  let foodRepo: ReturnType<typeof createMockRepository>;
  let nutritionFactRepo: ReturnType<typeof createMockRepository>;
  let logMealItemRepo: ReturnType<typeof createMockRepository>;
  let planMealItemRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodService,
        { provide: getRepositoryToken(FoodEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(NutritionFactEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(LogMealItemEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(PlanMealItemEntity), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<FoodService>(FoodService);
    foodRepo = module.get(getRepositoryToken(FoodEntity));
    nutritionFactRepo = module.get(getRepositoryToken(NutritionFactEntity));
    logMealItemRepo = module.get(getRepositoryToken(LogMealItemEntity));
    planMealItemRepo = module.get(getRepositoryToken(PlanMealItemEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOne', () => {
    it('should return food with units when found', async () => {
      const food = { id: 1, name: 'Rice', units: [] };
      foodRepo.findOne.mockResolvedValue(food);

      const result = await service.findOne(1);

      expect(foodRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['units', 'units.unit'],
      });
      expect(result).toEqual(food);
    });

    it('should throw NotFoundException when food not found', async () => {
      foodRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated food list without search', async () => {
      const foods = [{ id: 1, name: 'Rice' }];
      foodRepo.findAndCount.mockResolvedValue([foods, 1]);

      const result = await service.findAll(undefined, 1, 20);

      expect(result.data).toEqual(foods);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('should apply ILike filter when search provided', async () => {
      foodRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll('rice', 1, 20);

      const call = foodRepo.findAndCount.mock.calls[0][0];
      expect(call.where).toEqual(expect.objectContaining({ name: expect.anything() }));
    });
  });

  describe('create', () => {
    it('should create food and return it without units', async () => {
      const dto = { name: 'Chicken', brand: 'Farm', creatorId: 1 };
      const saved = { id: 2, ...dto };
      const foodWithUnits = { ...saved, units: [] };
      foodRepo.create.mockReturnValue(saved);
      foodRepo.save.mockResolvedValue(saved);
      foodRepo.findOne.mockResolvedValue(foodWithUnits);

      const result = await service.create(dto);

      expect(foodRepo.create).toHaveBeenCalledWith({ name: dto.name, brand: dto.brand, creatorId: dto.creatorId });
      expect(result).toEqual(foodWithUnits);
    });

    it('should call addNutritionFact for each unit when units provided', async () => {
      const unit = { unitId: 1, amount: 100, calories: 200, proteins: 10, fats: 5, carbs: 30 };
      const dto = { name: 'Oats', creatorId: 1, units: [unit] };
      const saved = { id: 3, name: 'Oats', creatorId: 1 };
      const foodWithUnits = { ...saved, units: [{ unitId: 1, calories: 200 }] };
      foodRepo.create.mockReturnValue(saved);
      foodRepo.save.mockResolvedValue(saved);
      // findOne called: once for addNutritionFact, once at end of create
      foodRepo.findOne.mockResolvedValue({ ...saved, creatorId: 1, units: [] });
      nutritionFactRepo.findOne.mockResolvedValue(null);
      nutritionFactRepo.create.mockReturnValue({ foodId: 3, ...unit });
      nutritionFactRepo.save.mockResolvedValue({ id: 1, foodId: 3, ...unit });
      // Final findOne returns food with units
      foodRepo.findOne.mockResolvedValueOnce({ ...saved, creatorId: 1, units: [] })
                      .mockResolvedValueOnce(foodWithUnits);

      const result = await service.create(dto);

      expect(nutritionFactRepo.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(foodWithUnits);
    });
  });

  describe('addNutritionFact', () => {
    const factDto = { unitId: 1, amount: 100, calories: 200, proteins: 10, fats: 5, carbs: 30 };

    it('should create new NutritionFact when none exists for unitId', async () => {
      const food = { id: 1, creatorId: 1, units: [] };
      foodRepo.findOne.mockResolvedValue(food);
      nutritionFactRepo.findOne.mockResolvedValue(null);
      const newFact = { id: 10, foodId: 1, ...factDto };
      nutritionFactRepo.create.mockReturnValue(newFact);
      nutritionFactRepo.save.mockResolvedValue(newFact);

      const result = await service.addNutritionFact(1, 1, factDto);

      expect(nutritionFactRepo.create).toHaveBeenCalledWith({ foodId: 1, ...factDto });
      expect(result).toEqual(newFact);
    });

    it('should update existing NutritionFact when unitId already present (upsert)', async () => {
      const food = { id: 1, creatorId: 1, units: [] };
      const existing = { id: 5, foodId: 1, unitId: 1, amount: 50, calories: 100, proteins: 5, fats: 2, carbs: 15 };
      foodRepo.findOne.mockResolvedValue(food);
      nutritionFactRepo.findOne.mockResolvedValue(existing);
      nutritionFactRepo.save.mockResolvedValue({ ...existing, ...factDto });

      const result = await service.addNutritionFact(1, 1, factDto);

      expect(nutritionFactRepo.create).not.toHaveBeenCalled();
      expect(nutritionFactRepo.save).toHaveBeenCalledWith(expect.objectContaining({ calories: 200 }));
    });

    it('should allow userId=0 (admin) to add facts to any food', async () => {
      const food = { id: 1, creatorId: 2, units: [] };
      foodRepo.findOne.mockResolvedValue(food);
      nutritionFactRepo.findOne.mockResolvedValue(null);
      nutritionFactRepo.create.mockReturnValue({});
      nutritionFactRepo.save.mockResolvedValue({});

      await expect(service.addNutritionFact(1, 0, factDto)).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when non-creator tries to add fact', async () => {
      const food = { id: 1, creatorId: 2, units: [] };
      foodRepo.findOne.mockResolvedValue(food);

      await expect(service.addNutritionFact(1, 5, factDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeNutritionFact', () => {
    it('should remove the fact and return updated food', async () => {
      const food = { id: 1, creatorId: 1, units: [] };
      const fact = { id: 3, foodId: 1, unitId: 2 };
      const updatedFood = { id: 1, creatorId: 1, units: [] };
      foodRepo.findOne.mockResolvedValueOnce(food).mockResolvedValueOnce(updatedFood);
      nutritionFactRepo.findOne.mockResolvedValue(fact);
      nutritionFactRepo.remove.mockResolvedValue(fact);

      const result = await service.removeNutritionFact(1, 2, 1);

      expect(nutritionFactRepo.remove).toHaveBeenCalledWith(fact);
      expect(result).toEqual(updatedFood);
    });

    it('should throw ForbiddenException when non-creator tries to remove', async () => {
      foodRepo.findOne.mockResolvedValue({ id: 1, creatorId: 3, units: [] });

      await expect(service.removeNutritionFact(1, 2, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when fact not found', async () => {
      foodRepo.findOne.mockResolvedValue({ id: 1, creatorId: 1, units: [] });
      nutritionFactRepo.findOne.mockResolvedValue(null);

      await expect(service.removeNutritionFact(1, 99, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete when food is referenced in logs or plans', async () => {
      const food = { id: 1, creatorId: 1, units: [] };
      foodRepo.findOne.mockResolvedValue(food);
      logMealItemRepo.count.mockResolvedValue(2);
      planMealItemRepo.count.mockResolvedValue(0);

      await service.remove(1, 1);

      expect(foodRepo.softDelete).toHaveBeenCalledWith(1);
      expect(foodRepo.remove).not.toHaveBeenCalled();
    });

    it('should hard-delete when food has no references', async () => {
      const food = { id: 1, creatorId: 1, units: [] };
      foodRepo.findOne.mockResolvedValue(food);
      logMealItemRepo.count.mockResolvedValue(0);
      planMealItemRepo.count.mockResolvedValue(0);
      foodRepo.remove.mockResolvedValue(food);

      await service.remove(1, 1);

      expect(foodRepo.remove).toHaveBeenCalledWith(food);
      expect(foodRepo.softDelete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-creator tries to delete', async () => {
      foodRepo.findOne.mockResolvedValue({ id: 1, creatorId: 5, units: [] });

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should allow deletion of food without a creator (system food)', async () => {
      const food = { id: 1, creatorId: null, units: [] };
      foodRepo.findOne.mockResolvedValue(food);
      logMealItemRepo.count.mockResolvedValue(0);
      planMealItemRepo.count.mockResolvedValue(0);
      foodRepo.remove.mockResolvedValue(food);

      await expect(service.remove(1, 1)).resolves.not.toThrow();
    });
  });
});
