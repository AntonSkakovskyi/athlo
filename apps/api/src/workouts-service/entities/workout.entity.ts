import { WorkoutStatus } from '@athlo/shared';
import type { IWorkout } from '@athlo/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../user-service/user/entities/user.entity';
import { LogExerciseEntity } from './log-exercise.entity';

@Entity({ name: 'workouts' })
export class WorkoutEntity implements IWorkout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.workouts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => LogExerciseEntity, (logExercise) => logExercise.workout, {
    cascade: true,
  })
  logExercises: LogExerciseEntity[];

  @Column({ name: 'visibility_type_id', default: 1 })
  visibilityTypeId: number;

  @Column({ name: 'name' })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: WorkoutStatus.IN_PROGRESS,
  })
  status: WorkoutStatus;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  started_at: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  ended_at: Date | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'calories',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0,
  })
  calories: number | null;

  @Column({ name: 'avg_heart_rate', type: 'int', nullable: true })
  avgHeartRate: number | null;

  @Column({ name: 'max_heart_rate', type: 'int', nullable: true })
  maxHeartRate: number | null;

  @Column({ name: 'rpe', type: 'int', nullable: true })
  rpe: number | null;

  @Column({ name: 'feeling_score', type: 'int', nullable: true })
  feelingScore: number | null;
}
