import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { IAchievement } from '@athlo/shared';
import { AchievementType, TrackingMetric } from '@athlo/shared';
import { ExerciseEntity } from '../../../exercise-catalog/entities/exercise.entity';
import { TrackingMetricEntity } from '../../../exercise-catalog/entities/tracking-metric.entity';

@Entity({ name: 'achievements' })
export class AchievementEntity implements IAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  type: AchievementType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  threshold: number;

  @Column({ name: 'exercise_id', type: 'int', nullable: true })
  exerciseId: number | null;

  @Column({ name: 'tracking_metric_id', type: 'int', nullable: true })
  trackingMetricId: number | null;

  @ManyToOne(() => ExerciseEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: ExerciseEntity;

  @ManyToOne(() => TrackingMetricEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'tracking_metric_id' })
  trackingMetricRelation: TrackingMetricEntity | null;

  // Resolved via join — satisfies IAchievement.trackingMetric
  get trackingMetric(): TrackingMetric | null {
    return (this.trackingMetricRelation?.name as TrackingMetric) ?? null;
  }
}
