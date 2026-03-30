import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealPlanService } from './meal-plan.service';
import { MealPlanController } from './meal-plan.controller';
import { MealPlanEntity } from '../entities/meal-plan.entity';
import { PlanDayEntity } from '../entities/plan-day.entity';
import { PlanMealEntity } from '../entities/plan-meal.entity';
import { PlanMealItemEntity } from '../entities/plan-meal-item.entity';
import { UserMealPlanEntity } from '../entities/user-meal-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MealPlanEntity,
      PlanDayEntity,
      PlanMealEntity,
      PlanMealItemEntity,
      UserMealPlanEntity,
    ]),
  ],
  controllers: [MealPlanController],
  providers: [MealPlanService],
})
export class MealPlanModule {}
