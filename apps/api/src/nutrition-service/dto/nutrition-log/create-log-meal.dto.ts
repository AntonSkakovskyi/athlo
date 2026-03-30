import { IsOptional, IsInt, IsString } from 'class-validator';

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
}
