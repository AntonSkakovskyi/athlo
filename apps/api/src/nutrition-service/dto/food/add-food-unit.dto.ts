import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFoodUnitDto {
  @ApiProperty({ example: 3, description: 'ID of the unit (e.g., pcs, cup)' })
  @IsNumber()
  unitId: number;

  @ApiProperty({ example: 250, description: 'How many grams/ml are in 1 unit' })
  @IsNumber()
  @Min(0)
  conversionFactor: number;
}
