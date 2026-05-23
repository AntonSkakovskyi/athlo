import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import type { IMealPlan } from '@athlo/shared';
import { UserEntity } from '../../user-service/user/entities/user.entity';
import { PlanDayEntity } from './plan-day.entity';

@Entity({ name: 'meal_plans' })
export class MealPlanEntity implements IMealPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @Column({ name: 'visibility_type_id', default: 1 })
  visibilityTypeId: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'total_days', default: 1 })
  totalDays: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;

  @OneToMany(() => PlanDayEntity, (day) => day.mealPlan, { cascade: true })
  days: PlanDayEntity[];
}
