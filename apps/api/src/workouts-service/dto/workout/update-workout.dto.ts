import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { VisibilityType } from '@athlo/shared';
import type { IUpdateWorkoutRequest } from '@athlo/shared';

export class UpdateWorkoutDto implements IUpdateWorkoutRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  avgHeartRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxHeartRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rpe?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  feelingScore?: number;

  @IsOptional()
  @IsString()
  ended_at?: string;

  @IsOptional()
  @IsEnum(VisibilityType)
  visibility?: VisibilityType;
}
