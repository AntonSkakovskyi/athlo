import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { FoodEntity } from '../entities/food.entity';
import { NutritionFactEntity } from '../entities/nutrition-fact.entity';
import { LogMealItemEntity } from '../entities/log-meal-item.entity';
import { PlanMealItemEntity } from '../entities/plan-meal-item.entity';
import { CreateFoodDto } from '../dto/food/create-food.dto';
import { UpdateFoodDto } from '../dto/food/update-food.dto';
import { AddNutritionFactDto } from '../dto/food/add-nutrition-fact.dto';

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(FoodEntity)
    private readonly foodRepository: Repository<FoodEntity>,
    @InjectRepository(NutritionFactEntity)
    private readonly nutritionFactRepository: Repository<NutritionFactEntity>,
    @InjectRepository(LogMealItemEntity)
    private readonly logMealItemRepository: Repository<LogMealItemEntity>,
    @InjectRepository(PlanMealItemEntity)
    private readonly planMealItemRepository: Repository<PlanMealItemEntity>,
  ) {}

  async create(dto: CreateFoodDto) {
    const food = this.foodRepository.create({
      name: dto.name,
      brand: dto.brand,
      creatorId: dto.creatorId,
    });
    const savedFood = await this.foodRepository.save(food);

    if (dto.units && dto.units.length > 0) {
      for (const fact of dto.units) {
        await this.addNutritionFact(savedFood.id, dto.creatorId || 0, fact);
      }
    }

    return this.findOne(savedFood.id);
  }

  async findAll(search?: string, page = 1, limit = 20) {
    const where = search ? { name: ILike(`%${search}%`) } : {};
    const [data, total] = await this.foodRepository.findAndCount({
      where,
      relations: ['units', 'units.unit'],
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const food = await this.foodRepository.findOne({
      where: { id },
      relations: ['units', 'units.unit'],
    });
    if (!food) {
      throw new NotFoundException(`Food with ID ${id} not found`);
    }
    return food;
  }

  async update(id: number, dto: UpdateFoodDto) {
    const food = await this.findOne(id);
    if (dto.name !== undefined) food.name = dto.name;
    if (dto.brand !== undefined) food.brand = dto.brand;
    await this.foodRepository.save(food);

    if (dto.units && dto.units.length > 0) {
      for (const fact of dto.units) {
        await this.addNutritionFact(food.id, food.creatorId || 0, fact);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const food = await this.findOne(id);

    if (food.creatorId && food.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can delete this food');
    }

    const [logCount, planCount] = await Promise.all([
      this.logMealItemRepository.count({ where: { foodId: id } }),
      this.planMealItemRepository.count({ where: { foodId: id } }),
    ]);

    if (logCount > 0 || planCount > 0) {
      await this.foodRepository.softDelete(id);
    } else {
      await this.foodRepository.remove(food);
    }
  }

  async addNutritionFact(
    foodId: number,
    userId: number,
    dto: AddNutritionFactDto,
  ) {
    const food = await this.findOne(foodId);

    if (food.creatorId && food.creatorId !== userId && userId !== 0) {
      throw new ForbiddenException(
        'Only the creator can add units to this food',
      );
    }

    const existing = await this.nutritionFactRepository.findOne({
      where: { foodId, unitId: dto.unitId },
    });

    if (existing) {
      existing.amount = dto.amount;
      existing.calories = dto.calories;
      existing.proteins = dto.proteins;
      existing.fats = dto.fats;
      existing.carbs = dto.carbs;
      return this.nutritionFactRepository.save(existing);
    }

    const nutritionFact = this.nutritionFactRepository.create({
      foodId,
      unitId: dto.unitId,
      amount: dto.amount,
      calories: dto.calories,
      proteins: dto.proteins,
      fats: dto.fats,
      carbs: dto.carbs,
    });

    return this.nutritionFactRepository.save(nutritionFact);
  }

  async removeNutritionFact(foodId: number, unitId: number, userId: number) {
    const food = await this.findOne(foodId);

    if (food.creatorId && food.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the creator can remove units from this food',
      );
    }

    const fact = await this.nutritionFactRepository.findOne({
      where: { foodId, unitId },
    });

    if (!fact) {
      throw new NotFoundException(
        `Nutrition fact for unit ${unitId} not found`,
      );
    }

    await this.nutritionFactRepository.remove(fact);
    return this.findOne(foodId);
  }
}
