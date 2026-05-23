import { IsNumber, Min } from 'class-validator';

export class CreateLogMealItemDto {
  @IsNumber()
  foodId: number;

  @IsNumber()
  unitId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
