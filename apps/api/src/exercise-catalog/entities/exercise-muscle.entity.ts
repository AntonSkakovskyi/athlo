import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { IExerciseMuscle } from '@athlo/shared';
import { ExerciseEntity } from './exercise.entity';
import { MuscleEntity } from './muscle.entity';

@Entity({ name: 'exercise_muscles' })
export class ExerciseMuscleEntity implements IExerciseMuscle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'exercise_id' })
  exerciseId: number;

  @Column({ name: 'muscle_id' })
  muscleId: number;

  @Column({ name: 'impact_percentage', default: 100 })
  impactPercentage: number;

  @Column({ name: 'is_primary', default: true })
  isPrimary: boolean;

  @ManyToOne(() => ExerciseEntity, (exercise) => exercise.exerciseMuscles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: ExerciseEntity;

  @ManyToOne(() => MuscleEntity)
  @JoinColumn({ name: 'muscle_id' })
  muscle: MuscleEntity;
}
