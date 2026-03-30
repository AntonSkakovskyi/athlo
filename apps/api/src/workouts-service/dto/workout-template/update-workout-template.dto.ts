import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateWorkoutTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  visibilityTypeId?: number;
}
