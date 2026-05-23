import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { INutritionFact } from '@athlo/shared';
import { FoodEntity } from './food.entity';
import { UnitEntity } from '../../user-service/body-metrics/entities/unit.entity';

@Entity({ name: 'nutrition_facts' })
export class NutritionFactEntity implements INutritionFact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'food_id' })
  foodId: number;

  @Column({ name: 'unit_id' })
  unitId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  calories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  proteins: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carbs: number;

  @ManyToOne(() => FoodEntity, (food) => food.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'food_id' })
  food: FoodEntity;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;
}
