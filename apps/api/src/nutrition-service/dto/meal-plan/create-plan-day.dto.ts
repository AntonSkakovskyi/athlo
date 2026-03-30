import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDayDto {
  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
