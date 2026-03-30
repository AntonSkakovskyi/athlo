import { Module } from '@nestjs/common';
import { FoodModule } from './food/food.module';
import { MealTypeModule } from './meal-type/meal-type.module';
import { MealPlanModule } from './meal-plan/meal-plan.module';
import { NutritionLogModule } from './nutrition-log/nutrition-log.module';

@Module({
  imports: [FoodModule, MealTypeModule, MealPlanModule, NutritionLogModule],
})
export class NutritionServiceModule {}
