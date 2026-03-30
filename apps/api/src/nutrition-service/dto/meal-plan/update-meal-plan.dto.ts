import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateMealPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  visibilityTypeId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalDays?: number;
}
