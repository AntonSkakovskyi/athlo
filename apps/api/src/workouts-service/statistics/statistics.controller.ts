import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('workouts')
  @ApiOperation({ summary: 'Get workout statistics for current user' })
  @ApiResponse({ status: 200, description: 'Workout statistics' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (YYYY-MM-DD)' })
  getWorkoutStatistics(
    @CurrentUser('id') userId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statisticsService.getWorkoutStatistics(userId, from, to);
  }

  @Get('exercises/:exerciseId')
  @ApiOperation({ summary: 'Get exercise progress over time' })
  @ApiResponse({ status: 200, description: 'Exercise progress data' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (YYYY-MM-DD)' })
  getExerciseProgress(
    @CurrentUser('id') userId: number,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statisticsService.getExerciseProgress(userId, exerciseId, from, to);
  }

  @Get('body-metrics/:metricTypeId')
  @ApiOperation({ summary: 'Get body metric progress over time' })
  @ApiResponse({ status: 200, description: 'Body metric progress data' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (YYYY-MM-DD)' })
  getBodyMetricProgress(
    @CurrentUser('id') userId: number,
    @Param('metricTypeId', ParseIntPipe) metricTypeId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statisticsService.getBodyMetricProgress(userId, metricTypeId, from, to);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get general statistics summary for profile' })
  @ApiResponse({ status: 200, description: 'Statistics summary' })
  getSummary(@CurrentUser('id') userId: number) {
    return this.statisticsService.getSummary(userId);
  }
}
