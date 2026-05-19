import { IsOptional, IsInt, IsString, IsDateString } from 'class-validator';

export class CreateLogMealDto {
  @IsOptional()
  @IsInt()
  mealTypeId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  originalPlanMealId?: number;

  @IsOptional()
  @IsDateString()
  consumedAt?: string;

  @IsOptional()
  @IsDateString()
  dayLogDate?: string;
}
