import { Controller, Get, UseGuards } from '@nestjs/common';
import { MealTypeService } from './meal-type.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('meal-types')
export class MealTypeController {
  constructor(private readonly mealTypeService: MealTypeService) {}

  @Get()
  findAll() {
    return this.mealTypeService.findAll();
  }
}
