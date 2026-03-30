import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { ITrackingType } from '@athlo/shared';

@Entity({ name: 'tracking_types' })
export class TrackingTypeEntity implements ITrackingType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
