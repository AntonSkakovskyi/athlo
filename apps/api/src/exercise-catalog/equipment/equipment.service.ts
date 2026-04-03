import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EquipmentEntity } from '../entities/equipment.entity';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(EquipmentEntity)
    private readonly equipmentRepository: Repository<EquipmentEntity>,
  ) {}

  findAll(userId?: number) {
    if (userId) {
      return this.equipmentRepository.find({
        where: [
          { userId: IsNull() },
          { userId },
        ],
        order: { name: 'ASC' },
      });
    }
    return this.equipmentRepository.find({
      where: { userId: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async create(userId: number, dto: CreateEquipmentDto) {
    const equipment = this.equipmentRepository.create({
      name: dto.name,
      userId,
    });
    return this.equipmentRepository.save(equipment);
  }

  async update(id: number, userId: number, dto: UpdateEquipmentDto) {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    if (equipment.userId !== userId) {
      throw new ForbiddenException('You can only update your own equipment');
    }

    if (dto.name !== undefined) equipment.name = dto.name;
    return this.equipmentRepository.save(equipment);
  }

  async remove(id: number, userId: number) {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    if (equipment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own equipment');
    }

    await this.equipmentRepository.remove(equipment);

    return { message: 'Equipment deleted successfully' };
  }
}
