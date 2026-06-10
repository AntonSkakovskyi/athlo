import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';
import { CurrentUser } from '../../user-service/auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Equipment')
@ApiBearerAuth()
@Controller('equipments')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all equipment' })
  @ApiResponse({ status: 200, description: 'List of equipment' })
  findAll(@CurrentUser('id') userId: number) {
    return this.equipmentService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create user equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user equipment' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully' })
  @ApiResponse({ status: 403, description: 'Can only update own equipment' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user equipment' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Can only delete own equipment' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.equipmentService.remove(id, userId);
  }
}
