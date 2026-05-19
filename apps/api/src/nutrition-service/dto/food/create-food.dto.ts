import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateFoodDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsNumber()
  @Min(0)
  calories: number;

  @IsNumber()
  @Min(0)
  proteins: number;

  @IsNumber()
  @Min(0)
  fats: number;

  @IsNumber()
  @Min(0)
  carbs: number;

  @IsOptional()
  @IsNumber()
  creatorId?: number;
}
