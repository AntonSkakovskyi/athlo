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

  @Column({ name: 'image_url', type: 'varchar', length: 512, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  barcode: string | null;

  @Column({ name: 'serving_size_g', type: 'decimal', precision: 10, scale: 2, nullable: true })
  servingSizeG: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  fiber: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  sugar: number | null;

  @Column({ name: 'sodium_mg', type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  sodiumMg: number | null;

  @OneToMany(() => FoodUnitEntity, (unit) => unit.food, { cascade: true })
  units: FoodUnitEntity[];
}
