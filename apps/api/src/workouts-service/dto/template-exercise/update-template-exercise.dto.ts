import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateTemplateExerciseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restTime?: number;
}
