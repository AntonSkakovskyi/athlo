import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealPlanEntity } from '../entities/meal-plan.entity';
import { PlanDayEntity } from '../entities/plan-day.entity';
import { PlanMealEntity } from '../entities/plan-meal.entity';
import { PlanMealItemEntity } from '../entities/plan-meal-item.entity';
import { UserMealPlanEntity } from '../entities/user-meal-plan.entity';
import { CreateMealPlanDto } from '../dto/meal-plan/create-meal-plan.dto';
import { UpdateMealPlanDto } from '../dto/meal-plan/update-meal-plan.dto';
import { CreatePlanDayDto } from '../dto/meal-plan/create-plan-day.dto';
import { CreatePlanMealDto } from '../dto/meal-plan/create-plan-meal.dto';
import { CreatePlanMealItemDto } from '../dto/meal-plan/create-plan-meal-item.dto';
import { FriendService } from 'src/user-service/friends/friend.service';

@Injectable()
export class MealPlanService {
  constructor(
    @InjectRepository(MealPlanEntity)
    private readonly mealPlanRepository: Repository<MealPlanEntity>,
    @InjectRepository(PlanDayEntity)
    private readonly planDayRepository: Repository<PlanDayEntity>,
    @InjectRepository(PlanMealEntity)
    private readonly planMealRepository: Repository<PlanMealEntity>,
    @InjectRepository(PlanMealItemEntity)
    private readonly planMealItemRepository: Repository<PlanMealItemEntity>,
    @InjectRepository(UserMealPlanEntity)
    private readonly userMealPlanRepository: Repository<UserMealPlanEntity>,
    private readonly friendService: FriendService,
  ) {}

  // ─── Meal Plans ───────────────────────────────────

  async create(userId: number, dto: CreateMealPlanDto) {
    const plan = this.mealPlanRepository.create({
      creatorId: userId,
      name: dto.name,
      description: dto.description,
      visibilityTypeId: dto.visibilityTypeId ?? 1,
      totalDays: dto.totalDays ?? 1,
    });
    return this.mealPlanRepository.save(plan);
  }

  async findMyPlans(userId: number) {
    return this.mealPlanRepository.find({
      where: { creatorId: userId },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const plan = await this.mealPlanRepository.findOne({
      where: { id },
      relations: {
        days: {
          meals: {
            mealType: true,
            items: { food: true, unit: true },
          },
        },
      },
      order: {
        days: {
          dayNumber: 'ASC',
          meals: {
            order: 'ASC',
            items: { id: 'ASC' },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Meal plan with ID ${id} not found`);
    }

    if (plan.creatorId !== userId) {
      // visibilityTypeId: 1 = PRIVATE, 2 = PUBLIC, 3 = FRIENDS_ONLY
      if (plan.visibilityTypeId === 1) {
        throw new ForbiddenException('You do not have access to this meal plan');
      }
      if (plan.visibilityTypeId === 3) {
        const isFriend = await this.friendService.isFriend(userId, plan.creatorId);
        if (!isFriend) {
          throw new ForbiddenException('You do not have access to this meal plan');
        }
      }
    }

    return plan;
  }

  async update(id: number, userId: number, dto: UpdateMealPlanDto) {
    const plan = await this.findOne(id, userId);
    if (plan.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can edit this meal plan');
    }
    Object.assign(plan, dto);
    return this.mealPlanRepository.save(plan);
  }

  async remove(id: number, userId: number) {
    const plan = await this.findOne(id, userId);
    if (plan.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can delete this meal plan');
    }
    await this.mealPlanRepository.remove(plan);
  }

  // ─── Plan Days ────────────────────────────────────

  async addDay(planId: number, userId: number, dto: CreatePlanDayDto) {
    await this.assertOwner(planId, userId);
    const day = this.planDayRepository.create({
      mealPlanId: planId,
      dayNumber: dto.dayNumber,
      notes: dto.notes,
    });
    return this.planDayRepository.save(day);
  }

  async removeDay(planId: number, dayId: number, userId: number) {
    await this.assertOwner(planId, userId);
    const day = await this.planDayRepository.findOne({ where: { id: dayId, mealPlanId: planId } });
    if (!day) {
      throw new NotFoundException(`Plan day with ID ${dayId} not found`);
    }
    await this.planDayRepository.remove(day);
  }

  // ─── Plan Meals ───────────────────────────────────

  async addMeal(planId: number, dayId: number, userId: number, dto: CreatePlanMealDto) {
    await this.assertOwner(planId, userId);
    const meal = this.planMealRepository.create({
      planDayId: dayId,
      mealTypeId: dto.mealTypeId,
      order: dto.order,
      timeSuggestion: dto.timeSuggestion,
    });
    return this.planMealRepository.save(meal);
  }

  async removeMeal(planId: number, mealId: number, userId: number) {
    await this.assertOwner(planId, userId);
    const meal = await this.planMealRepository.findOne({ where: { id: mealId } });
    if (!meal) {
      throw new NotFoundException(`Plan meal with ID ${mealId} not found`);
    }
    await this.planMealRepository.remove(meal);
  }

  // ─── Plan Meal Items ──────────────────────────────

  async addMealItem(planId: number, mealId: number, userId: number, dto: CreatePlanMealItemDto) {
    await this.assertOwner(planId, userId);
    const item = this.planMealItemRepository.create({
      planMealId: mealId,
      foodId: dto.foodId,
      unitId: dto.unitId,
      amount: dto.amount,
    });
    return this.planMealItemRepository.save(item);
  }

  async removeMealItem(planId: number, itemId: number, userId: number) {
    await this.assertOwner(planId, userId);
    const item = await this.planMealItemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Plan meal item with ID ${itemId} not found`);
    }
    await this.planMealItemRepository.remove(item);
  }

  // ─── User Meal Plans (save/activate) ──────────────

  async activatePlan(userId: number, planId: number) {
    // Deactivate current active plan
    await this.userMealPlanRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );

    const existing = await this.userMealPlanRepository.findOne({
      where: { userId, mealPlanId: planId },
    });

    if (existing) {
      existing.isActive = true;
      existing.startedAt = new Date();
      return this.userMealPlanRepository.save(existing);
    }

    const userPlan = this.userMealPlanRepository.create({
      userId,
      mealPlanId: planId,
      isActive: true,
    });
    return this.userMealPlanRepository.save(userPlan);
  }

  async deactivatePlan(userId: number) {
    await this.userMealPlanRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async getActivePlan(userId: number) {
    const userPlan = await this.userMealPlanRepository.findOne({
      where: { userId, isActive: true },
      relations: {
        mealPlan: {
          days: {
            meals: {
              mealType: true,
              items: { food: true, unit: true },
            },
          },
        },
      },
    });
    return userPlan;
  }

  // ─── Helpers ──────────────────────────────────────

  private async assertOwner(planId: number, userId: number) {
    const plan = await this.mealPlanRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Meal plan with ID ${planId} not found`);
    }
    if (plan.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can modify this meal plan');
    }
  }
}
