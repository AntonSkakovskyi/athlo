import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateMealPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  visibilityTypeId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalDays?: number;
}
