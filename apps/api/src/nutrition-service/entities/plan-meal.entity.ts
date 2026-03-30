import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import type { IPlanMeal } from '@athlo/shared';
import { PlanDayEntity } from './plan-day.entity';
import { MealTypeEntity } from './meal-type.entity';
import { PlanMealItemEntity } from './plan-meal-item.entity';

@Entity({ name: 'plan_meals' })
export class PlanMealEntity implements IPlanMeal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_day_id' })
  planDayId: number;

  @Column({ name: 'meal_type_id' })
  mealTypeId: number;

  @Column()
  order: number;

  @Column({ name: 'time_suggestion', type: 'time', nullable: true })
  timeSuggestion: string | null;

  @ManyToOne(() => PlanDayEntity, (day) => day.meals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_day_id' })
  planDay: PlanDayEntity;

  @ManyToOne(() => MealTypeEntity)
  @JoinColumn({ name: 'meal_type_id' })
  mealType: MealTypeEntity;

  @OneToMany(() => PlanMealItemEntity, (item) => item.planMeal, { cascade: true })
  items: PlanMealItemEntity[];
}
