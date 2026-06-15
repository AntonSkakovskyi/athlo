import { IsInt, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateLogSetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
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
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  distance?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
