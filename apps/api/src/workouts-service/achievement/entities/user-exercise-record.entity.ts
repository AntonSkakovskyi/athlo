import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import type { IUserExerciseRecord } from '@athlo/shared';
import { UserEntity } from '../../../user-service/user/entities/user.entity';
import { ExerciseEntity } from '../../../exercise-catalog/entities/exercise.entity';
import { LogSetEntity } from '../../entities/log-set.entity';
import { ColumnNumericTransformer } from '../../entities/utils/column-numeric-transformer';

@Entity({ name: 'user_exercise_records' })
export class UserExerciseRecordEntity implements IUserExerciseRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'exercise_id' })
  exerciseId: number;

  @Column({ name: 'log_set_id', nullable: true })
  logSetId: number | null;

  @Column({ name: 'metric_type', type: 'varchar', length: 50 })
  metricType: string;

  @Column({
    name: 'value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  value: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => ExerciseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: ExerciseEntity;

  @ManyToOne(() => LogSetEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'log_set_id' })
  logSet: LogSetEntity;
}
