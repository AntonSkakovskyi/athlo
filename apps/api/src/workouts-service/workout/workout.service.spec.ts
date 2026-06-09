import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { AchievementService } from '../achievement/achievement.service';
import { FriendService } from '../../user-service/friends/friend.service';
import { WorkoutStatus } from '@athlo/shared';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const makeQb = (result: any = null) => {
  const qb: any = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
    getMany: jest.fn().mockResolvedValue(result ?? []),
  };
  return qb;
};

const mockAchievementService = {
  checkGlobalAchievements: jest.fn(),
  checkAndUpdateRecords: jest.fn(),
};

const mockFriendService = {
  isFriend: jest.fn(),
};

describe('WorkoutService', () => {
  let service: WorkoutService;
  let workoutRepo: ReturnType<typeof createMockRepository>;
  let logExerciseRepo: ReturnType<typeof createMockRepository>;
  let logSetRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutService,
        {
          provide: getRepositoryToken(WorkoutEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(LogExerciseEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(LogSetEntity),
          useValue: createMockRepository(),
        },
        { provide: AchievementService, useValue: mockAchievementService },
        { provide: FriendService, useValue: mockFriendService },
      ],
    }).compile();

    service = module.get<WorkoutService>(WorkoutService);
    workoutRepo = module.get(getRepositoryToken(WorkoutEntity));
    logExerciseRepo = module.get(getRepositoryToken(LogExerciseEntity));
    logSetRepo = module.get(getRepositoryToken(LogSetEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findOne ──────────────────────────────────────

  describe('findOne', () => {
    it('should return workout when user is the owner', async () => {
      const workout = { id: 1, userId: 1, logExercises: [] };
      workoutRepo.findOne.mockResolvedValue(workout);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(workout);
    });

    it('should throw NotFoundException when workout does not exist', async () => {
      workoutRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the workout', async () => {
      workoutRepo.findOne.mockResolvedValue({ id: 1, userId: 2 });

      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── complete ─────────────────────────────────────

  describe('complete', () => {
    const baseFinalized = [
      { logExerciseId: 10, sets: [{ order: 1, weight: 50, reps: 5 }] },
    ];

    const mockSavePass = () => {
      logSetRepo.delete.mockResolvedValue({});
      logSetRepo.create.mockImplementation((s: any) => s);
      logSetRepo.save.mockResolvedValue([]);
    };

    it('should set status to COMPLETED and call checkGlobalAchievements', async () => {
      const workout = {
        id: 1,
        userId: 1,
        status: WorkoutStatus.IN_PROGRESS,
        logExercises: [{ id: 10 }],
      };
      workoutRepo.findOne.mockResolvedValue(workout);
      workoutRepo.save.mockResolvedValue({
        ...workout,
        status: WorkoutStatus.COMPLETED,
      });
      mockSavePass();
      mockAchievementService.checkAndUpdateRecords.mockResolvedValue(undefined);
      mockAchievementService.checkGlobalAchievements.mockResolvedValue(
        undefined,
      );

      await service.complete(1, 1, { finalizedExercises: baseFinalized });

      expect(workoutRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: WorkoutStatus.COMPLETED }),
      );
      expect(
        mockAchievementService.checkGlobalAchievements,
      ).toHaveBeenCalledWith(1);
    });

    it('should set ended_at timestamp', async () => {
      const workout = {
        id: 1,
        userId: 1,
        status: WorkoutStatus.IN_PROGRESS,
        logExercises: [{ id: 10 }],
      };
      workoutRepo.findOne.mockResolvedValue(workout);
      workoutRepo.save.mockImplementation((w) => Promise.resolve(w));
      mockSavePass();
      mockAchievementService.checkAndUpdateRecords.mockResolvedValue(undefined);
      mockAchievementService.checkGlobalAchievements.mockResolvedValue(
        undefined,
      );

      await service.complete(1, 1, { finalizedExercises: baseFinalized });

      expect(workoutRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ ended_at: expect.any(Date) }),
      );
    });

    it('should apply optional dto fields when provided', async () => {
      const workout = { id: 1, userId: 1, logExercises: [{ id: 10 }] };
      workoutRepo.findOne.mockResolvedValue(workout);
      workoutRepo.save.mockImplementation((w) => Promise.resolve(w));
      mockSavePass();
      mockAchievementService.checkAndUpdateRecords.mockResolvedValue(undefined);
      mockAchievementService.checkGlobalAchievements.mockResolvedValue(
        undefined,
      );

      await service.complete(1, 1, {
        calories: 500,
        rpe: 7,
        finalizedExercises: baseFinalized,
      });

      expect(workoutRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ calories: 500, rpe: 7 }),
      );
    });

    it('should throw BadRequestException when no completed sets provided', async () => {
      const workout = {
        id: 1,
        userId: 1,
        status: WorkoutStatus.IN_PROGRESS,
        logExercises: [{ id: 10 }],
      };
      workoutRepo.findOne.mockResolvedValue(workout);

      await expect(service.complete(1, 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should remove log_exercises not in finalizedExercises', async () => {
      const workout = {
        id: 1,
        userId: 1,
        status: WorkoutStatus.IN_PROGRESS,
        logExercises: [{ id: 10 }, { id: 11 }],
      };
      workoutRepo.findOne.mockResolvedValue(workout);
      workoutRepo.save.mockImplementation((w) => Promise.resolve(w));
      mockSavePass();
      mockAchievementService.checkAndUpdateRecords.mockResolvedValue(undefined);
      mockAchievementService.checkGlobalAchievements.mockResolvedValue(
        undefined,
      );

      await service.complete(1, 1, { finalizedExercises: baseFinalized });

      expect(logExerciseRepo.remove).toHaveBeenCalledWith([{ id: 11 }]);
    });
  });

  // ─── copyWorkout ──────────────────────────────────

  describe('copyWorkout', () => {
    it('should create a copy with IN_PROGRESS status and isCompleted=false on sets', async () => {
      const original = {
        id: 1,
        userId: 1,
        name: 'Push Day',
        description: 'Chest and triceps',
        logExercises: [
          {
            exerciseId: 10,
            order: 1,
            notes: 'Go heavy',
            restTime: 90,
            sets: [
              {
                order: 1,
                weight: 100,
                reps: 5,
                duration: null,
                distance: null,
                isCompleted: true,
              },
            ],
          },
        ],
      };
      const savedWorkout = { id: 2, userId: 1, name: 'Push Day' };
      const savedLogExercise = { id: 20, workoutId: 2 };

      // findOne called twice: once for original, once at end of copyWorkout
      workoutRepo.findOne
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce({ ...savedWorkout, logExercises: [] });
      workoutRepo.create.mockReturnValue(savedWorkout);
      workoutRepo.save.mockResolvedValue(savedWorkout);
      logExerciseRepo.create.mockReturnValue({ workoutId: 2, exerciseId: 10 });
      logExerciseRepo.save.mockResolvedValue(savedLogExercise);
      logSetRepo.create.mockImplementation((d) => d);
      logSetRepo.save.mockResolvedValue([]);

      await service.copyWorkout(1, 1);

      expect(workoutRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: WorkoutStatus.IN_PROGRESS }),
      );
      const setCreated = logSetRepo.create.mock.calls[0][0];
      expect(setCreated.isCompleted).toBe(false);
    });

    it('should copy workout without exercises when logExercises is empty', async () => {
      const original = {
        id: 1,
        userId: 1,
        name: 'Empty',
        description: '',
        logExercises: [],
      };
      const savedWorkout = { id: 2, userId: 1, name: 'Empty' };

      workoutRepo.findOne
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce({ ...savedWorkout, logExercises: [] });
      workoutRepo.create.mockReturnValue(savedWorkout);
      workoutRepo.save.mockResolvedValue(savedWorkout);

      await service.copyWorkout(1, 1);

      expect(logExerciseRepo.save).not.toHaveBeenCalled();
      expect(logSetRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── getLastPerformance ───────────────────────────

  describe('getLastPerformance', () => {
    it('should return null when no completed workout with the exercise exists', async () => {
      workoutRepo.createQueryBuilder.mockReturnValue(makeQb(null));

      const result = await service.getLastPerformance(1, 10);

      expect(result).toBeNull();
    });

    it('should return last performance with sets when workout found', async () => {
      const workout = {
        id: 5,
        name: 'Pull Day',
        started_at: new Date('2025-06-01'),
      };
      const logExercise = { id: 42 };
      const sets = [{ order: 1, weight: 80, reps: 8 }];
      workoutRepo.createQueryBuilder.mockReturnValue(makeQb(workout));
      logExerciseRepo.createQueryBuilder.mockReturnValue(makeQb(logExercise));
      logSetRepo.createQueryBuilder.mockReturnValue(makeQb(sets));

      const result = await service.getLastPerformance(1, 10);

      expect(result).toEqual({
        workoutId: 5,
        workoutName: 'Pull Day',
        date: '2025-06-01',
        sets,
      });
    });
  });
});
