import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MealPlanService } from './meal-plan.service';
import { MealPlanEntity } from '../entities/meal-plan.entity';
import { PlanDayEntity } from '../entities/plan-day.entity';
import { PlanMealEntity } from '../entities/plan-meal.entity';
import { PlanMealItemEntity } from '../entities/plan-meal-item.entity';
import { UserMealPlanEntity } from '../entities/user-meal-plan.entity';
import { FriendService } from '../../user-service/friends/friend.service';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockFriendService = {
  isFriend: jest.fn(),
  getFriendIds: jest.fn(),
};

describe('MealPlanService', () => {
  let service: MealPlanService;
  let mealPlanRepo: ReturnType<typeof createMockRepository>;
  let planDayRepo: ReturnType<typeof createMockRepository>;
  let planMealRepo: ReturnType<typeof createMockRepository>;
  let planMealItemRepo: ReturnType<typeof createMockRepository>;
  let userMealPlanRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlanService,
        {
          provide: getRepositoryToken(MealPlanEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(PlanDayEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(PlanMealEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(PlanMealItemEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserMealPlanEntity),
          useValue: createMockRepository(),
        },
        { provide: FriendService, useValue: mockFriendService },
      ],
    }).compile();

    service = module.get<MealPlanService>(MealPlanService);
    mealPlanRepo = module.get(getRepositoryToken(MealPlanEntity));
    planDayRepo = module.get(getRepositoryToken(PlanDayEntity));
    planMealRepo = module.get(getRepositoryToken(PlanMealEntity));
    planMealItemRepo = module.get(getRepositoryToken(PlanMealItemEntity));
    userMealPlanRepo = module.get(getRepositoryToken(UserMealPlanEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────

  describe('create', () => {
    it('should not create days when totalDays is 0', async () => {
      const dto = { name: 'My Plan', totalDays: 0 };
      const savedPlan = { id: 1, creatorId: 1, name: 'My Plan', totalDays: 0 };
      mealPlanRepo.create.mockReturnValue(savedPlan);
      mealPlanRepo.save.mockResolvedValue(savedPlan);

      await service.create(1, dto);

      expect(planDayRepo.save).not.toHaveBeenCalled();
    });

    it('should create the correct number of days when totalDays > 0', async () => {
      const dto = { name: '3-Day Plan', totalDays: 3 };
      const savedPlan = {
        id: 2,
        creatorId: 1,
        name: '3-Day Plan',
        totalDays: 3,
      };
      mealPlanRepo.create.mockReturnValue(savedPlan);
      mealPlanRepo.save.mockResolvedValue(savedPlan);
      planDayRepo.create.mockImplementation((d) => d);
      planDayRepo.save.mockResolvedValue([]);

      await service.create(1, dto);

      expect(planDayRepo.create).toHaveBeenCalledTimes(3);
      expect(planDayRepo.create).toHaveBeenCalledWith({
        mealPlanId: 2,
        dayNumber: 1,
      });
      expect(planDayRepo.create).toHaveBeenCalledWith({
        mealPlanId: 2,
        dayNumber: 3,
      });
    });

    it('should default to totalDays=0 when not provided', async () => {
      const dto = { name: 'No Days Plan' };
      const savedPlan = { id: 3, totalDays: 0 };
      mealPlanRepo.create.mockReturnValue(savedPlan);
      mealPlanRepo.save.mockResolvedValue(savedPlan);

      await service.create(1, dto as any);

      expect(planDayRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── findOne ──────────────────────────────────────

  describe('findOne', () => {
    it('should return plan for the creator regardless of visibility', async () => {
      const plan = { id: 1, creatorId: 1, visibilityTypeId: 1, days: [] };
      mealPlanRepo.findOne.mockResolvedValue(plan);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(plan);
    });

    it('should return PUBLIC plan for any user', async () => {
      const plan = { id: 1, creatorId: 2, visibilityTypeId: 2, days: [] };
      mealPlanRepo.findOne.mockResolvedValue(plan);

      const result = await service.findOne(1, 5);

      expect(result).toEqual(plan);
    });

    it('should throw ForbiddenException for PRIVATE plan when not creator', async () => {
      mealPlanRepo.findOne.mockResolvedValue({
        id: 1,
        creatorId: 2,
        visibilityTypeId: 1,
      });

      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should return FRIENDS_ONLY plan to a friend', async () => {
      const plan = { id: 1, creatorId: 2, visibilityTypeId: 3, days: [] };
      mealPlanRepo.findOne.mockResolvedValue(plan);
      mockFriendService.isFriend.mockResolvedValue(true);

      const result = await service.findOne(1, 5);

      expect(mockFriendService.isFriend).toHaveBeenCalledWith(5, 2);
      expect(result).toEqual(plan);
    });

    it('should throw ForbiddenException for FRIENDS_ONLY plan when not a friend', async () => {
      mealPlanRepo.findOne.mockResolvedValue({
        id: 1,
        creatorId: 2,
        visibilityTypeId: 3,
      });
      mockFriendService.isFriend.mockResolvedValue(false);

      await expect(service.findOne(1, 5)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mealPlanRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── removeDay ────────────────────────────────────

  describe('removeDay', () => {
    it('should remove day and renumber remaining days', async () => {
      const plan = { id: 1, creatorId: 1 };
      const day = { id: 5, mealPlanId: 1, dayNumber: 2 };
      const remaining = [
        { id: 3, dayNumber: 1 },
        { id: 7, dayNumber: 3 },
      ];

      mealPlanRepo.findOne.mockResolvedValue(plan);
      planDayRepo.findOne.mockResolvedValue(day);
      planDayRepo.remove.mockResolvedValue(day);
      planDayRepo.find.mockResolvedValue(remaining);
      planDayRepo.save.mockResolvedValue([]);
      mealPlanRepo.update.mockResolvedValue({});

      await service.removeDay(1, 5, 1);

      // Days should be renumbered 1, 2
      expect(remaining[0].dayNumber).toBe(1);
      expect(remaining[1].dayNumber).toBe(2);
      expect(planDayRepo.save).toHaveBeenCalledWith(remaining);
      expect(mealPlanRepo.update).toHaveBeenCalledWith(1, { totalDays: 2 });
    });

    it('should throw NotFoundException when day does not exist', async () => {
      mealPlanRepo.findOne.mockResolvedValue({ id: 1, creatorId: 1 });
      planDayRepo.findOne.mockResolvedValue(null);

      await expect(service.removeDay(1, 99, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when not the plan owner', async () => {
      mealPlanRepo.findOne.mockResolvedValue({ id: 1, creatorId: 2 });

      await expect(service.removeDay(1, 5, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── savePlan ─────────────────────────────────────

  describe('savePlan', () => {
    it('should save an external plan for the user', async () => {
      const plan = { id: 1, creatorId: 2 };
      const userPlan = { userId: 1, mealPlanId: 1, isActive: false };
      mealPlanRepo.findOne.mockResolvedValue(plan);
      userMealPlanRepo.findOne.mockResolvedValue(null);
      userMealPlanRepo.create.mockReturnValue(userPlan);
      userMealPlanRepo.save.mockResolvedValue(userPlan);

      const result = await service.savePlan(1, 1);

      expect(result).toEqual(userPlan);
    });

    it('should throw BadRequestException when user tries to save own plan', async () => {
      mealPlanRepo.findOne.mockResolvedValue({ id: 1, creatorId: 1 });

      await expect(service.savePlan(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should return existing saved plan without duplicating', async () => {
      const plan = { id: 1, creatorId: 2 };
      const existing = { userId: 1, mealPlanId: 1, isActive: false };
      mealPlanRepo.findOne.mockResolvedValue(plan);
      userMealPlanRepo.findOne.mockResolvedValue(existing);

      const result = await service.savePlan(1, 1);

      expect(userMealPlanRepo.save).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('should throw NotFoundException when plan does not exist', async () => {
      mealPlanRepo.findOne.mockResolvedValue(null);

      await expect(service.savePlan(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
