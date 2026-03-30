import { Controller, Get, UseGuards } from '@nestjs/common';
import { MealTypeService } from './meal-type.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Meal Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meal-types')
export class MealTypeController {
  constructor(private readonly mealTypeService: MealTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all meal types' })
  @ApiResponse({ status: 200, description: 'List of meal types' })
  findAll() {
    return this.mealTypeService.findAll();
  }
}
