import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import type { IUserSettings } from '@athlo/shared';

@Entity({ name: 'settings' })
export class UserSettingEntity implements IUserSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

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
