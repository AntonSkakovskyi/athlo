import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { IMealType } from '@athlo/shared';

@Entity({ name: 'meal_types' })
export class MealTypeEntity implements IMealType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
