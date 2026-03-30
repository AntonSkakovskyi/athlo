import { IsInt, Min } from 'class-validator';

export class CreateWaterLogDto {
  @IsInt()
  @Min(1)
  amountMl: number;
}
