import {
  IsOptional,
  IsNumber,
  IsInt,
  IsString,
  IsEnum,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VisibilityType } from '@athlo/shared';
import type {
  ICompleteWorkoutRequest,
  IFinalizedExercise,
  IFinalizedSet,
} from '@athlo/shared';

export class FinalizedSetDto implements IFinalizedSet {
  @IsInt()
  @Min(1)
  order!: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsInt()
  reps?: number;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsNumber()
  distance?: number;
}

export class FinalizedExerciseDto implements IFinalizedExercise {
  @IsInt()
  logExerciseId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinalizedSetDto)
  sets!: FinalizedSetDto[];
}

export class CompleteWorkoutDto implements ICompleteWorkoutRequest {
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
  @IsEnum(VisibilityType)
  visibility?: VisibilityType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinalizedExerciseDto)
  finalizedExercises?: FinalizedExerciseDto[];
}
