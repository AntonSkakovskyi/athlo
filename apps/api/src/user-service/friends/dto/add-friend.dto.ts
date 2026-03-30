import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFriendDto {
  @ApiProperty({ description: 'ID of the user to add as friend', example: 2 })
  @IsInt()
  friendId: number;
}
