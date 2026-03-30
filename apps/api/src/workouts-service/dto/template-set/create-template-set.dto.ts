import { IsInt, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateTemplateSetDto {
  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;
}
