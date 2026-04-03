import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import type { IBodyMetric } from '@athlo/shared';
import { UserEntity } from '../../user/entities/user.entity';
import { MetricTypeEntity } from './metric-type.entity';

@Entity({ name: 'body_metrics' })
export class BodyMetricEntity implements IBodyMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'metric_type_id' })
  metricTypeId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => MetricTypeEntity)
  @JoinColumn({ name: 'metric_type_id' })
  metricType: MetricTypeEntity;
}
