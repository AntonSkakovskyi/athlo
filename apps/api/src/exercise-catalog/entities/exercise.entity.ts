import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import type { IExercise } from '@athlo/shared';
import { EquipmentEntity } from './equipment.entity';
import { TrackingTypeEntity } from './tracking-type.entity';
import { ExerciseMuscleEntity } from './exercise-muscle.entity';
import { VisibilityTypeEntity } from './visibility-type.entity';
import { UserEntity } from '../../user-service/user/entities/user.entity';

@Entity({ name: 'exercises' })
export class ExerciseEntity implements IExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'equipment_id', type: 'int', nullable: true })
  equipmentId: number | null;

  @Column({ name: 'tracking_type_id', type: 'int', nullable: true })
  trackingTypeId: number | null;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ name: 'visibility_type_id', type: 'int', default: 1 })
  visibilityTypeId: number;

  @Column({ name: 'image_url', type: 'varchar', length: 512, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'gif_url', type: 'varchar', length: 512, nullable: true })
  gifUrl: string | null;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @ManyToOne(() => EquipmentEntity)
  @JoinColumn({ name: 'equipment_id' })
  equipment: EquipmentEntity;

  @ManyToOne(() => TrackingTypeEntity)
  @JoinColumn({ name: 'tracking_type_id' })
  trackingType: TrackingTypeEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => VisibilityTypeEntity)
  @JoinColumn({ name: 'visibility_type_id' })
  visibilityType: VisibilityTypeEntity;

  @OneToMany(() => ExerciseMuscleEntity, (em) => em.exercise)
  exerciseMuscles: ExerciseMuscleEntity[];
}
