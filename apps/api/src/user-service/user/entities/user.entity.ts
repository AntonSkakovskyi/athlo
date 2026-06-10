import { IUser, Gender, ActivityLevel, FitnessGoal } from '@athlo/shared';
import { WorkoutEntity } from '../../../workouts-service/entities/workout.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserSettingEntity } from './user-setting.entity';

@Entity({ name: 'users' })
export class UserEntity implements IUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'nickname' })
  nickname: string;

  // select: false — хеш ніколи не потрапляє у вибірки за замовчуванням;
  // для перевірки пароля читається явно через addSelect
  @Column({ name: 'password_hash', select: false })
  password_hash: string;

  @Column({ name: 'avatar', type: 'text', nullable: true })
  avatar: string | null;

  @Column({ name: 'gender', type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: string | null;

  @Column({ name: 'height', type: 'int', nullable: true })
  height?: number;

  @Column({ name: 'weight', type: 'float', nullable: true })
  weight?: number;

  @Column({
    name: 'activity_level',
    type: 'enum',
    enum: ActivityLevel,
    nullable: true,
  })
  activityLevel?: ActivityLevel;

  @Column({
    name: 'fitness_goal',
    type: 'enum',
    enum: FitnessGoal,
    nullable: true,
  })
  fitnessGoal?: FitnessGoal;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => WorkoutEntity, (workout) => workout.user)
  workouts: WorkoutEntity[];

  @OneToOne(() => UserSettingEntity, (setting) => setting.user)
  settings: UserSettingEntity;
}
