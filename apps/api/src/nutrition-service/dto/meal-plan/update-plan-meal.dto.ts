import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePlanMealDto {
  @IsOptional()
  @IsInt()
  mealTypeId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  timeSuggestion?: string;
}
