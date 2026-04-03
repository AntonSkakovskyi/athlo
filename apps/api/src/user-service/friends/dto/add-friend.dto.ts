import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendFriendRequestDto {
  @ApiProperty({ description: 'ID of the user to send a friend request to', example: 2 })
  @IsInt()
  friendId: number;
}
