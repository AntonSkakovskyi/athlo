import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePlanMealItemDto {
  @IsOptional()
  @IsInt()
  foodId?: number;

  @IsOptional()
  @IsInt()
  unitId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}
