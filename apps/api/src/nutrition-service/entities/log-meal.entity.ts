import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import type { ILogMeal } from '@athlo/shared';
import { UserEntity } from '../../user-service/user/entities/user.entity';
import { MealTypeEntity } from './meal-type.entity';
import { LogMealItemEntity } from './log-meal-item.entity';

@Entity({ name: 'log_meals' })
export class LogMealEntity implements ILogMeal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'meal_type_id', type: 'int', nullable: true })
  mealTypeId: number | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ name: 'original_plan_meal_id', type: 'int', nullable: true })
  originalPlanMealId: number | null;

  @Column({
    name: 'consumed_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  consumedAt: Date;

  @Column({ name: 'day_log_date', type: 'date', default: () => 'CURRENT_DATE' })
  dayLogDate: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => MealTypeEntity)
  @JoinColumn({ name: 'meal_type_id' })
  mealType: MealTypeEntity;

  @OneToMany(() => LogMealItemEntity, (item) => item.logMeal, { cascade: true })
  items: LogMealItemEntity[];
}
