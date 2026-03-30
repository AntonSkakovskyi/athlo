import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBodyMetricDto {
  @IsInt()
  metricTypeId: number;

  @IsNumber()
  @Min(0.01)
  value: number;

  @IsOptional()
  @Type(() => Date)
  recordedAt?: Date;
}
