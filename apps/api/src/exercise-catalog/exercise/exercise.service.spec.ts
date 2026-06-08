import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExerciseEntity } from '../entities/exercise.entity';
import { ExerciseMuscleEntity } from '../entities/exercise-muscle.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('ExerciseService', () => {
  let service: ExerciseService;
  let exerciseRepo: ReturnType<typeof createMockRepository>;
  let exerciseMuscleRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseService,
        {
          provide: getRepositoryToken(ExerciseEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ExerciseMuscleEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ExerciseService>(ExerciseService);
    exerciseRepo = module.get(getRepositoryToken(ExerciseEntity));
    exerciseMuscleRepo = module.get(getRepositoryToken(ExerciseMuscleEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    const makeQb = (data: any[] = [], total = 0) => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([data, total]),
    });

    it('should return paginated exercises with metadata', async () => {
      // Arrange
      const mockExercises = [{ id: 1, name: 'Bench Press' }];
      exerciseRepo.createQueryBuilder.mockReturnValue(makeQb(mockExercises, 1));

      // Act
      const result = await service.findAll({ page: 1, limit: 20 });

      // Assert
      expect(result.data).toEqual(mockExercises);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should apply search filter when provided', async () => {
      // Arrange
      const qb = makeQb();
      exerciseRepo.createQueryBuilder.mockReturnValue(qb);

      // Act
      await service.findAll({ page: 1, limit: 20, search: 'bench' });

      // Assert — search uses Brackets so andWhere receives an object, not a raw string
      expect(qb.andWhere).toHaveBeenCalledTimes(2); // userId IS NULL + search Brackets
    });

    it('should apply equipmentId filter when provided', async () => {
      // Arrange
      const qb = makeQb();
      exerciseRepo.createQueryBuilder.mockReturnValue(qb);

      // Act
      await service.findAll({ page: 1, limit: 20, equipmentId: 3 });

      // Assert
      expect(qb.andWhere).toHaveBeenCalledWith(
        'exercise.equipmentId = :equipmentId',
        { equipmentId: 3 },
      );
    });

    it('should apply muscleId filter when provided', async () => {
      // Arrange
      const qb = makeQb();
      exerciseRepo.createQueryBuilder.mockReturnValue(qb);

      // Act
      await service.findAll({ page: 1, limit: 20, muscleId: 5 });

      // Assert
      expect(qb.andWhere).toHaveBeenCalledWith(
        'exerciseMuscles.muscleId = :muscleId',
        { muscleId: 5 },
      );
    });
  });

  describe('findById', () => {
    it('should return exercise when it exists and is public', async () => {
      // Arrange
      const mockExercise = { id: 1, name: 'Squat', userId: null };
      exerciseRepo.findOne.mockResolvedValue(mockExercise);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(mockExercise);
    });

    it('should return exercise when it belongs to the current user', async () => {
      // Arrange
      const mockExercise = { id: 1, name: 'Custom Curl', userId: 1 };
      exerciseRepo.findOne.mockResolvedValue(mockExercise);

      // Act
      const result = await service.findById(1, 1);

      // Assert
      expect(result).toEqual(mockExercise);
    });

    it('should throw NotFoundException when exercise does not exist', async () => {
      // Arrange
      exerciseRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when exercise belongs to another user', async () => {
      // Arrange
      const mockExercise = { id: 1, name: 'Private Ex', userId: 2 };
      exerciseRepo.findOne.mockResolvedValue(mockExercise);

      // Act & Assert
      await expect(service.findById(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and save a new exercise', async () => {
      // Arrange
      const dto = { name: 'Custom Curl', trackingTypeId: 1 };
      const userId = 1;
      const mockExercise = { id: 10, ...dto, userId, visibilityTypeId: 1 };

      exerciseRepo.create.mockReturnValue(mockExercise);
      exerciseRepo.save.mockResolvedValue(mockExercise);
      exerciseRepo.findOne.mockResolvedValue(mockExercise);

      // Act
      const result = await service.create(userId, dto);

      // Assert
      expect(exerciseRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        description: null,
        equipmentId: null,
        trackingTypeId: dto.trackingTypeId,
        userId,
        visibilityTypeId: 1,
      });
      expect(exerciseRepo.save).toHaveBeenCalledWith(mockExercise);
      expect(result).toEqual(mockExercise);
    });

    it('should create exercise muscles when muscles are provided', async () => {
      // Arrange
      const dto = {
        name: 'Custom Curl',
        trackingTypeId: 1,
        muscles: [{ muscleId: 1, isPrimary: true, impactPercentage: 80 }],
      };
      const userId = 1;
      const savedExercise = { id: 10, name: dto.name, userId };

      exerciseRepo.create.mockReturnValue(savedExercise);
      exerciseRepo.save.mockResolvedValue(savedExercise);
      exerciseRepo.findOne.mockResolvedValue(savedExercise);
      exerciseMuscleRepo.create.mockReturnValue({
        exerciseId: 10,
        muscleId: 1,
        isPrimary: true,
        impactPercentage: 80,
      });
      exerciseMuscleRepo.save.mockResolvedValue([]);

      // Act
      await service.create(userId, dto);

      // Assert
      expect(exerciseMuscleRepo.create).toHaveBeenCalledWith({
        exerciseId: 10,
        muscleId: 1,
        isPrimary: true,
        impactPercentage: 80,
      });
      expect(exerciseMuscleRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update exercise fields and save', async () => {
      // Arrange
      const existingExercise = { id: 1, name: 'Old Name', userId: 1 };
      exerciseRepo.findOne.mockResolvedValue(existingExercise);
      exerciseRepo.save.mockResolvedValue({
        ...existingExercise,
        name: 'New Name',
      });

      // Act
      await service.update(1, 1, { name: 'New Name' });

      // Assert
      expect(exerciseRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
    });

    it('should throw NotFoundException when exercise does not exist', async () => {
      // Arrange
      exerciseRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, 1, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when exercise belongs to another user', async () => {
      // Arrange
      exerciseRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      // Act & Assert
      await expect(service.update(1, 1, { name: 'X' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should replace muscles when muscles array is provided', async () => {
      // Arrange
      const existingExercise = { id: 1, name: 'Curl', userId: 1 };
      exerciseRepo.findOne.mockResolvedValue(existingExercise);
      exerciseRepo.save.mockResolvedValue(existingExercise);
      exerciseMuscleRepo.delete.mockResolvedValue({});
      exerciseMuscleRepo.create.mockReturnValue({});
      exerciseMuscleRepo.save.mockResolvedValue([]);

      // Act
      await service.update(1, 1, {
        muscles: [{ muscleId: 2, isPrimary: false, impactPercentage: 50 }],
      });

      // Assert
      expect(exerciseMuscleRepo.delete).toHaveBeenCalledWith({ exerciseId: 1 });
      expect(exerciseMuscleRepo.create).toHaveBeenCalledWith({
        exerciseId: 1,
        muscleId: 2,
        isPrimary: false,
        impactPercentage: 50,
      });
    });
  });

  describe('remove', () => {
    it('should remove the exercise and return success message', async () => {
      // Arrange
      const exercise = { id: 1, userId: 1 };
      exerciseRepo.findOne.mockResolvedValue(exercise);
      exerciseRepo.remove.mockResolvedValue(exercise);

      // Act
      const result = await service.remove(1, 1);

      // Assert
      expect(exerciseRepo.remove).toHaveBeenCalledWith(exercise);
      expect(result).toEqual({ message: 'Exercise deleted successfully' });
    });

    it('should throw NotFoundException when exercise does not exist', async () => {
      // Arrange
      exerciseRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when exercise belongs to another user', async () => {
      // Arrange
      exerciseRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      // Act & Assert
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
