import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LogExerciseService } from './log-exercise.service';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('LogExerciseService', () => {
  let service: LogExerciseService;
  let logExerciseRepo: ReturnType<typeof createMockRepository>;
  let workoutRepo: ReturnType<typeof createMockRepository>;

  const setupValidOwnership = (userId = 1) => {
    workoutRepo.findOne.mockResolvedValue({ id: 1, userId });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogExerciseService,
        { provide: getRepositoryToken(LogExerciseEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(WorkoutEntity), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<LogExerciseService>(LogExerciseService);
    logExerciseRepo = module.get(getRepositoryToken(LogExerciseEntity));
    workoutRepo = module.get(getRepositoryToken(WorkoutEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───────────────────────────────────────

  describe('create', () => {
    it('should create and return log exercise when user owns the workout', async () => {
      setupValidOwnership();
      const dto = { exerciseId: 5, order: 1 };
      const saved = { id: 10, workoutId: 1, ...dto };
      logExerciseRepo.create.mockReturnValue(saved);
      logExerciseRepo.save.mockResolvedValue(saved);

      const result = await service.create(1, 1, dto as any);

      expect(logExerciseRepo.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });

    it('should throw NotFoundException when workout not found', async () => {
      workoutRepo.findOne.mockResolvedValue(null);

      await expect(service.create(999, 1, { exerciseId: 5, order: 1 } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the workout', async () => {
      workoutRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(service.create(1, 1, { exerciseId: 5, order: 1 } as any)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── update ───────────────────────────────────────

  describe('update', () => {
    it('should update log exercise when user owns the workout', async () => {
      setupValidOwnership();
      const logExercise = { id: 10, workoutId: 1, notes: 'old' };
      logExerciseRepo.findOne.mockResolvedValue(logExercise);
      logExerciseRepo.save.mockResolvedValue({ ...logExercise, notes: 'new' });

      const result = await service.update(10, 1, 1, { notes: 'new' });

      expect(logExerciseRepo.save).toHaveBeenCalled();
      expect(result.notes).toBe('new');
    });

    it('should throw NotFoundException when log exercise not found in workout', async () => {
      setupValidOwnership();
      logExerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.update(99, 1, 1, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the workout', async () => {
      workoutRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(service.update(10, 1, 1, {})).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── remove ───────────────────────────────────────

  describe('remove', () => {
    it('should remove log exercise when user owns the workout', async () => {
      setupValidOwnership();
      const logExercise = { id: 10, workoutId: 1 };
      logExerciseRepo.findOne.mockResolvedValue(logExercise);
      logExerciseRepo.remove.mockResolvedValue(logExercise);

      await service.remove(10, 1, 1);

      expect(logExerciseRepo.remove).toHaveBeenCalledWith(logExercise);
    });

    it('should throw NotFoundException when log exercise not found', async () => {
      setupValidOwnership();
      logExerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(99, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the workout', async () => {
      workoutRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(service.remove(10, 1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
