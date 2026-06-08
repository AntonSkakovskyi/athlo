import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';

describe('ExerciseController', () => {
  let controller: ExerciseController;
  let service: jest.Mocked<ExerciseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExerciseController],
      providers: [
        {
          provide: ExerciseService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExerciseController>(ExerciseController);
    service = module.get(ExerciseService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should call exerciseService.findAll with query and userId', async () => {
      // Arrange
      const query = { page: 1, limit: 20 };
      const userId = 1;
      const expected = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      service.findAll.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll(userId, query as any);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(query, userId);
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should call exerciseService.findById with id and userId', async () => {
      // Arrange
      const userId = 1;
      const exerciseId = 5;
      const expected = { id: 5, name: 'Bench Press' };
      service.findById.mockResolvedValue(expected as any);

      // Act
      const result = await controller.findById(userId, exerciseId);

      // Assert
      expect(service.findById).toHaveBeenCalledWith(exerciseId, userId);
      expect(result).toEqual(expected);
    });
  });

  describe('create', () => {
    it('should call exerciseService.create with userId and dto', async () => {
      // Arrange
      const userId = 1;
      const dto = { name: 'Custom Curl', trackingTypeId: 1 };
      const expected = { id: 10, ...dto };
      service.create.mockResolvedValue(expected as any);

      // Act
      const result = await controller.create(userId, dto as any);

      // Assert
      expect(service.create).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should call exerciseService.update with id, userId, and dto', async () => {
      // Arrange
      const userId = 1;
      const exerciseId = 5;
      const dto = { name: 'Updated Name' };
      const expected = { id: 5, name: 'Updated Name' };
      service.update.mockResolvedValue(expected as any);

      // Act
      const result = await controller.update(userId, exerciseId, dto as any);

      // Assert
      expect(service.update).toHaveBeenCalledWith(exerciseId, userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should call exerciseService.remove with id and userId', async () => {
      // Arrange
      const userId = 1;
      const exerciseId = 5;
      const expected = { message: 'Exercise deleted successfully' };
      service.remove.mockResolvedValue(expected);

      // Act
      const result = await controller.remove(userId, exerciseId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(exerciseId, userId);
      expect(result).toEqual(expected);
    });
  });
});
