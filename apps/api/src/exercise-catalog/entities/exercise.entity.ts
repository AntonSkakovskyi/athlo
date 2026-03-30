import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import type { IExercise } from '@athlo/shared';
import { EquipmentEntity } from './equipment.entity';
import { TrackingTypeEntity } from './tracking-type.entity';
import { ExerciseMuscleEntity } from './exercise-muscle.entity';

@Entity({ name: 'exercises' })
export class ExerciseEntity implements IExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'equipment_id', nullable: true })
  equipmentId: number | null;

  @Column({ name: 'tracking_type_id', nullable: true })
  trackingTypeId: number | null;

  @ManyToOne(() => EquipmentEntity)
  @JoinColumn({ name: 'equipment_id' })
  equipment: EquipmentEntity;

  @ManyToOne(() => TrackingTypeEntity)
  @JoinColumn({ name: 'tracking_type_id' })
  trackingType: TrackingTypeEntity;

  @OneToMany(() => ExerciseMuscleEntity, (em) => em.exercise)
  exerciseMuscles: ExerciseMuscleEntity[];
}
