import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddNutritionFactDto {
  @ApiProperty({ example: 3, description: 'ID of the unit (e.g., pcs, cup)' })
  @IsNumber()
  unitId: number;

  @ApiProperty({ example: 100, description: 'Base amount for these macros' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 120, description: 'Calories per unit' })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({ example: 5.5, description: 'Proteins per unit' })
  @IsNumber()
  @Min(0)
  proteins: number;

  @ApiProperty({ example: 2.0, description: 'Fats per unit' })
  @IsNumber()
  @Min(0)
  fats: number;

  @ApiProperty({ example: 15.0, description: 'Carbs per unit' })
  @IsNumber()
  @Min(0)
  carbs: number;
}
