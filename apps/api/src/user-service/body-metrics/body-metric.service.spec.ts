import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BodyMetricService } from './body-metric.service';
import { BodyMetricEntity } from './entities/body-metric.entity';
import { MetricTypeEntity } from './entities/metric-type.entity';
import { UnitEntity } from './entities/unit.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('BodyMetricService', () => {
  let service: BodyMetricService;
  let bodyMetricRepo: ReturnType<typeof createMockRepository>;
  let metricTypeRepo: ReturnType<typeof createMockRepository>;
  let unitRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BodyMetricService,
        {
          provide: getRepositoryToken(BodyMetricEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(MetricTypeEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UnitEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<BodyMetricService>(BodyMetricService);
    bodyMetricRepo = module.get(getRepositoryToken(BodyMetricEntity));
    metricTypeRepo = module.get(getRepositoryToken(MetricTypeEntity));
    unitRepo = module.get(getRepositoryToken(UnitEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('getMetricTypes', () => {
    it('should return all metric types with units', async () => {
      // Arrange
      const mockTypes = [
        { id: 1, name: 'Weight', unitId: 1, unit: { id: 1, name: 'kg' } },
      ];
      metricTypeRepo.find.mockResolvedValue(mockTypes);

      // Act
      const result = await service.getMetricTypes();

      // Assert
      expect(metricTypeRepo.find).toHaveBeenCalledWith({ relations: ['unit'] });
      expect(result).toEqual(mockTypes);
    });
  });

  describe('getUnits', () => {
    it('should return all units', async () => {
      const mockUnits = [{ id: 1, name: 'kg' }, { id: 2, name: 'lb' }];
      unitRepo.find.mockResolvedValue(mockUnits);

      const result = await service.getUnits();

      expect(unitRepo.find).toHaveBeenCalled();
      expect(result).toEqual(mockUnits);
    });
  });

  describe('create', () => {
    it('should create and save a body metric entry', async () => {
      // Arrange
      const userId = 1;
      const dto = { metricTypeId: 1, value: 75.5 };
      const mockMetric = { id: 1, userId, ...dto };
      bodyMetricRepo.create.mockReturnValue(mockMetric);
      bodyMetricRepo.save.mockResolvedValue(mockMetric);

      // Act
      const result = await service.create(userId, dto);

      // Assert
      expect(bodyMetricRepo.create).toHaveBeenCalledWith({
        userId,
        metricTypeId: dto.metricTypeId,
        value: dto.value,
      });
      expect(bodyMetricRepo.save).toHaveBeenCalledWith(mockMetric);
      expect(result).toEqual(mockMetric);
    });

    it('should include recordedAt when provided', async () => {
      // Arrange
      const userId = 1;
      const recordedAt = new Date('2025-01-15');
      const dto = { metricTypeId: 1, value: 80, recordedAt };
      const mockMetric = { id: 1, userId, ...dto };
      bodyMetricRepo.create.mockReturnValue(mockMetric);
      bodyMetricRepo.save.mockResolvedValue(mockMetric);

      // Act
      await service.create(userId, dto);

      // Assert
      expect(bodyMetricRepo.create).toHaveBeenCalledWith({
        userId,
        metricTypeId: dto.metricTypeId,
        value: dto.value,
        recordedAt,
      });
    });
  });

  describe('findAllByUser', () => {
    it('should return all body metrics for a user', async () => {
      // Arrange
      const mockMetrics = [{ id: 1, userId: 1, value: 75 }];
      bodyMetricRepo.find.mockResolvedValue(mockMetrics);

      // Act
      const result = await service.findAllByUser(1);

      // Assert
      expect(bodyMetricRepo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: { metricType: { unit: true } },
        order: { recordedAt: 'DESC' },
      });
      expect(result).toEqual(mockMetrics);
    });

    it('should filter by metricTypeId when provided', async () => {
      // Arrange
      bodyMetricRepo.find.mockResolvedValue([]);

      // Act
      await service.findAllByUser(1, 2);

      // Assert
      expect(bodyMetricRepo.find).toHaveBeenCalledWith({
        where: { userId: 1, metricTypeId: 2 },
        relations: { metricType: { unit: true } },
        order: { recordedAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a body metric when it exists and belongs to the user', async () => {
      // Arrange
      const mockMetric = { id: 1, userId: 1, value: 75 };
      bodyMetricRepo.findOne.mockResolvedValue(mockMetric);

      // Act
      const result = await service.findOne(1, 1);

      // Assert
      expect(result).toEqual(mockMetric);
    });

    it('should throw NotFoundException when metric does not exist', async () => {
      // Arrange
      bodyMetricRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when metric belongs to another user', async () => {
      // Arrange
      bodyMetricRepo.findOne.mockResolvedValue({ id: 1, userId: 2, value: 75 });

      // Act & Assert
      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update metric and save', async () => {
      // Arrange
      const existingMetric = { id: 1, userId: 1, value: 75, metricTypeId: 1 };
      bodyMetricRepo.findOne.mockResolvedValue(existingMetric);
      bodyMetricRepo.save.mockResolvedValue({ ...existingMetric, value: 80 });

      // Act
      const result = await service.update(1, 1, { value: 80 });

      // Assert
      expect(bodyMetricRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when metric does not exist', async () => {
      // Arrange
      bodyMetricRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, 1, { value: 80 })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when metric belongs to another user', async () => {
      // Arrange
      bodyMetricRepo.findOne.mockResolvedValue({ id: 1, userId: 2, value: 75 });

      // Act & Assert
      await expect(service.update(1, 1, { value: 80 })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove body metric', async () => {
      // Arrange
      const metric = { id: 1, userId: 1, value: 75 };
      bodyMetricRepo.findOne.mockResolvedValue(metric);
      bodyMetricRepo.remove.mockResolvedValue(metric);

      // Act
      await service.remove(1, 1);

      // Assert
      expect(bodyMetricRepo.remove).toHaveBeenCalledWith(metric);
    });

    it('should throw NotFoundException when metric does not exist', async () => {
      // Arrange
      bodyMetricRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when metric belongs to another user', async () => {
      // Arrange
      bodyMetricRepo.findOne.mockResolvedValue({ id: 1, userId: 2, value: 75 });

      // Act & Assert
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
