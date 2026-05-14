import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: jest.Mocked<Partial<EquipmentService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        {
          provide: EquipmentService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
    service = module.get(EquipmentService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should call equipmentService.findAll with userId', async () => {
      // Arrange
      const userId = 1;
      const expected = [{ id: 1, name: 'Barbell' }];
      service.findAll.mockResolvedValue(expected as any);

      // Act
      const result = await controller.findAll(userId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('create', () => {
    it('should call equipmentService.create with userId and dto', async () => {
      // Arrange
      const userId = 1;
      const dto = { name: 'New Band' };
      const expected = { id: 5, name: 'New Band', userId: 1 };
      service.create.mockResolvedValue(expected as any);

      // Act
      const result = await controller.create(userId, dto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should call equipmentService.update with id, userId, and dto', async () => {
      // Arrange
      const userId = 1;
      const equipmentId = 3;
      const dto = { name: 'Updated Band' };
      const expected = { id: 3, name: 'Updated Band' };
      service.update.mockResolvedValue(expected as any);

      // Act
      const result = await controller.update(userId, equipmentId, dto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(equipmentId, userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should call equipmentService.remove with id and userId', async () => {
      // Arrange
      const userId = 1;
      const equipmentId = 3;
      const expected = { message: 'Equipment deleted successfully' };
      service.remove.mockResolvedValue(expected);

      // Act
      const result = await controller.remove(userId, equipmentId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(equipmentId, userId);
      expect(result).toEqual(expected);
    });
  });
});
