import { Controller, Get, UseGuards } from '@nestjs/common';
import { MuscleService } from './muscle.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Muscles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('muscles')
export class MuscleController {
  constructor(private readonly muscleService: MuscleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all muscles' })
  @ApiResponse({ status: 200, description: 'List of muscles' })
  findAll() {
    return this.muscleService.findAll();
  }
}
