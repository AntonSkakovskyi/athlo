import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { IExerciseCategory } from '@athlo/shared';

@Entity({ name: 'exercise_categories' })
export class ExerciseCategoryEntity implements IExerciseCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;
}
