import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TrackingTypeService } from './tracking-type.service';

@ApiTags('TrackingTypes')
@ApiBearerAuth()
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
