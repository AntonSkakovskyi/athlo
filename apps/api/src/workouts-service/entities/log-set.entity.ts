import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { ILogSet } from '@athlo/shared';
import { LogExerciseEntity } from './log-exercise.entity';

@Entity({ name: 'log_sets' })
export class LogSetEntity implements ILogSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'log_exercise_id' })
  logExerciseId: number;

  @Column()
  order: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  weight: number;

  @Column({ default: 0 })
  reps: number;

  @Column({ default: 0 })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  distance: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @ManyToOne(() => LogExerciseEntity, (logExercise) => logExercise.sets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'log_exercise_id' })
  logExercise: LogExerciseEntity;
}
