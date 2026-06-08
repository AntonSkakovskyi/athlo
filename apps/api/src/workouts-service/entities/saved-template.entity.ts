import type { IUserWorkoutTemplate } from '@athlo/shared';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../user-service/user/entities/user.entity';
import { WorkoutTemplateEntity } from './workout-template.entity';

@Entity({ name: 'user_workout_templates' })
export class UserWorkoutTemplateEntity implements IUserWorkoutTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'workout_template_id' })
  workoutTemplateId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => WorkoutTemplateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_template_id' })
  workoutTemplate: WorkoutTemplateEntity;
}
