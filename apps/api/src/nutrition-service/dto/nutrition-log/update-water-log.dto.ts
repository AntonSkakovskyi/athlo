import { IsInt, IsISO8601, IsOptional, Min } from 'class-validator';

export class UpdateWaterLogDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  amountMl?: number;

  @IsOptional()
  @IsISO8601()
  consumedAt?: string;
}
