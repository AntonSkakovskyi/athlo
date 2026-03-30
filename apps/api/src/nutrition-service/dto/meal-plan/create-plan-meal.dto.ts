import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanMealDto {
  @IsInt()
  mealTypeId: number;

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsString()
  timeSuggestion?: string;
}
