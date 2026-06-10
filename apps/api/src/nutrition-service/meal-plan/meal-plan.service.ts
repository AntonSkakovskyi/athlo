import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { findOwnedOrFail } from '../../common/helpers/find-owned-or-fail';
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
import { UpdatePlanMealDto } from '../dto/meal-plan/update-plan-meal.dto';
import { UpdatePlanMealItemDto } from '../dto/meal-plan/update-plan-meal-item.dto';
import { ActivateMealPlanDto } from '../dto/meal-plan/activate-meal-plan.dto';
import { FriendService } from '../../user-service/friends/friend.service';
import { In } from 'typeorm';

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
    private readonly dataSource: DataSource,
  ) {}

  // ─── Meal Plans ───────────────────────────────────

  async create(userId: number, dto: CreateMealPlanDto) {
    const totalDays = dto.totalDays ?? 0;

    // План і його дні створюються атомарно — не буває плану без днів
    return this.dataSource.transaction(async (em) => {
      const plan = em.create(MealPlanEntity, {
        creatorId: userId,
        name: dto.name,
        description: dto.description,
        visibilityTypeId: dto.visibilityTypeId ?? 1,
        totalDays,
      });

      const savedPlan = await em.save(plan);

      // Automatically create days only if totalDays > 0
      if (totalDays > 0) {
        const days = [];
        for (let i = 1; i <= totalDays; i++) {
          days.push(
            em.create(PlanDayEntity, {
              mealPlanId: savedPlan.id,
              dayNumber: i,
            }),
          );
        }
        await em.save(days);
      }

      return savedPlan;
    });
  }

  async findMyPlans(userId: number) {
    return this.mealPlanRepository.find({
      where: { creatorId: userId },
      order: { id: 'DESC' },
    });
  }

  async findPublicPlans(
    userId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const query = this.mealPlanRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.creator', 'creator')
      .where('p.visibilityTypeId = :public', { public: 2 }) // PUBLIC
      .andWhere('p.creatorId != :userId', { userId });

    if (search) {
      query.andWhere('p.name ILIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await query
      .orderBy('p.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: items.map((p) => ({
        ...p,
        creatorNickname: p.creator?.nickname,
        creator: undefined,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findFriendsPlans(userId: number) {
    const friendIds = await this.friendService.getFriendIds(userId);
    if (friendIds.length === 0) return [];

    return this.mealPlanRepository
      .find({
        where: {
          creatorId: In(friendIds),
          visibilityTypeId: In([2, 3]), // PUBLIC or FRIENDS_ONLY
        },
        relations: { creator: true },
        order: { id: 'DESC' },
      })
      .then((plans) =>
        plans.map((p) => ({
          ...p,
          creatorNickname: p.creator?.nickname,
          creator: undefined,
        })),
      );
  }

  async findSavedPlans(userId: number) {
    const saved = await this.userMealPlanRepository.find({
      where: { userId },
      relations: {
        mealPlan: { creator: true },
      },
    });

    return saved
      .filter((s) => s.mealPlan.creatorId !== userId)
      .map((s) => ({
        ...s.mealPlan,
        creatorNickname: s.mealPlan.creator?.nickname,
        creator: undefined,
      }));
  }

  async findMealPlansForUser(currentUserId: number, targetUserId: number) {
    const isFriend = await this.friendService.isFriend(
      currentUserId,
      targetUserId,
    );
    const visibilityIds = [2]; // PUBLIC
    if (isFriend) {
      visibilityIds.push(3); // FRIENDS_ONLY
    }

    return this.mealPlanRepository
      .find({
        where: {
          creatorId: targetUserId,
          visibilityTypeId: In(visibilityIds),
        },
        relations: { creator: true },
        order: { id: 'DESC' },
      })
      .then((plans) =>
        plans.map((p) => ({
          ...p,
          creatorNickname: p.creator?.nickname,
          creator: undefined,
        })),
      );
  }

  async findOne(id: number, userId: number) {
    const plan = await this.mealPlanRepository.findOne({
      where: { id },
      relations: {
        days: {
          meals: {
            mealType: true,
            items: {
              food: { units: true },
              unit: true,
            },
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
        throw new ForbiddenException(
          'You do not have access to this meal plan',
        );
      }
      if (plan.visibilityTypeId === 3) {
        const isFriend = await this.friendService.isFriend(
          userId,
          plan.creatorId,
        );
        if (!isFriend) {
          throw new ForbiddenException(
            'You do not have access to this meal plan',
          );
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
      throw new ForbiddenException(
        'Only the creator can delete this meal plan',
      );
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
    const savedDay = await this.planDayRepository.save(day);

    // Update totalDays count
    const count = await this.planDayRepository.count({
      where: { mealPlanId: planId },
    });
    await this.mealPlanRepository.update(planId, { totalDays: count });

    return savedDay;
  }

  async removeDay(planId: number, dayId: number, userId: number) {
    await this.assertOwner(planId, userId);
    const day = await this.planDayRepository.findOne({
      where: { id: dayId, mealPlanId: planId },
    });
    if (!day) {
      throw new NotFoundException(`Plan day with ID ${dayId} not found`);
    }
    await this.planDayRepository.remove(day);

    // Reorder remaining days to ensure they are contiguous (1, 2, 3...)
    const remainingDays = await this.planDayRepository.find({
      where: { mealPlanId: planId },
      order: { dayNumber: 'ASC' },
    });

    for (let i = 0; i < remainingDays.length; i++) {
      remainingDays[i].dayNumber = i + 1;
    }
    await this.planDayRepository.save(remainingDays);

    // Update totalDays count in the main meal plan record
    await this.mealPlanRepository.update(planId, {
      totalDays: remainingDays.length,
    });
  }

  // ─── Plan Meals ───────────────────────────────────

  async addMeal(
    planId: number,
    dayId: number,
    userId: number,
    dto: CreatePlanMealDto,
  ) {
    await this.assertOwner(planId, userId);
    const meal = this.planMealRepository.create({
      planDayId: dayId,
      mealTypeId: dto.mealTypeId,
      order: dto.order,
      timeSuggestion: dto.timeSuggestion,
    });
    return this.planMealRepository.save(meal);
  }

  async updatePlanMeal(
    planId: number,
    mealId: number,
    userId: number,
    dto: UpdatePlanMealDto,
  ) {
    await this.assertOwner(planId, userId);

    const updateData: any = {};
    if (dto.mealTypeId !== undefined) updateData.mealTypeId = dto.mealTypeId;
    if (dto.order !== undefined) updateData.order = dto.order;
    if (dto.timeSuggestion !== undefined)
      updateData.timeSuggestion = dto.timeSuggestion;

    if (Object.keys(updateData).length > 0) {
      await this.planMealRepository.update(mealId, updateData);
    }

    return this.planMealRepository.findOne({
      where: { id: mealId },
      relations: { mealType: true },
    });
  }

  async removeMeal(planId: number, mealId: number, userId: number) {
    await this.assertOwner(planId, userId);
    const meal = await this.planMealRepository.findOne({
      where: { id: mealId },
    });
    if (!meal) {
      throw new NotFoundException(`Plan meal with ID ${mealId} not found`);
    }
    await this.planMealRepository.remove(meal);
  }

  // ─── Plan Meal Items ──────────────────────────────

  async addMealItem(
    planId: number,
    mealId: number,
    userId: number,
    dto: CreatePlanMealItemDto,
  ) {
    await this.assertOwner(planId, userId);
    const item = this.planMealItemRepository.create({
      planMealId: mealId,
      foodId: dto.foodId,
      unitId: dto.unitId,
      amount: dto.amount,
    });
    return this.planMealItemRepository.save(item);
  }

  async updateMealItem(
    planId: number,
    itemId: number,
    userId: number,
    dto: UpdatePlanMealItemDto,
  ) {
    await this.assertOwner(planId, userId);
    const item = await this.planMealItemRepository.findOne({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException(`Plan meal item with ID ${itemId} not found`);
    }
    if (dto.foodId !== undefined) item.foodId = dto.foodId;
    if (dto.unitId !== undefined) item.unitId = dto.unitId;
    if (dto.amount !== undefined) item.amount = dto.amount;
    return this.planMealItemRepository.save(item);
  }

  async removeMealItem(planId: number, itemId: number, userId: number) {
    await this.assertOwner(planId, userId);
    const item = await this.planMealItemRepository.findOne({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException(`Plan meal item with ID ${itemId} not found`);
    }
    await this.planMealItemRepository.remove(item);
  }

  // ─── User Meal Plans (save/activate) ──────────────

  async activatePlan(userId: number, planId: number, dto: ActivateMealPlanDto) {
    // Deactivate current active plan
    await this.userMealPlanRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );

    const startedAt = new Date();
    if (dto.startDay && dto.startDay > 1) {
      // Subtract (startDay - 1) days to make "today" be the specified day of the plan
      startedAt.setDate(startedAt.getDate() - (dto.startDay - 1));
    }

    const existing = await this.userMealPlanRepository.findOne({
      where: { userId, mealPlanId: planId },
    });

    if (existing) {
      existing.isActive = true;
      existing.startedAt = startedAt;
      return this.userMealPlanRepository.save(existing);
    }

    const userPlan = this.userMealPlanRepository.create({
      userId,
      mealPlanId: planId,
      isActive: true,
      startedAt,
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

  async savePlan(planId: number, userId: number) {
    const plan = await this.mealPlanRepository.findOne({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException(`Meal plan with ID ${planId} not found`);
    }

    if (plan.creatorId === userId) {
      throw new BadRequestException('You cannot save your own meal plan');
    }

    const existing = await this.userMealPlanRepository.findOne({
      where: { userId, mealPlanId: planId },
    });

    if (existing) {
      return existing;
    }

    const userPlan = this.userMealPlanRepository.create({
      userId,
      mealPlanId: planId,
      isActive: false,
    });
    return this.userMealPlanRepository.save(userPlan);
  }

  async unsavePlan(planId: number, userId: number) {
    const userPlan = await this.userMealPlanRepository.findOne({
      where: { userId, mealPlanId: planId },
    });

    if (!userPlan) {
      throw new NotFoundException('Saved meal plan not found');
    }

    await this.userMealPlanRepository.remove(userPlan);
  }

  // ─── Helpers ──────────────────────────────────────

  private async assertOwner(planId: number, userId: number) {
    await findOwnedOrFail(this.mealPlanRepository, {
      where: { id: planId },
      userId,
      ownerField: 'creatorId',
      notFoundMessage: `Meal plan with ID ${planId} not found`,
      forbiddenMessage: 'Only the creator can modify this meal plan',
    });
  }
}
