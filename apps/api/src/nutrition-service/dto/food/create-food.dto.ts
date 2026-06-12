import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AddNutritionFactDto } from './add-nutrition-fact.dto';

export class CreateFoodDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsNumber()
  creatorId?: number;

  @ApiProperty({ type: [AddNutritionFactDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddNutritionFactDto)
  units?: AddNutritionFactDto[];
}
