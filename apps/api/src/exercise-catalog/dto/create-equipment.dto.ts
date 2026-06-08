import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEquipmentDto {
  @ApiProperty({
    description: 'Equipment name',
    example: 'Custom Resistance Band',
  })
  @IsString()
  name: string;
}
