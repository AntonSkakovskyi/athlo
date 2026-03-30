import { Controller, Delete, Get, Param, ParseIntPipe, Post, Body, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddFriendDto } from './dto/add-friend.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Friends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post()
  @ApiOperation({ summary: 'Add a friend' })
  @ApiResponse({ status: 201, description: 'Friend added successfully' })
  @ApiResponse({ status: 400, description: 'Cannot add yourself / Invalid data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Already friends' })
  addFriend(@CurrentUser('id') userId: number, @Body() dto: AddFriendDto) {
    return this.friendService.addFriend(userId, dto.friendId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all friends of the current user' })
  @ApiResponse({ status: 200, description: 'List of friends' })
  getFriends(@CurrentUser('id') userId: number) {
    return this.friendService.getFriends(userId);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Remove a friend' })
  @ApiResponse({ status: 200, description: 'Friend removed successfully' })
  @ApiResponse({ status: 404, description: 'Friendship not found' })
  removeFriend(
    @CurrentUser('id') userId: number,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    return this.friendService.removeFriend(userId, friendId);
  }
}
