import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentEntity } from '../entities/equipment.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('EquipmentService', () => {
  let service: EquipmentService;
  let equipmentRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: getRepositoryToken(EquipmentEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
    equipmentRepo = module.get(getRepositoryToken(EquipmentEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all public equipment when no userId is provided', async () => {
      // Arrange
      const mockEquipment = [{ id: 1, name: 'Barbell', userId: null }];
      equipmentRepo.find.mockResolvedValue(mockEquipment);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockEquipment);
      expect(equipmentRepo.find).toHaveBeenCalled();
    });

    it('should return public and user equipment when userId is provided', async () => {
      // Arrange
      const mockEquipment = [
        { id: 1, name: 'Barbell', userId: null },
        { id: 2, name: 'My Band', userId: 1 },
      ];
      equipmentRepo.find.mockResolvedValue(mockEquipment);

      // Act
      const result = await service.findAll(1);

      // Assert
      expect(result).toEqual(mockEquipment);
      expect(equipmentRepo.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create and save new equipment for the user', async () => {
      // Arrange
      const dto = { name: 'Custom Band' };
      const userId = 1;
      const mockEquipment = { id: 5, name: dto.name, userId };

      equipmentRepo.create.mockReturnValue(mockEquipment);
      equipmentRepo.save.mockResolvedValue(mockEquipment);

      // Act
      const result = await service.create(userId, dto);

      // Assert
      expect(equipmentRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        userId,
      });
      expect(equipmentRepo.save).toHaveBeenCalledWith(mockEquipment);
      expect(result).toEqual(mockEquipment);
    });
  });

  describe('update', () => {
    it('should update equipment name and save', async () => {
      // Arrange
      const existing = { id: 1, name: 'Old Name', userId: 1 };
      equipmentRepo.findOne.mockResolvedValue(existing);
      equipmentRepo.save.mockResolvedValue({ ...existing, name: 'New Name' });

      // Act
      const result = await service.update(1, 1, { name: 'New Name' });

      // Assert
      expect(equipmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      // Arrange
      equipmentRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, 1, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when equipment belongs to another user', async () => {
      // Arrange
      equipmentRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Band',
        userId: 2,
      });

      // Act & Assert
      await expect(service.update(1, 1, { name: 'X' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should remove equipment and return success message', async () => {
      // Arrange
      const equipment = { id: 1, name: 'Band', userId: 1 };
      equipmentRepo.findOne.mockResolvedValue(equipment);
      equipmentRepo.remove.mockResolvedValue(equipment);

      // Act
      const result = await service.remove(1, 1);

      // Assert
      expect(equipmentRepo.remove).toHaveBeenCalledWith(equipment);
      expect(result).toEqual({ message: 'Equipment deleted successfully' });
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      // Arrange
      equipmentRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when equipment belongs to another user', async () => {
      // Arrange
      equipmentRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Band',
        userId: 2,
      });

      // Act & Assert
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
