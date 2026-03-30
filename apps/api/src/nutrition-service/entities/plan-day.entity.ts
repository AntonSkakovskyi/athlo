import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import type { IPlanDay } from '@athlo/shared';
import { MealPlanEntity } from './meal-plan.entity';
import { PlanMealEntity } from './plan-meal.entity';

@Entity({ name: 'plan_days' })
export class PlanDayEntity implements IPlanDay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'meal_plan_id' })
  mealPlanId: number;

  @Column({ name: 'day_number' })
  dayNumber: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => MealPlanEntity, (plan) => plan.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meal_plan_id' })
  mealPlan: MealPlanEntity;

  @OneToMany(() => PlanMealEntity, (meal) => meal.planDay, { cascade: true })
  meals: PlanMealEntity[];
}
