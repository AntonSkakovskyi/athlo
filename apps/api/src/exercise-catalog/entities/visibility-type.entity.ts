import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { IVisibilityType } from '@athlo/shared';

@Entity({ name: 'visibility_type' })
export class VisibilityTypeEntity implements IVisibilityType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
