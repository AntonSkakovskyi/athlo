import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateMealPlanDto {
  @ApiProperty({
    description: 'The day of the plan to start from',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  startDay?: number;
}
