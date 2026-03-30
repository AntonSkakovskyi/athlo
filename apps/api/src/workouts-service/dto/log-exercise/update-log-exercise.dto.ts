import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLogExerciseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  restTime?: number;
}
