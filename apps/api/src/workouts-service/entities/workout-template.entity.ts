import type { IWorkoutTemplate } from '@athlo/shared';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../user-service/user/entities/user.entity';
import { TemplateExerciseEntity } from './template-exercise.entity';

@Entity({ name: 'workout_templates' })
export class WorkoutTemplateEntity implements IWorkoutTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;

  @Column({ name: 'visibility_type_id', default: 1 })
  visibilityTypeId: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => TemplateExerciseEntity, (te) => te.workoutTemplate, { cascade: true })
  templateExercises: TemplateExerciseEntity[];
}
