import type { IFriendship } from '@athlo/shared';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { FriendStatusEntity } from './friend-status.entity';

@Entity({ name: 'user_friends' })
export class UserFriendEntity implements IFriendship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'friend_id' })
  friendId: number;

  @Column({ name: 'status_id' })
  statusId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friend_id' })
  friend: UserEntity;

  @ManyToOne(() => FriendStatusEntity, { eager: false })
  @JoinColumn({ name: 'status_id' })
  friendStatus: FriendStatusEntity;
}
