import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import type { IWaterLog } from '@athlo/shared';
import { UserEntity } from '../../user-service/user/entities/user.entity';

@Entity({ name: 'water_logs' })
export class WaterLogEntity implements IWaterLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'amount_ml' })
  amountMl: number;

  @CreateDateColumn({ name: 'consumed_at', type: 'timestamptz' })
  consumedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
