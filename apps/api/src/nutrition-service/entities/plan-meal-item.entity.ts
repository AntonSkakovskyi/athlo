import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { IPlanMealItem } from '@athlo/shared';
import { PlanMealEntity } from './plan-meal.entity';
import { FoodEntity } from './food.entity';
import { UnitEntity } from 'src/user-service/body-metrics/entities/unit.entity';

@Entity({ name: 'plan_meal_items' })
export class PlanMealItemEntity implements IPlanMealItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_meal_id' })
  planMealId: number;

  @Column({ name: 'food_id' })
  foodId: number;

  @Column({ name: 'unit_id' })
  unitId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => PlanMealEntity, (meal) => meal.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_meal_id' })
  planMeal: PlanMealEntity;

  @ManyToOne(() => FoodEntity)
  @JoinColumn({ name: 'food_id' })
  food: FoodEntity;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;
}
