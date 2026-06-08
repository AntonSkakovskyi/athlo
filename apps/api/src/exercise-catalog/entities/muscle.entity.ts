import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { IMuscle } from '@athlo/shared';

@Entity({ name: 'muscles' })
export class MuscleEntity implements IMuscle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'name_en', type: 'varchar', length: 255, nullable: true })
  nameEn: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 512, nullable: true })
  imageUrl: string | null;

  @Column({
    name: 'image_url_secondary',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  imageUrlSecondary: string | null;
}
