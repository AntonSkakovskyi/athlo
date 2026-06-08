import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExerciseMuscleDto {
  @ApiProperty({ description: 'Muscle ID', example: 1 })
  @IsInt()
  muscleId: number;

  @ApiPropertyOptional({
    description: 'Whether this is a primary muscle',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = true;

  @ApiPropertyOptional({
    description: 'Impact percentage (1-100)',
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  impactPercentage?: number = 100;
}

export class CreateExerciseDto {
  @ApiProperty({ description: 'Exercise name', example: 'Custom Bicep Curl' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Exercise description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Equipment ID' })
  @IsOptional()
  @IsInt()
  equipmentId?: number;

  @ApiProperty({ description: 'Tracking type ID', example: 1 })
  @IsInt()
  trackingTypeId: number;

  @ApiPropertyOptional({
    description: 'Muscles targeted by this exercise',
    type: [ExerciseMuscleDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseMuscleDto)
  muscles?: ExerciseMuscleDto[];
}
