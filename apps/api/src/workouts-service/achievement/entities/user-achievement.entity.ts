import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import type { IUserAchievement } from '@athlo/shared';
import { UserEntity } from '../../../user-service/user/entities/user.entity';
import { AchievementEntity } from './achievement.entity';

@Entity({ name: 'user_achievements' })
@Unique(['userId', 'achievementId'])
export class UserAchievementEntity implements IUserAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'achievement_id' })
  achievementId: number;

  @Column({ name: 'unlocked_at', type: 'timestamptz', default: () => 'now()' })
  unlockedAt: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  value: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => AchievementEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievement_id' })
  achievement: AchievementEntity;
}
