import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { ILogMealItem } from '@athlo/shared';
import { LogMealEntity } from './log-meal.entity';
import { FoodEntity } from './food.entity';
import { UnitEntity } from '../../user-service/body-metrics/entities/unit.entity';

@Entity({ name: 'log_meal_items' })
export class LogMealItemEntity implements ILogMealItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'log_meal_id' })
  logMealId: number;

  @Column({ name: 'food_id' })
  foodId: number;

  @Column({ name: 'unit_id' })
  unitId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'calculated_weight_g', type: 'decimal', precision: 10, scale: 2, nullable: true })
  calculatedWeightG: number | null;

  @ManyToOne(() => LogMealEntity, (meal) => meal.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'log_meal_id' })
  logMeal: LogMealEntity;

  @ManyToOne(() => FoodEntity)
  @JoinColumn({ name: 'food_id' })
  food: FoodEntity;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;
}
