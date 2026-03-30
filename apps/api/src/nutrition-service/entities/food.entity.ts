import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { IFood } from '@athlo/shared';

@Entity({ name: 'foods' })
export class FoodEntity implements IFood {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  calories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  proteins: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carbs: number;
}
