import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import type { ILogExercise } from '@athlo/shared';
import { WorkoutEntity } from './workout.entity';
import { ExerciseEntity } from '../../exercise-catalog/entities/exercise.entity';
import { LogSetEntity } from './log-set.entity';

@Entity({ name: 'log_exercises' })
export class LogExerciseEntity implements ILogExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'workout_id' })
  workoutId: number;

  @Column({ name: 'exercise_id' })
  exerciseId: number;

  @Column()
  order: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'rest_time', default: 0 })
  restTime: number;

  @ManyToOne(() => WorkoutEntity, (workout) => workout.logExercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_id' })
  workout: WorkoutEntity;

  @ManyToOne(() => ExerciseEntity)
  @JoinColumn({ name: 'exercise_id' })
  exercise: ExerciseEntity;

  @OneToMany(() => LogSetEntity, (set) => set.logExercise, { cascade: true })
  sets: LogSetEntity[];
}
