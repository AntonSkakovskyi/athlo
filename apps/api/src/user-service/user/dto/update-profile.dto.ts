import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Gender, ActivityLevel, FitnessGoal } from '@athlo/shared';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nickname?: string;

  // Base64 data URI of the avatar image, or null to remove it.
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  avatar?: string | null;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsInt()
  age?: number;

  @IsOptional()
  @IsInt()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @IsOptional()
  @IsEnum(FitnessGoal)
  fitnessGoal?: FitnessGoal;

  @IsOptional()
  @IsInt()
  waterGoal?: number | null;

  @IsOptional()
  @IsInt()
  proteinGoal?: number | null;

  @IsOptional()
  @IsInt()
  fatGoal?: number | null;

  @IsOptional()
  @IsInt()
  carbGoal?: number | null;
}
