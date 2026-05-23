import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';
import { FoodEntity } from '../entities/food.entity';
import { NutritionFactEntity } from '../entities/nutrition-fact.entity';
import { LogMealItemEntity } from '../entities/log-meal-item.entity';
import { PlanMealItemEntity } from '../entities/plan-meal-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FoodEntity, NutritionFactEntity, LogMealItemEntity, PlanMealItemEntity])],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
