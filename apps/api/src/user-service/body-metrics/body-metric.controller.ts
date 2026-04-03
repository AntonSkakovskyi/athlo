import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BodyMetricService } from './body-metric.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateBodyMetricDto } from './dto/create-body-metric.dto';
import { UpdateBodyMetricDto } from './dto/update-body-metric.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Body Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('body-metrics')
export class BodyMetricController {
  constructor(private readonly bodyMetricService: BodyMetricService) {}

  @Get('metric-types')
  @ApiOperation({ summary: 'Get all available metric types' })
  @ApiResponse({ status: 200, description: 'List of metric types' })
  getMetricTypes() {
    return this.bodyMetricService.getMetricTypes();
  }

  @Post()
  @ApiOperation({ summary: 'Create a body metric entry' })
  @ApiResponse({ status: 201, description: 'Body metric created' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateBodyMetricDto) {
    return this.bodyMetricService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all body metrics for current user' })
  @ApiQuery({ name: 'metricTypeId', required: false, description: 'Filter by metric type ID' })
  @ApiResponse({ status: 200, description: 'List of body metrics' })
  findAll(
    @CurrentUser('id') userId: number,
    @Query('metricTypeId') metricTypeId?: string,
  ) {
    return this.bodyMetricService.findAllByUser(
      userId,
      metricTypeId ? parseInt(metricTypeId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific body metric entry' })
  @ApiResponse({ status: 200, description: 'Body metric data' })
  @ApiResponse({ status: 404, description: 'Body metric not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.bodyMetricService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a body metric entry' })
  @ApiResponse({ status: 200, description: 'Body metric updated' })
  @ApiResponse({ status: 404, description: 'Body metric not found' })
  update(
    @Param('id',  ) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateBodyMetricDto,
  ) {
    return this.bodyMetricService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a body metric entry' })
  @ApiResponse({ status: 200, description: 'Body metric deleted' })
  @ApiResponse({ status: 404, description: 'Body metric not found' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.bodyMetricService.remove(id, userId);
  }
}
