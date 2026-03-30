import type { ITemplateSet } from '@athlo/shared';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TemplateExerciseEntity } from './template-exercise.entity';

@Entity({ name: 'template_sets' })
export class TemplateSetEntity implements ITemplateSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'template_exercise_id' })
  templateExerciseId: number;

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

  @ManyToOne(() => TemplateExerciseEntity, (te) => te.templateSets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_exercise_id' })
  templateExercise: TemplateExerciseEntity;
}
