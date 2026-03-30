import { WorkoutStatus } from '@athlo/shared';
import type { IWorkout } from '@athlo/shared';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from 'src/user-service/user/entities/user.entity';

@Entity({ name: 'workouts' })
export class WorkoutEntity implements IWorkout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, user => user.workouts)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'visibility_type_id' })
  visibilityTypeId: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ 
    type: 'enum',
    enum: WorkoutStatus,
    default: WorkoutStatus.IN_PROGRESS
  })
  status: WorkoutStatus;

  @Column({ name: 'started_at' })
  started_at: string;

  @Column({ name: 'ended_at' })
  ended_at: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'feeling_score' })
  feelingScore: number;
}
