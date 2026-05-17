import { IsISO8601, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateLogMealDto {
  @IsOptional()
  @IsInt()
  mealTypeId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsISO8601()
  consumedAt?: string;
}
