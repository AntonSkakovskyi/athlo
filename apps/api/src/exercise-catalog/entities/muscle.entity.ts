import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { IMuscle } from '@athlo/shared';

@Entity({ name: 'muscles' })
export class MuscleEntity implements IMuscle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string | null;
}
