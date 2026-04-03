import type { ITemplateExercise } from '@athlo/shared';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WorkoutTemplateEntity } from './workout-template.entity';
import { ExerciseEntity } from '../../exercise-catalog/entities/exercise.entity';
import { TemplateSetEntity } from './template-set.entity';

@Entity({ name: 'template_exercises' })
export class TemplateExerciseEntity implements ITemplateExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'workout_template_id' })
  workoutTemplateId: number;

  @Column({ name: 'exercise_id' })
  exerciseId: number;

  @Column()
  order: number;

  @Column({ name: 'rest_time', default: 60 })
  restTime: number;

  @ManyToOne(() => WorkoutTemplateEntity, (template) => template.templateExercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_template_id' })
  workoutTemplate: WorkoutTemplateEntity;

  @ManyToOne(() => ExerciseEntity)
  @JoinColumn({ name: 'exercise_id' })
  exercise: ExerciseEntity;

  @OneToMany(() => TemplateSetEntity, (set) => set.templateExercise, { cascade: true })
  templateSets: TemplateSetEntity[];
}
