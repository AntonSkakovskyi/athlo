import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchLastPerformanceDto {
  @ApiProperty({ description: 'Array of exercise IDs', example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  exerciseIds: number[];
}
