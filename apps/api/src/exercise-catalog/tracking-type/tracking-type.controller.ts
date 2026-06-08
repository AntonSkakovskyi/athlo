import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { TrackingTypeService } from './tracking-type.service';

@ApiTags('TrackingTypes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tracking-types')
export class TrackingTypeController {
  constructor(private readonly trackingTypeService: TrackingTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tracking types' })
  @ApiResponse({ status: 200, description: 'List of tracking types' })
  findAll() {
    return this.trackingTypeService.findAll();
  }
}
