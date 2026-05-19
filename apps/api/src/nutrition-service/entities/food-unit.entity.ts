import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { IFoodUnit } from '@athlo/shared';
import { FoodEntity } from './food.entity';
import { UnitEntity } from '../../user-service/body-metrics/entities/unit.entity';

@Entity({ name: 'food_units' })
export class FoodUnitEntity implements IFoodUnit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'food_id' })
  foodId: number;

  @Column({ name: 'unit_id' })
  unitId: number;

  @Column({ name: 'conversion_factor', type: 'decimal', precision: 10, scale: 2 })
  conversionFactor: number;

  @ManyToOne(() => FoodEntity, (food) => food.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'food_id' })
  food: FoodEntity;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;
}
