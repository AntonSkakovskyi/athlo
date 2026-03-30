import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateTemplateExerciseDto {
  @IsInt()
  exerciseId: number;

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restTime?: number;
}
