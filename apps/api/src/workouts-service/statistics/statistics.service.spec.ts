import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { BodyMetricEntity } from '../../user-service/body-metrics/entities/body-metric.entity';
import { ExerciseEntity } from '../../exercise-catalog/entities/exercise.entity';

const createMockRepository = () => ({
  count: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const makeQb = (opts: { count?: number; rawOne?: any; rawMany?: any[] } = {}) => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(opts.count ?? 0),
    getRawOne: jest.fn().mockResolvedValue(opts.rawOne ?? null),
    getRawMany: jest.fn().mockResolvedValue(opts.rawMany ?? []),
    getMany: jest.fn().mockResolvedValue(opts.rawMany ?? []),
    getOne: jest.fn().mockResolvedValue(opts.rawOne ?? null),
  };
  return qb;
};

describe('StatisticsService', () => {
  let service: StatisticsService;
  let workoutRepo: ReturnType<typeof createMockRepository>;
  let logExerciseRepo: ReturnType<typeof createMockRepository>;
  let logSetRepo: ReturnType<typeof createMockRepository>;
  let bodyMetricRepo: ReturnType<typeof createMockRepository>;
  let exerciseRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: getRepositoryToken(WorkoutEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(LogExerciseEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(LogSetEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(BodyMetricEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(ExerciseEntity), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    workoutRepo = module.get(getRepositoryToken(WorkoutEntity));
    logExerciseRepo = module.get(getRepositoryToken(LogExerciseEntity));
    logSetRepo = module.get(getRepositoryToken(LogSetEntity));
    bodyMetricRepo = module.get(getRepositoryToken(BodyMetricEntity));
    exerciseRepo = module.get(getRepositoryToken(ExerciseEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── calculateStreak (via getSummary) ─────────────

  describe('calculateStreak', () => {
    const setupSummaryMocks = (streakDates: { workoutDate: string }[]) => {
      workoutRepo.count.mockResolvedValue(0);
      logExerciseRepo.createQueryBuilder.mockReturnValue(makeQb({ count: 0 }));
      logSetRepo.createQueryBuilder
        .mockReturnValueOnce(makeQb({ count: 0 }))
        .mockReturnValueOnce(makeQb({ rawOne: { total: '0' } }));
      workoutRepo.createQueryBuilder
        .mockReturnValueOnce(makeQb({ rawOne: { totalSeconds: '0' } }))
        .mockReturnValueOnce(makeQb({ rawMany: streakDates }));
    };

    it('should return 0 when user has no workout dates', async () => {
      setupSummaryMocks([]);

      const result = await service.getSummary(1);

      expect(result.currentStreak).toBe(0);
    });

    it('should return 1 for a single workout date', async () => {
      setupSummaryMocks([{ workoutDate: '2025-06-01' }]);

      const result = await service.getSummary(1);

      expect(result.currentStreak).toBe(1);
    });

    it('should return streak count for consecutive days (newest first)', async () => {
      setupSummaryMocks([
        { workoutDate: '2025-06-03' },
        { workoutDate: '2025-06-02' },
        { workoutDate: '2025-06-01' },
      ]);

      const result = await service.getSummary(1);

      expect(result.currentStreak).toBe(3);
    });

    it('should stop counting at a gap in days', async () => {
      setupSummaryMocks([
        { workoutDate: '2025-06-05' },
        { workoutDate: '2025-06-04' },
        { workoutDate: '2025-06-02' }, // gap here
        { workoutDate: '2025-06-01' },
      ]);

      const result = await service.getSummary(1);

      expect(result.currentStreak).toBe(2);
    });
  });

  // ─── getSummary ───────────────────────────────────

  describe('getSummary', () => {
    it('should aggregate totals correctly', async () => {
      workoutRepo.count.mockResolvedValue(15);
      logExerciseRepo.createQueryBuilder.mockReturnValue(makeQb({ count: 45 }));
      logSetRepo.createQueryBuilder
        .mockReturnValueOnce(makeQb({ count: 200 }))
        .mockReturnValueOnce(makeQb({ rawOne: { total: '5000.5' } }));
      workoutRepo.createQueryBuilder
        .mockReturnValueOnce(makeQb({ rawOne: { totalSeconds: '18000' } }))
        .mockReturnValueOnce(makeQb({ rawMany: [{ workoutDate: '2025-06-01' }] }));

      const result = await service.getSummary(1);

      expect(result.totalWorkouts).toBe(15);
      expect(result.totalExercisesPerformed).toBe(45);
      expect(result.totalSets).toBe(200);
      expect(result.totalWeightLifted).toBe(5000.5);
      expect(result.totalDurationSeconds).toBe(18000);
      expect(result.currentStreak).toBe(1);
    });

    it('should return zero totals when user has no workouts', async () => {
      workoutRepo.count.mockResolvedValue(0);
      logExerciseRepo.createQueryBuilder.mockReturnValue(makeQb({ count: 0 }));
      logSetRepo.createQueryBuilder
        .mockReturnValueOnce(makeQb({ count: 0 }))
        .mockReturnValueOnce(makeQb({ rawOne: null }));
      workoutRepo.createQueryBuilder
        .mockReturnValueOnce(makeQb({ rawOne: null }))
        .mockReturnValueOnce(makeQb({ rawMany: [] }));

      const result = await service.getSummary(1);

      expect(result.totalWorkouts).toBe(0);
      expect(result.totalWeightLifted).toBe(0);
      expect(result.totalDurationSeconds).toBe(0);
      expect(result.currentStreak).toBe(0);
    });
  });

  // ─── getExerciseProgress ──────────────────────────

  describe('getExerciseProgress', () => {
    it('should return exercise progress with heaviestWeight and totalVolume', async () => {
      exerciseRepo.findOne.mockResolvedValue({
        trackingType: { name: 'WEIGHT_AND_REPS' },
      });

      const loggedExercises = [
        {
          workoutId: 1,
          workout: { started_at: new Date('2025-06-01') },
          sets: [
            { id: 1, logExerciseId: 10, order: 1, weight: 100, reps: 5, duration: null, distance: null, isCompleted: true, isPR: false, achievementId: null, achievement: null },
            { id: 2, logExerciseId: 10, order: 2, weight: 80, reps: 8, duration: null, distance: null, isCompleted: true, isPR: false, achievementId: null, achievement: null },
          ],
        },
      ];
      logExerciseRepo.createQueryBuilder.mockReturnValue(makeQb({ rawMany: loggedExercises }));

      const result = await service.getExerciseProgress(1, 5);

      expect(result.trackingType).toBe('WEIGHT_AND_REPS');
      expect(result.records).toHaveLength(1);
      expect(result.records[0].heaviestWeight).toBe(100);
      expect(result.records[0].totalVolume).toBe(100 * 5 + 80 * 8); // 500 + 640 = 1140
      expect(result.records[0].date).toBe('2025-06-01');
    });

    it('should skip incomplete sets when computing heaviestWeight', async () => {
      exerciseRepo.findOne.mockResolvedValue({ trackingType: { name: 'WEIGHT_AND_REPS' } });

      const loggedExercises = [
        {
          workoutId: 1,
          workout: { started_at: new Date('2025-06-01') },
          sets: [
            { id: 1, logExerciseId: 10, order: 1, weight: 150, reps: 3, duration: null, distance: null, isCompleted: false, isPR: false, achievementId: null, achievement: null },
            { id: 2, logExerciseId: 10, order: 2, weight: 80, reps: 5, duration: null, distance: null, isCompleted: true, isPR: false, achievementId: null, achievement: null },
          ],
        },
      ];
      logExerciseRepo.createQueryBuilder.mockReturnValue(makeQb({ rawMany: loggedExercises }));

      const result = await service.getExerciseProgress(1, 5);

      expect(result.records[0].heaviestWeight).toBe(80); // incomplete 150 is excluded
    });

    it('should return empty records when exercise was never logged', async () => {
      exerciseRepo.findOne.mockResolvedValue({ trackingType: { name: 'WEIGHT_AND_REPS' } });
      logExerciseRepo.createQueryBuilder.mockReturnValue(makeQb({ rawMany: [] }));

      const result = await service.getExerciseProgress(1, 99);

      expect(result.records).toHaveLength(0);
    });
  });

  // ─── getBodyMetricProgress ────────────────────────

  describe('getBodyMetricProgress', () => {
    it('should return empty result when no metrics exist', async () => {
      bodyMetricRepo.find.mockResolvedValue([]);

      const result = await service.getBodyMetricProgress(1, 1);

      expect(result.current).toBeNull();
      expect(result.history).toHaveLength(0);
    });

    it('should compute min, max, change, and current from history', async () => {
      bodyMetricRepo.find.mockResolvedValue([
        { value: 80, recordedAt: new Date('2025-01-01') },
        { value: 75, recordedAt: new Date('2025-03-01') },
        { value: 78, recordedAt: new Date('2025-06-01') },
      ]);

      const result = await service.getBodyMetricProgress(1, 1);

      expect(result.current).toBe(78);
      expect(result.min).toBe(75);
      expect(result.max).toBe(80);
      expect(result.change).toBe(-2); // 78 - 80 = -2
    });
  });
});
