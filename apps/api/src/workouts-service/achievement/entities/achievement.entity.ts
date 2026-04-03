import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { IAchievement } from '@athlo/shared';
import { AchievementType, TrackingMetric } from '@athlo/shared';
import { ExerciseEntity } from '../../../exercise-catalog/entities/exercise.entity';

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

  @Column({ name: 'tracking_metric', type: 'varchar', length: 50, nullable: true })
  trackingMetric: TrackingMetric | null;

  @Column({ name: 'icon_url', type: 'varchar', length: 512, nullable: true })
  iconUrl: string | null;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => ExerciseEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: ExerciseEntity;
}
