import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn } from 'typeorm';
import type { IFood } from '@athlo/shared';
import { NutritionFactEntity } from './nutrition-fact.entity';

@Entity({ name: 'foods' })
export class FoodEntity implements IFood {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  brand: string | null;

  @Column({ name: 'creator_id', type: 'int', nullable: true })
  creatorId: number | null;

  @Column({ name: 'image_url', type: 'varchar', length: 512, nullable: true })
  imageUrl: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => NutritionFactEntity, (unit) => unit.food, { cascade: true })
  units: NutritionFactEntity[];
}
