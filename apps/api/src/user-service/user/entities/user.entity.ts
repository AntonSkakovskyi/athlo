import { IUser } from "@athlo/shared";
import { WorkoutEntity } from "../../../workouts-service/entities/workout.entity";
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserSettingEntity } from "./user-setting.entity";

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

  @Column({ name: 'password_hash' })
  password_hash: string;

  @OneToMany(() => WorkoutEntity, workout => workout.user)
  workouts: WorkoutEntity[];

  @OneToOne(() => UserSettingEntity, setting => setting.user)
  settings: UserSettingEntity;
}
