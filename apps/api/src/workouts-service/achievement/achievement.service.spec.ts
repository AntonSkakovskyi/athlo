import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AchievementService } from './achievement.service';
import { AchievementEntity } from './entities/achievement.entity';
import { UserAchievementEntity } from './entities/user-achievement.entity';
import { UserExerciseRecordEntity } from './entities/user-exercise-record.entity';
import { TrackingMetricEntity } from '../../exercise-catalog/entities/tracking-metric.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { AchievementType, TrackingMetric } from '@athlo/shared';

const METRIC_IDS: Record<string, number> = {
  [TrackingMetric.WEIGHT]: 1,
  [TrackingMetric.REPS]: 2,
  [TrackingMetric.DURATION]: 3,
  [TrackingMetric.DISTANCE]: 4,
  [TrackingMetric.VOLUME]: 5,
  [TrackingMetric.ESTIMATED_1RM]: 6,
};

const MOCK_METRICS = Object.entries(METRIC_IDS).map(([name, id]) => ({ id, name }));

const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const makeQb = (result: any = null) => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(result),
    getRawOne: jest.fn().mockResolvedValue(result),
    getRawMany: jest.fn().mockResolvedValue(result ?? []),
  };
  return qb;
};

describe('AchievementService', () => {
  let service: AchievementService;
  let achievementRepo: ReturnType<typeof createMockRepository>;
  let userAchievementRepo: ReturnType<typeof createMockRepository>;
  let userExerciseRecordRepo: ReturnType<typeof createMockRepository>;
  let trackingMetricRepo: ReturnType<typeof createMockRepository>;
  let logSetRepo: ReturnType<typeof createMockRepository>;
  let logExerciseRepo: ReturnType<typeof createMockRepository>;
  let workoutRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: getRepositoryToken(AchievementEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserAchievementEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserExerciseRecordEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(TrackingMetricEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(LogSetEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(LogExerciseEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(WorkoutEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
    achievementRepo = module.get(getRepositoryToken(AchievementEntity));
    userAchievementRepo = module.get(getRepositoryToken(UserAchievementEntity));
    userExerciseRecordRepo = module.get(getRepositoryToken(UserExerciseRecordEntity));
    trackingMetricRepo = module.get(getRepositoryToken(TrackingMetricEntity));
    logSetRepo = module.get(getRepositoryToken(LogSetEntity));
    logExerciseRepo = module.get(getRepositoryToken(LogExerciseEntity));
    workoutRepo = module.get(getRepositoryToken(WorkoutEntity));

    trackingMetricRepo.find.mockResolvedValue(MOCK_METRICS);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Getters ──────────────────────────────────────

  describe('getAll', () => {
    it('should return all achievements ordered by type and threshold', async () => {
      const achievements = [{ id: 1, name: 'First Workout' }];
      achievementRepo.find.mockResolvedValue(achievements);

      const result = await service.getAll();

      expect(achievementRepo.find).toHaveBeenCalledWith({
        relations: { trackingMetricRelation: true },
        order: { type: 'ASC', threshold: 'ASC' },
      });
      expect(result).toEqual(achievements);
    });
  });

  describe('getUserAchievements', () => {
    it('should return user achievements with relations', async () => {
      const userAchievements = [
        { id: 1, userId: 1, achievement: { name: 'First Workout' } },
      ];
      userAchievementRepo.find.mockResolvedValue(userAchievements);

      const result = await service.getUserAchievements(1);

      expect(result).toEqual(userAchievements);
    });
  });

  describe('getExerciseRecord', () => {
    it('should return records for a user and exercise', async () => {
      const records = [
        { id: 1, userId: 1, exerciseId: 5, metricTypeId: METRIC_IDS[TrackingMetric.WEIGHT], value: 100 },
      ];
      userExerciseRecordRepo.find.mockResolvedValue(records);

      const result = await service.getExerciseRecord(1, 5);

      expect(userExerciseRecordRepo.find).toHaveBeenCalledWith({
        where: { userId: 1, exerciseId: 5 },
        relations: { trackingMetric: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(records);
    });
  });

  // ─── checkAndUpdateRecords ────────────────────────

  describe('checkAndUpdateRecords', () => {
    it('should return early when logExercise does not exist', async () => {
      logExerciseRepo.findOne.mockResolvedValue(null);

      await service.checkAndUpdateRecords(1, 99);

      expect(userExerciseRecordRepo.delete).not.toHaveBeenCalled();
    });

    it('should detect WEIGHT PR and mark set.isPR for WEIGHT_AND_REPS exercise', async () => {
      const set = {
        id: 10,
        order: 1,
        isCompleted: true,
        weight: 100,
        reps: 5,
        isPR: false,
        achievementId: null,
      };
      logExerciseRepo.findOne.mockResolvedValue({
        id: 1,
        exerciseId: 5,
        exercise: { trackingType: { name: 'WEIGHT_AND_REPS' } },
        sets: [set],
      });
      userExerciseRecordRepo.delete.mockResolvedValue({});
      userExerciseRecordRepo.find.mockResolvedValue([]);
      const newRecord = {
        userId: 1,
        exerciseId: 5,
        metricTypeId: METRIC_IDS[TrackingMetric.WEIGHT],
        value: 100,
        logSetId: 10,
      };
      userExerciseRecordRepo.create.mockImplementation((d) => ({ ...d }));
      logSetRepo.save.mockResolvedValue(set);
      achievementRepo.find.mockResolvedValue([]);
      userExerciseRecordRepo.save.mockResolvedValue([newRecord]);

      await service.checkAndUpdateRecords(1, 1);

      expect(set.isPR).toBe(true);
      expect(userExerciseRecordRepo.save).toHaveBeenCalled();
    });

    it('should compute correct 1RM = weight*(1+reps/30)', async () => {
      // weight=100, reps=10 → 1RM = 100*(1+10/30) = 100*1.333... ≈ 133.33
      const set = {
        id: 10,
        order: 1,
        isCompleted: true,
        weight: 100,
        reps: 10,
        isPR: false,
        achievementId: null,
      };
      logExerciseRepo.findOne.mockResolvedValue({
        id: 1,
        exerciseId: 5,
        exercise: { trackingType: { name: 'WEIGHT_AND_REPS' } },
        sets: [set],
      });
      userExerciseRecordRepo.delete.mockResolvedValue({});
      userExerciseRecordRepo.find.mockResolvedValue([]);
      userExerciseRecordRepo.create.mockImplementation((d) => ({ ...d }));
      logSetRepo.save.mockResolvedValue(set);
      achievementRepo.find.mockResolvedValue([]);
      userExerciseRecordRepo.save.mockImplementation((records) =>
        Promise.resolve(records),
      );

      await service.checkAndUpdateRecords(1, 1);

      const saved = userExerciseRecordRepo.save.mock.calls[0][0] as any[];
      const oneRmRecord = saved.find(
        (r: any) => r.metricTypeId === METRIC_IDS[TrackingMetric.ESTIMATED_1RM],
      );
      expect(oneRmRecord).toBeDefined();
      expect(oneRmRecord.value).toBeCloseTo(133.33, 1);
    });

    it('should skip incomplete sets and clear their PR flags', async () => {
      const set = {
        id: 10,
        order: 1,
        isCompleted: false,
        weight: 100,
        reps: 5,
        isPR: true,
        achievementId: 1,
      };
      logExerciseRepo.findOne.mockResolvedValue({
        id: 1,
        exerciseId: 5,
        exercise: { trackingType: { name: 'WEIGHT_AND_REPS' } },
        sets: [set],
      });
      userExerciseRecordRepo.delete.mockResolvedValue({});
      userExerciseRecordRepo.find.mockResolvedValue([]);
      userExerciseRecordRepo.save.mockResolvedValue([]);
      achievementRepo.find.mockResolvedValue([]);
      logSetRepo.save.mockResolvedValue(set);

      await service.checkAndUpdateRecords(1, 1);

      expect(set.isPR).toBe(false);
      expect(set.achievementId).toBeNull();
      expect(logSetRepo.save).toHaveBeenCalledWith([set]);
    });

    it('should check REPS_ONLY metric correctly', async () => {
      const set = {
        id: 11,
        order: 1,
        isCompleted: true,
        reps: 20,
        isPR: false,
        achievementId: null,
      };
      logExerciseRepo.findOne.mockResolvedValue({
        id: 1,
        exerciseId: 7,
        exercise: { trackingType: { name: 'REPS_ONLY' } },
        sets: [set],
      });
      userExerciseRecordRepo.delete.mockResolvedValue({});
      userExerciseRecordRepo.find.mockResolvedValue([]);
      userExerciseRecordRepo.create.mockImplementation((d) => ({ ...d }));
      logSetRepo.save.mockResolvedValue(set);
      achievementRepo.find.mockResolvedValue([]);
      userExerciseRecordRepo.save.mockResolvedValue([]);

      await service.checkAndUpdateRecords(1, 1);

      const saved = userExerciseRecordRepo.save.mock.calls[0][0] as any[];
      expect(
        saved.find((r: any) => r.metricTypeId === METRIC_IDS[TrackingMetric.REPS]),
      ).toBeDefined();
      expect(
        saved.find((r: any) => r.metricTypeId === METRIC_IDS[TrackingMetric.WEIGHT]),
      ).toBeUndefined();
    });
  });

  // ─── checkGlobalAchievements ──────────────────────

  describe('checkGlobalAchievements', () => {
    const setupGlobalMocks = (
      counts: {
        workouts?: number;
        sets?: number;
        weight?: number;
        time?: number;
        exercises?: number;
      } = {},
    ) => {
      workoutRepo.count.mockResolvedValue(counts.workouts ?? 0);
      logSetRepo.createQueryBuilder
        .mockReturnValueOnce(makeQb(counts.sets ?? 0))
        .mockReturnValueOnce(makeQb({ total: String(counts.weight ?? 0) }));
      workoutRepo.createQueryBuilder.mockReturnValue(
        makeQb({ total: String(counts.time ?? 0) }),
      );
      logExerciseRepo.createQueryBuilder.mockReturnValue(
        makeQb({ count: String(counts.exercises ?? 0) }),
      );
    };

    it('should unlock GLOBAL_WORKOUTS achievement when threshold is reached', async () => {
      setupGlobalMocks({ workouts: 10 });
      const achievement = {
        id: 1,
        type: AchievementType.GLOBAL_WORKOUTS,
        threshold: 10,
      };
      achievementRepo.find.mockResolvedValue([achievement]);
      userAchievementRepo.find.mockResolvedValue([]);
      userAchievementRepo.create.mockImplementation((d) => ({ ...d }));
      userAchievementRepo.save.mockResolvedValue({});

      await service.checkGlobalAchievements(1);

      expect(userAchievementRepo.save).toHaveBeenCalled();
    });

    it('should NOT unlock achievement when threshold is not reached', async () => {
      setupGlobalMocks({ workouts: 5 });
      const achievement = {
        id: 1,
        type: AchievementType.GLOBAL_WORKOUTS,
        threshold: 10,
      };
      achievementRepo.find.mockResolvedValue([achievement]);
      userAchievementRepo.find.mockResolvedValue([]);

      await service.checkGlobalAchievements(1);

      expect(userAchievementRepo.save).not.toHaveBeenCalled();
    });

    it('should skip already-unlocked achievements', async () => {
      setupGlobalMocks({ workouts: 50 });
      const achievement = {
        id: 1,
        type: AchievementType.GLOBAL_WORKOUTS,
        threshold: 10,
      };
      achievementRepo.find.mockResolvedValue([achievement]);
      userAchievementRepo.find.mockResolvedValue([{ achievementId: 1 }]);

      await service.checkGlobalAchievements(1);

      expect(userAchievementRepo.save).not.toHaveBeenCalled();
    });
  });
});
