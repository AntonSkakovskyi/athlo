import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { IUserMealPlan } from '@athlo/shared';
import { UserEntity } from '../../user-service/user/entities/user.entity';
import { MealPlanEntity } from './meal-plan.entity';

@Entity({ name: 'user_meal_plans' })
export class UserMealPlanEntity implements IUserMealPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'meal_plan_id' })
  mealPlanId: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'started_at', type: 'date', default: () => 'CURRENT_DATE' })
  startedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => MealPlanEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meal_plan_id' })
  mealPlan: MealPlanEntity;
}
