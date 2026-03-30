import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { IUnit } from '@athlo/shared';

@Entity({ name: 'units' })
export class UnitEntity implements IUnit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
