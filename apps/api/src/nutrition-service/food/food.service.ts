import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { FoodEntity } from '../entities/food.entity';
import { CreateFoodDto } from '../dto/food/create-food.dto';
import { UpdateFoodDto } from '../dto/food/update-food.dto';

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(FoodEntity)
    private readonly foodRepository: Repository<FoodEntity>,
  ) {}

  async create(dto: CreateFoodDto) {
    const food = this.foodRepository.create(dto);
    return this.foodRepository.save(food);
  }

  async findAll(search?: string, page = 1, limit = 20) {
    const where = search ? { name: ILike(`%${search}%`) } : {};
    const [data, total] = await this.foodRepository.findAndCount({
      where,
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
    const food = await this.foodRepository.findOne({ where: { id } });
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

  async remove(id: number) {
    const food = await this.findOne(id);
    await this.foodRepository.remove(food);
  }
}
