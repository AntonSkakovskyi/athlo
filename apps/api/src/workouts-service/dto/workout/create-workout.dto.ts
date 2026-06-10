import { IsString, IsOptional } from 'class-validator';
import type { ICreateWorkoutRequest } from '@athlo/shared';

export class CreateWorkoutDto implements ICreateWorkoutRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
