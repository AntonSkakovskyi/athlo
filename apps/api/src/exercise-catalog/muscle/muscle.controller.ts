import { Controller, Get, UseGuards } from '@nestjs/common';
import { MuscleService } from './muscle.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('muscles')
export class MuscleController {
  constructor(private readonly muscleService: MuscleService) {}

  @Get()
  findAll() {
    return this.muscleService.findAll();
  }
}
