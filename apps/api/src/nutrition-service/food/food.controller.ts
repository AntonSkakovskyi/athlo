import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../../user-service/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import { CreateFoodDto } from '../dto/food/create-food.dto';
import { UpdateFoodDto } from '../dto/food/update-food.dto';
import { AddNutritionFactDto } from '../dto/food/add-nutrition-fact.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Foods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post()
  @ApiOperation({ summary: 'Create a food item' })
  @ApiResponse({ status: 201, description: 'Food created' })
  create(@Body() dto: CreateFoodDto, @CurrentUser('id') userId: number) {
    return this.foodService.create({ ...dto, creatorId: userId });
  }

  @Get()
  @ApiOperation({ summary: 'Search or list all foods' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search foods by name',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of foods' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.foodService.findAll(
      search,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a food item by ID' })
  @ApiResponse({ status: 200, description: 'Food data' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a food item' })
  @ApiResponse({ status: 200, description: 'Food updated' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFoodDto) {
    return this.foodService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a food item' })
  @ApiResponse({ status: 200, description: 'Food deleted' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.foodService.remove(id, userId);
  }

  @Post(':id/units')
  @ApiOperation({ summary: 'Add a nutrition fact (unit) to a food item' })
  @ApiResponse({ status: 201, description: 'Nutrition fact added' })
  addUnit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: AddNutritionFactDto,
  ) {
    return this.foodService.addNutritionFact(id, userId, dto);
  }

  @Delete(':id/units/:unitId')
  @ApiOperation({ summary: 'Delete a nutrition fact (unit) from a food item' })
  @ApiResponse({ status: 200, description: 'Nutrition fact deleted' })
  @ApiResponse({ status: 404, description: 'Nutrition fact not found' })
  removeUnit(
    @Param('id', ParseIntPipe) id: number,
    @Param('unitId', ParseIntPipe) unitId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.foodService.removeNutritionFact(id, unitId, userId);
  }
}
