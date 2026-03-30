import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { IEquipment } from '@athlo/shared';

@Entity({ name: 'equipments' })
export class EquipmentEntity implements IEquipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
