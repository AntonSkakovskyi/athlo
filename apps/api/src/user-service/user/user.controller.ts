import { Controller, Get, Body, Patch, UseGuards, Query, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  searchUsers(
    @CurrentUser('id') currentUserId: number,
    @Query('query') query: string,
  ) {
    return this.userService.searchUsers(query, currentUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get another user profile' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  getOtherProfile(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getProfile(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  updateProfile(@CurrentUser('id') userId: number, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }
}
