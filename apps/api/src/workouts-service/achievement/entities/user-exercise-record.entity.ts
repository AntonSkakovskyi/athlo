import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, UpdateDateColumn } from 'typeorm';
import type { IUserExerciseRecord } from '@athlo/shared';
import { UserEntity } from '../../../user-service/user/entities/user.entity';
import { ExerciseEntity } from '../../../exercise-catalog/entities/exercise.entity';

@Entity({ name: 'user_exercise_records' })
@Unique(['userId', 'exerciseId'])
export class UserExerciseRecordEntity implements IUserExerciseRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'exercise_id' })
  exerciseId: number;

  @Column({ name: 'best_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  bestWeight: number | null;

  @Column({ name: 'best_reps', type: 'int', nullable: true })
  bestReps: number | null;

  @Column({ name: 'best_duration', type: 'int', nullable: true })
  bestDuration: number | null;

  @Column({ name: 'best_distance', type: 'decimal', precision: 10, scale: 2, nullable: true })
  bestDistance: number | null;

  @Column({ name: 'estimated_1rm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimated1rm: number | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => ExerciseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: ExerciseEntity;
}
