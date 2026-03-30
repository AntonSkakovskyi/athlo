import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FoodService } from './food.service';
import { JwtAuthGuard } from 'src/user-service/auth/guards/jwt-auth.guard';
import { CreateFoodDto } from '../dto/food/create-food.dto';
import { UpdateFoodDto } from '../dto/food/update-food.dto';

@UseGuards(JwtAuthGuard)
@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post()
  create(@Body() dto: CreateFoodDto) {
    return this.foodService.create(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.foodService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFoodDto) {
    return this.foodService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.remove(id);
  }
}
