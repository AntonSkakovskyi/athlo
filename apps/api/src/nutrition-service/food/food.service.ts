import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { FoodEntity } from '../entities/food.entity';
import { FoodUnitEntity } from '../entities/food-unit.entity';
import { CreateFoodDto } from '../dto/food/create-food.dto';
import { UpdateFoodDto } from '../dto/food/update-food.dto';
import { AddFoodUnitDto } from '../dto/food/add-food-unit.dto';

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(FoodEntity)
    private readonly foodRepository: Repository<FoodEntity>,
    @InjectRepository(FoodUnitEntity)
    private readonly foodUnitRepository: Repository<FoodUnitEntity>,
  ) {}

  async create(dto: CreateFoodDto) {
    const food = this.foodRepository.create(dto);
    return this.foodRepository.save(food);
  }

  async findAll(search?: string, page = 1, limit = 20) {
    const where = search ? { name: ILike(`%${search}%`) } : {};
    const [data, total] = await this.foodRepository.findAndCount({
      where,
      relations: ['units', 'units.unit'],
      order: { name: 'ASC' },
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
    Object.assign(food, dto);
    return this.foodRepository.save(food);
  }

  async remove(id: number, userId: number) {
    const food = await this.findOne(id);
    
    if (food.creatorId && food.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can delete this food');
    }
    
    await this.foodRepository.remove(food);
  }

  async addUnit(foodId: number, userId: number, dto: AddFoodUnitDto) {
    const food = await this.findOne(foodId);
    
    // Only allow creator to add units, unless it's a legacy food (creatorId is null) 
    // where we might want to restrict to admins or just allow for now.
    // Given the user's hint, we'll enforce creator check if creatorId exists.
    if (food.creatorId && food.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can add units to this food');
    }

    const existing = await this.foodUnitRepository.findOne({
      where: { foodId, unitId: dto.unitId }
    });

    if (existing) {
      existing.conversionFactor = dto.conversionFactor;
      return this.foodUnitRepository.save(existing);
    }

    const foodUnit = this.foodUnitRepository.create({
      foodId,
      unitId: dto.unitId,
      conversionFactor: dto.conversionFactor,
    });

    return this.foodUnitRepository.save(foodUnit);
  }
}
