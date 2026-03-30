import { IsInt, IsNumber, Min } from 'class-validator';

export class CreatePlanMealItemDto {
  @IsInt()
  foodId: number;

  @IsInt()
  unitId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
