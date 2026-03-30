import { IsString, IsOptional } from 'class-validator';

export class CreateWorkoutDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
