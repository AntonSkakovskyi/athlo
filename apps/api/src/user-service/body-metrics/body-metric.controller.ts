import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BodyMetricService } from './body-metric.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/user-service/auth/decorators/current-user.decorator';
import { CreateBodyMetricDto } from './dto/create-body-metric.dto';
import { UpdateBodyMetricDto } from './dto/update-body-metric.dto';

@UseGuards(JwtAuthGuard)
@Controller('body-metrics')
export class BodyMetricController {
  constructor(private readonly bodyMetricService: BodyMetricService) {}

  @Get('metric-types')
  getMetricTypes() {
    return this.bodyMetricService.getMetricTypes();
  }

  @Post()
  create(@CurrentUser('id') userId: number, @Body() dto: CreateBodyMetricDto) {
    return this.bodyMetricService.create(userId, dto);
  }

  @Get()
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
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.bodyMetricService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id',  ) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateBodyMetricDto,
  ) {
    return this.bodyMetricService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.bodyMetricService.remove(id, userId);
  }
}
