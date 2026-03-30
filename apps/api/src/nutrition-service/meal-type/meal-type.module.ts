import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealTypeService } from './meal-type.service';
import { MealTypeController } from './meal-type.controller';
import { MealTypeEntity } from '../entities/meal-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MealTypeEntity])],
  controllers: [MealTypeController],
  providers: [MealTypeService],
  exports: [MealTypeService],
})
export class MealTypeModule {}
