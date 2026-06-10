import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  Query,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  getProfile(@CurrentUser('id') userId: number) {
    return this.userService.getProfile(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users (non-friends only, paginated)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  searchUsers(
    @CurrentUser('id') currentUserId: number,
    @Query('query') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.userService.searchUsers(query, currentUserId, limit, offset);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get another user public profile' })
  @ApiResponse({ status: 200, description: 'Public user profile data' })
  getOtherProfile(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getPublicProfile(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  updateProfile(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  deleteAccount(@CurrentUser('id') userId: number) {
    return this.userService.delete(userId);
  }
}
