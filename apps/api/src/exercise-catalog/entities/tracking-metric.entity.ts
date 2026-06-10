import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'tracking_metrics' })
export class TrackingMetricEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;
}
