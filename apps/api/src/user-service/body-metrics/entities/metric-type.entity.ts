import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { IMetricType } from '@athlo/shared';
import { UnitEntity } from './unit.entity';

@Entity({ name: 'metric_types' })
export class MetricTypeEntity implements IMetricType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'unit_id'})
  unitId: number;

  @Column()
  name: string;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;
}
