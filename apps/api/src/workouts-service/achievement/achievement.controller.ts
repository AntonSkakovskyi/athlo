import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Achievements')
@ApiBearerAuth()
@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get()
  @ApiOperation({ summary: 'Get all achievement definitions' })
  @ApiResponse({ status: 200, description: 'List of all achievements' })
  getAll() {
    return this.achievementService.getAll();
  }

  @Get('user')
  @ApiOperation({ summary: 'Get current user unlocked achievements' })
  @ApiResponse({ status: 200, description: 'List of unlocked achievements' })
  getUserAchievements(@CurrentUser('id') userId: number) {
    return this.achievementService.getUserAchievements(userId);
  }

  @Get('records')
  @ApiOperation({ summary: 'Get all personal records for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of exercise personal records',
  })
  getUserExerciseRecords(@CurrentUser('id') userId: number) {
    return this.achievementService.getUserExerciseRecords(userId);
  }

  @Get('records/:exerciseId')
  @ApiOperation({ summary: 'Get personal record for a specific exercise' })
  @ApiResponse({ status: 200, description: 'Exercise personal record or null' })
  getExerciseRecord(
    @CurrentUser('id') userId: number,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
  ) {
    return this.achievementService.getExerciseRecord(userId, exerciseId);
  }
}
