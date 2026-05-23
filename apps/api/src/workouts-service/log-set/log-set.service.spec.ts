import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LogSetService } from './log-set.service';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { AchievementService } from '../achievement/achievement.service';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockAchievementService = {
  checkAndUpdateRecords: jest.fn(),
};

describe('LogSetService', () => {
  let service: LogSetService;
  let logSetRepo: ReturnType<typeof createMockRepository>;
  let logExerciseRepo: ReturnType<typeof createMockRepository>;
  let workoutRepo: ReturnType<typeof createMockRepository>;

  const setupValidOwnership = (userId = 1) => {
    workoutRepo.findOne.mockResolvedValue({ id: 1, userId });
    logExerciseRepo.findOne.mockResolvedValue({ id: 10, workoutId: 1 });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogSetService,
        { provide: getRepositoryToken(LogSetEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(LogExerciseEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(WorkoutEntity), useValue: createMockRepository() },
        { provide: AchievementService, useValue: mockAchievementService },
      ],
    }).compile();

    service = module.get<LogSetService>(LogSetService);
    logSetRepo = module.get(getRepositoryToken(LogSetEntity));
    logExerciseRepo = module.get(getRepositoryToken(LogExerciseEntity));
    workoutRepo = module.get(getRepositoryToken(WorkoutEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────

  describe('create', () => {
    it('should create set and call checkAndUpdateRecords', async () => {
      setupValidOwnership();
      const dto = { order: 1, weight: 100, reps: 5 };
      const saved = { id: 20, logExerciseId: 10, ...dto };
      logSetRepo.create.mockReturnValue(saved);
      logSetRepo.save.mockResolvedValue(saved);
      logSetRepo.findOne.mockResolvedValue({ ...saved, achievement: null });
      mockAchievementService.checkAndUpdateRecords.mockResolvedValue(undefined);

      await service.create(1, 10, 1, dto);

      expect(logSetRepo.save).toHaveBeenCalled();
      expect(mockAchievementService.checkAndUpdateRecords).toHaveBeenCalledWith(1, 10);
    });

    it('should throw NotFoundException when workout does not exist', async () => {
      workoutRepo.findOne.mockResolvedValue(null);

      await expect(service.create(999, 10, 1, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the workout', async () => {
      workoutRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(service.create(1, 10, 1, {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when logExercise not in the workout', async () => {
      workoutRepo.findOne.mockResolvedValue({ id: 1, userId: 1 });
      logExerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.create(1, 99, 1, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────

  describe('update', () => {
    it('should update set and call checkAndUpdateRecords', async () => {
      setupValidOwnership();
      const set = { id: 20, logExerciseId: 10, reps: 5 };
      // findOne called twice: once for the set, once at end to return with relations
      logSetRepo.findOne
        .mockResolvedValueOnce(set)
        .mockResolvedValueOnce({ ...set, reps: 10, achievement: null });
      logSetRepo.save.mockResolvedValue({ ...set, reps: 10 });
      mockAchievementService.checkAndUpdateRecords.mockResolvedValue(undefined);

      await service.update(20, 1, 10, 1, { reps: 10 });

      expect(logSetRepo.save).toHaveBeenCalled();
      expect(mockAchievementService.checkAndUpdateRecords).toHaveBeenCalledWith(1, 10);
    });

    it('should throw NotFoundException when set not found', async () => {
      setupValidOwnership();
      logSetRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, 1, 10, 1, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the workout', async () => {
      workoutRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(service.update(20, 1, 10, 1, {})).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── remove ───────────────────────────────────────

  describe('remove', () => {
    it('should remove set and call checkAndUpdateRecords', async () => {
      setupValidOwnership();
      const set = { id: 20, logExerciseId: 10 };
      logSetRepo.findOne.mockResolvedValue(set);
      logSetRepo.remove.mockResolvedValue(set);
      mockAchievementService.checkAndUpdateRecords.mockResolvedValue(undefined);

      await service.remove(20, 1, 10, 1);

      expect(logSetRepo.remove).toHaveBeenCalledWith(set);
      expect(mockAchievementService.checkAndUpdateRecords).toHaveBeenCalledWith(1, 10);
    });

    it('should throw NotFoundException when set not found', async () => {
      setupValidOwnership();
      logSetRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1, 10, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the workout', async () => {
      workoutRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(service.remove(20, 1, 10, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
