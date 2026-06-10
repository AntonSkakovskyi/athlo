import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'friend_statuses' })
export class FriendStatusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;
}
