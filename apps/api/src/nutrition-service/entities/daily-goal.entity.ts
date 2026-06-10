import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../user-service/user/entities/user.entity';

@Entity({ name: 'daily_goals' })
@Unique(['userId', 'date'])
export class DailyGoalEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'calorie_goal', type: 'int', nullable: true })
  calorieGoal: number | null;

  @Column({ name: 'water_goal', type: 'int', nullable: true })
  waterGoal: number | null;

  @Column({ name: 'protein_goal', type: 'int', nullable: true })
  proteinGoal: number | null;

  @Column({ name: 'fat_goal', type: 'int', nullable: true })
  fatGoal: number | null;

  @Column({ name: 'carb_goal', type: 'int', nullable: true })
  carbGoal: number | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
