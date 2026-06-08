import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SendFriendRequestDto } from './dto/add-friend.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Friends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ status: 201, description: 'Friend request sent successfully' })
  @ApiResponse({ status: 400, description: 'Cannot send request to yourself' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'Request already exists or already friends',
  })
  sendRequest(
    @CurrentUser('id') userId: number,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.friendService.sendRequest(userId, dto.friendId);
  }

  @Patch('requests/:id/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted' })
  @ApiResponse({
    status: 400,
    description: 'Request is not pending or not yours to accept',
  })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  acceptRequest(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.friendService.acceptRequest(userId, requestId);
  }

  @Patch('requests/:id/reject')
  @ApiOperation({ summary: 'Reject a friend request' })
  @ApiResponse({ status: 200, description: 'Friend request rejected' })
  @ApiResponse({
    status: 400,
    description: 'Request is not pending or not yours to reject',
  })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  rejectRequest(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.friendService.rejectRequest(userId, requestId);
  }

  @Delete('requests/:id')
  @ApiOperation({ summary: 'Cancel a sent friend request' })
  @ApiResponse({ status: 200, description: 'Friend request cancelled' })
  @ApiResponse({
    status: 400,
    description: 'Request is not pending or not yours to cancel',
  })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  cancelRequest(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.friendService.cancelRequest(userId, requestId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all friends of the current user' })
  @ApiResponse({ status: 200, description: 'List of friends' })
  getFriends(@CurrentUser('id') userId: number) {
    return this.friendService.getFriends(userId);
  }

  @Get('requests/incoming')
  @ApiOperation({ summary: 'Get incoming friend requests' })
  @ApiResponse({ status: 200, description: 'List of incoming friend requests' })
  getIncomingRequests(@CurrentUser('id') userId: number) {
    return this.friendService.getIncomingRequests(userId);
  }

  @Get('requests/outgoing')
  @ApiOperation({ summary: 'Get outgoing friend requests' })
  @ApiResponse({ status: 200, description: 'List of outgoing friend requests' })
  getOutgoingRequests(@CurrentUser('id') userId: number) {
    return this.friendService.getOutgoingRequests(userId);
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
