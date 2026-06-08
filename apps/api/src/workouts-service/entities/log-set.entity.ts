import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { ILogSet } from '@athlo/shared';
import { LogExerciseEntity } from './log-exercise.entity';
import { ColumnNumericTransformer } from './utils/column-numeric-transformer';

@Entity({ name: 'log_sets' })
export class LogSetEntity implements ILogSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'log_exercise_id' })
  logExerciseId: number;

  @Column()
  order: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  weight: number | null;

  @Column({ nullable: true })
  reps: number | null;

  @Column({ nullable: true })
  duration: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  distance: number | null;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'is_pr', default: false })
  isPR: boolean;

  @Column({ name: 'achievement_id', nullable: true })
  achievementId: number | null;

  @ManyToOne(() => LogExerciseEntity, (logExercise) => logExercise.sets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'log_exercise_id' })
  logExercise: LogExerciseEntity;

  @ManyToOne('AchievementEntity', { nullable: true })
  @JoinColumn({ name: 'achievement_id' })
  achievement: any;
}
