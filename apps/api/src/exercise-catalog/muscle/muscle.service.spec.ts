import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MuscleService } from './muscle.service';
import { MuscleEntity } from '../entities/muscle.entity';

const createMockRepository = () => ({
  find: jest.fn(),
});

describe('MuscleService', () => {
  let service: MuscleService;
  let muscleRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MuscleService,
        {
          provide: getRepositoryToken(MuscleEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MuscleService>(MuscleService);
    muscleRepo = module.get(getRepositoryToken(MuscleEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all muscles ordered by name', async () => {
      // Arrange
      const mockMuscles = [
        { id: 1, name: 'Biceps', imageUrl: null },
        { id: 2, name: 'Chest', imageUrl: null },
      ];
      muscleRepo.find.mockResolvedValue(mockMuscles);

      // Act
      const result = await service.findAll();

      // Assert
      expect(muscleRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual(mockMuscles);
    });

    it('should return empty array when no muscles exist', async () => {
      // Arrange
      muscleRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
