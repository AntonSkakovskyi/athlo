import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateLogMealItemDto {
  @IsInt()
  foodId: number;

  @IsInt()
  unitId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  calculatedWeightG?: number;
}
