import { type IFriendship, FriendRequestStatus } from '@athlo/shared';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, CreateDateColumn, Index } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

@Entity({ name: 'user_friends' })
@Unique('idx_unique_friendship', ['userId', 'friendId'])
export class UserFriendEntity implements IFriendship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'friend_id' })
  friendId: number;

  @Column({ name: 'status', type: 'varchar', default: FriendRequestStatus.PENDING })
  status: FriendRequestStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friend_id' })
  friend: UserEntity;
}
