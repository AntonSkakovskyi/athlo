import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateLogMealItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  unitId?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsNumber()
  @IsOptional()
  calculatedWeightG?: number;
}
