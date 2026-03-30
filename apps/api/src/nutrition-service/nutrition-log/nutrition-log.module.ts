import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionLogService } from './nutrition-log.service';
import { NutritionLogController } from './nutrition-log.controller';
import { LogMealEntity } from '../entities/log-meal.entity';
import { LogMealItemEntity } from '../entities/log-meal-item.entity';
import { WaterLogEntity } from '../entities/water-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogMealEntity, LogMealItemEntity, WaterLogEntity]),
  ],
  controllers: [NutritionLogController],
  providers: [NutritionLogService],
})
export class NutritionLogModule {}
