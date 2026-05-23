import { Test, TestingModule } from '@nestjs/testing';
import { BodyMetricController } from './body-metric.controller';
import { BodyMetricService } from './body-metric.service';

describe('BodyMetricController', () => {
  let controller: BodyMetricController;
  let service: jest.Mocked<BodyMetricService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BodyMetricController],
      providers: [
        {
          provide: BodyMetricService,
          useValue: {
            getMetricTypes: jest.fn(),
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BodyMetricController>(BodyMetricController);
    service = module.get(BodyMetricService) as jest.Mocked<BodyMetricService>;
  });

  afterEach(() => jest.clearAllMocks());

  describe('getMetricTypes', () => {
    it('should call bodyMetricService.getMetricTypes', async () => {
      // Arrange
      const expected = [{ id: 1, name: 'Weight', unit: { id: 1, name: 'kg' } }];
      service.getMetricTypes.mockResolvedValue(expected as any);

      // Act
      const result = await controller.getMetricTypes();

      // Assert
      expect(service.getMetricTypes).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('create', () => {
    it('should call bodyMetricService.create with userId and dto', async () => {
      // Arrange
      const userId = 1;
      const dto = { metricTypeId: 1, value: 75.5 };
      const expected = { id: 1, userId, ...dto };
      service.create.mockResolvedValue(expected as any);

      // Act
      const result = await controller.create(userId, dto as any);

      // Assert
      expect(service.create).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should call bodyMetricService.findAllByUser with userId', async () => {
      // Arrange
      const userId = 1;
      const expected = [{ id: 1, value: 75 }];
      service.findAllByUser.mockResolvedValue(expected as any);

      // Act
      const result = await controller.findAll(userId);

      // Assert
      expect(service.findAllByUser).toHaveBeenCalledWith(userId, undefined);
      expect(result).toEqual(expected);
    });

    it('should pass parsed metricTypeId when provided', async () => {
      // Arrange
      const userId = 1;
      service.findAllByUser.mockResolvedValue([] as any);

      // Act
      await controller.findAll(userId, '2');

      // Assert
      expect(service.findAllByUser).toHaveBeenCalledWith(userId, 2);
    });
  });

  describe('findOne', () => {
    it('should call bodyMetricService.findOne with id and userId', async () => {
      // Arrange
      const userId = 1;
      const metricId = 5;
      const expected = { id: 5, value: 80, userId: 1 };
      service.findOne.mockResolvedValue(expected as any);

      // Act
      const result = await controller.findOne(metricId, userId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(metricId, userId);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should call bodyMetricService.update with id, userId, and dto', async () => {
      // Arrange
      const userId = 1;
      const metricId = 5;
      const dto = { value: 82 };
      const expected = { id: 5, value: 82 };
      service.update.mockResolvedValue(expected as any);

      // Act
      const result = await controller.update(metricId, userId, dto as any);

      // Assert
      expect(service.update).toHaveBeenCalledWith(metricId, userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should call bodyMetricService.remove with id and userId', async () => {
      // Arrange
      const userId = 1;
      const metricId = 5;
      service.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(metricId, userId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(metricId, userId);
    });
  });
});
