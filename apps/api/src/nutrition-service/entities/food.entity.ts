import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { IFood } from '@athlo/shared';
import { FoodUnitEntity } from './food-unit.entity';

@Entity({ name: 'foods' })
export class FoodEntity implements IFood {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  brand: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  calories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  proteins: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carbs: number;

  @Column({ name: 'creator_id', type: 'int', nullable: true })
  creatorId: number | null;

  @OneToMany(() => FoodUnitEntity, (unit) => unit.food, { cascade: true })
  units: FoodUnitEntity[];
}
