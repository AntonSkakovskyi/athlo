import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';
import { FoodEntity } from '../entities/food.entity';
import { FoodUnitEntity } from '../entities/food-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FoodEntity, FoodUnitEntity])],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
