import type { ITemplateSet } from '@athlo/shared';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TemplateExerciseEntity } from './template-exercise.entity';
import { ColumnNumericTransformer } from './utils/column-numeric-transformer';

@Entity({ name: 'template_sets' })
export class TemplateSetEntity implements ITemplateSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'template_exercise_id' })
  templateExerciseId: number;

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

  @Column({ type: 'int', nullable: true })
  reps: number | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  distance: number | null;

  @ManyToOne(() => TemplateExerciseEntity, (te) => te.templateSets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_exercise_id' })
  templateExercise: TemplateExerciseEntity;
}
