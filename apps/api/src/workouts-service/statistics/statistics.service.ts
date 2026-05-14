import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { BodyMetricEntity } from '../../user-service/body-metrics/entities/body-metric.entity';
import { ExerciseEntity } from '../../exercise-catalog/entities/exercise.entity';
import { WorkoutStatus } from '@athlo/shared';
import type {
  IWorkoutStatistics,
  IExerciseProgress,
  IBodyMetricProgress,
  IStatisticsSummary,
  IFrequentExercise,
} from '@athlo/shared';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepo: Repository<WorkoutEntity>,
    @InjectRepository(LogExerciseEntity)
    private readonly logExerciseRepo: Repository<LogExerciseEntity>,
    @InjectRepository(LogSetEntity)
    private readonly logSetRepo: Repository<LogSetEntity>,
    @InjectRepository(BodyMetricEntity)
    private readonly bodyMetricRepo: Repository<BodyMetricEntity>,
    @InjectRepository(ExerciseEntity)
    private readonly exerciseRepo: Repository<ExerciseEntity>,
  ) {}

  async getWorkoutStatistics(
    userId: number,
    from?: string,
    to?: string,
  ): Promise<IWorkoutStatistics> {
    const dateFilter = this.buildDateFilter(from, to, 'w.started_at');

    // Total workouts
    const totalWorkoutsResult = await this.workoutRepo
      .createQueryBuilder('w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere(dateFilter.clause, dateFilter.params)
      .getCount();

    // Workouts per month
    const perMonth = await this.workoutRepo
      .createQueryBuilder('w')
      .select("TO_CHAR(w.started_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)::int', 'count')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere(dateFilter.clause, dateFilter.params)
      .groupBy("TO_CHAR(w.started_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Total sets
    const totalSetsResult = await this.logSetRepo
      .createQueryBuilder('ls')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere(dateFilter.clause, dateFilter.params)
      .getCount();

    // Total weight lifted (sum of weight*reps)
    const totalWeightResult = await this.logSetRepo
      .createQueryBuilder('ls')
      .select('COALESCE(SUM(ls.weight * ls.reps), 0)', 'total')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere(dateFilter.clause, dateFilter.params)
      .getRawOne();

    // Average workout duration in minutes
    const avgDurationResult = await this.workoutRepo
      .createQueryBuilder('w')
      .select(
        'AVG(EXTRACT(EPOCH FROM (w.ended_at - w.started_at)) / 60)',
        'avgMinutes',
      )
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere('w.ended_at IS NOT NULL')
      .andWhere(dateFilter.clause, dateFilter.params)
      .getRawOne();

    // Chart data: per-day aggregation for line charts
    const chartDataRaw = await this.workoutRepo
      .createQueryBuilder('w')
      .select('w.started_at::date::text', 'date')
      .addSelect('COUNT(DISTINCT w.id)::int', 'workoutsCount')
      .addSelect('COUNT(ls.id) FILTER (WHERE ls.is_completed = true)::int', 'totalSets')
      .addSelect(
        'COALESCE(SUM(DISTINCT EXTRACT(EPOCH FROM (w.ended_at - w.started_at)) / 60), 0)',
        'totalDurationMinutes',
      )
      .addSelect(
        'COALESCE(SUM(ls.weight * ls.reps) FILTER (WHERE ls.is_completed = true), 0)',
        'totalVolume',
      )
      .addSelect(
        'COALESCE(SUM(ls.reps) FILTER (WHERE ls.is_completed = true), 0)::int',
        'totalReps',
      )
      .leftJoin('w.logExercises', 'le')
      .leftJoin('le.sets', 'ls')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere(dateFilter.clause, dateFilter.params)
      .groupBy('w.started_at::date')
      .orderBy('w.started_at::date', 'ASC')
      .getRawMany();

    return {
      totalWorkouts: totalWorkoutsResult,
      totalSets: totalSetsResult,
      totalWeightLifted: parseFloat(totalWeightResult?.total ?? '0'),
      averageDurationMinutes: avgDurationResult?.avgMinutes
        ? parseFloat(parseFloat(avgDurationResult.avgMinutes).toFixed(1))
        : null,
      workoutsPerMonth: perMonth.map((r) => ({
        month: r.month,
        count: parseInt(r.count, 10),
      })),
      chartData: chartDataRaw.map((r) => ({
        date: r.date,
        workoutsCount: parseInt(r.workoutsCount, 10),
        totalSets: parseInt(r.totalSets, 10),
        totalDurationMinutes: parseFloat(parseFloat(r.totalDurationMinutes).toFixed(1)),
        totalVolume: parseFloat(r.totalVolume),
        totalReps: parseInt(r.totalReps, 10),
      })),
    };
  }

  async getExerciseProgress(
    userId: number,
    exerciseId: number,
    from?: string,
    to?: string,
  ): Promise<IExerciseProgress> {
    const dateFilter = this.buildDateFilter(from, to, 'w.started_at');

    // Get tracking type for this exercise
    const trackingTypeResult = await this.logExerciseRepo
      .createQueryBuilder('le')
      .innerJoinAndSelect('le.exercise', 'e')
      .innerJoinAndSelect('e.trackingType', 'tt')
      .where('le.exercise_id = :exerciseId', { exerciseId })
      .limit(1)
      .getOne();

    const trackingType = trackingTypeResult?.exercise?.trackingType?.name ?? 'WEIGHT_AND_REPS';

    const records = await this.logSetRepo
      .createQueryBuilder('ls')
      .select('w.id', 'workoutId')
      .addSelect('w.started_at::date::text', 'date')
      .addSelect('MAX(ls.weight)', 'heaviestWeight')
      .addSelect('MAX(ls.weight * ls.reps)', 'bestSetVolume')
      .addSelect('SUM(ls.weight * ls.reps)', 'totalVolume')
      .addSelect('SUM(ls.reps)', 'totalReps')
      .addSelect('MAX(ls.duration)', 'bestDuration')
      .addSelect('MAX(ls.distance)', 'bestDistance')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('le.exercise_id = :exerciseId', { exerciseId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere('ls.is_completed = true')
      .andWhere(dateFilter.clause, dateFilter.params)
      .groupBy('w.id')
      .addGroupBy('w.started_at')
      .orderBy('w.started_at', 'ASC')
      .getRawMany();

    return {
      exerciseId,
      trackingType,
      records: records.map((r) => ({
        date: r.date,
        workoutId: r.workoutId,
        heaviestWeight: r.heaviestWeight != null ? parseFloat(r.heaviestWeight) : null,
        bestSetVolume: r.bestSetVolume != null ? parseFloat(r.bestSetVolume) : null,
        totalVolume: r.totalVolume != null ? parseFloat(r.totalVolume) : null,
        totalReps: r.totalReps != null ? parseInt(r.totalReps, 10) : null,
        bestDuration: r.bestDuration != null ? parseInt(r.bestDuration, 10) : null,
        bestDistance: r.bestDistance != null ? parseFloat(r.bestDistance) : null,
      })),
    };
  }

  async getFrequentExercises(
    userId: number,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: IFrequentExercise[]; meta: { page: number; limit: number; total: number } }> {
    const offset = (page - 1) * limit;

    const qb = this.logSetRepo
      .createQueryBuilder('ls')
      .select('e.id', 'exerciseId')
      .addSelect('e.name', 'exerciseName')
      .addSelect('eq.name', 'equipmentName')
      .addSelect('tt.name', 'trackingType')
      .addSelect('COUNT(DISTINCT ls.id)::int', 'totalSets')
      .addSelect('COUNT(DISTINCT w.id)::int', 'totalWorkouts')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .innerJoin('le.exercise', 'e')
      .leftJoin('e.equipment', 'eq')
      .innerJoin('e.trackingType', 'tt')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere('ls.is_completed = true')
      .groupBy('e.id')
      .addGroupBy('e.name')
      .addGroupBy('eq.name')
      .addGroupBy('tt.name')
      .orderBy('COUNT(ls.id)', 'DESC');

    if (search) {
      qb.andWhere('e.name ILIKE :search', { search: `%${search}%` });
    }

    // Get total count first
    const countResult = await this.logSetRepo
      .createQueryBuilder('ls')
      .select('COUNT(DISTINCT le.exercise_id)::int', 'count')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .innerJoin('le.exercise', 'e')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .andWhere('ls.is_completed = true')
      .andWhere(search ? 'e.name ILIKE :search' : '1=1', search ? { search: `%${search}%` } : {})
      .getRawOne();

    const total = parseInt(countResult?.count ?? '0', 10);

    const rawExercises = await qb.offset(offset).limit(limit).getRawMany();

    // Fetch primary muscles for all returned exercises
    const exerciseIds = rawExercises.map((r) => r.exerciseId);
    let muscleMap: Record<number, string[]> = {};

    if (exerciseIds.length > 0) {
      const muscles = await this.exerciseRepo
        .createQueryBuilder('e')
        .select('e.id', 'exerciseId')
        .addSelect('m.name', 'muscleName')
        .innerJoin('e.exerciseMuscles', 'em')
        .innerJoin('em.muscle', 'm')
        .where('e.id IN (:...exerciseIds)', { exerciseIds })
        .andWhere('em.is_primary = true')
        .getRawMany();

      muscleMap = muscles.reduce((acc, m) => {
        if (!acc[m.exerciseId]) acc[m.exerciseId] = [];
        acc[m.exerciseId].push(m.muscleName);
        return acc;
      }, {} as Record<number, string[]>);
    }

    return {
      data: rawExercises.map((r) => ({
        exerciseId: r.exerciseId,
        exerciseName: r.exerciseName,
        equipmentName: r.equipmentName,
        trackingType: r.trackingType,
        totalSets: r.totalSets,
        totalWorkouts: r.totalWorkouts,
        primaryMuscles: muscleMap[r.exerciseId] ?? [],
      })),
      meta: { page, limit, total },
    };
  }

  async getBodyMetricProgress(
    userId: number,
    metricTypeId: number,
    from?: string,
    to?: string,
  ): Promise<IBodyMetricProgress> {
    const whereConditions: Record<string, unknown> = {
      userId,
      metricTypeId,
    };

    let dateWhere = {};
    if (from && to) {
      dateWhere = { recordedAt: Between(new Date(from), new Date(to)) };
    } else if (from) {
      dateWhere = { recordedAt: Between(new Date(from), new Date('2100-01-01')) };
    } else if (to) {
      dateWhere = { recordedAt: Between(new Date('1970-01-01'), new Date(to)) };
    }

    const metrics = await this.bodyMetricRepo.find({
      where: { ...whereConditions, ...dateWhere },
      order: { recordedAt: 'ASC' },
    });

    if (metrics.length === 0) {
      return {
        metricTypeId,
        current: null,
        min: null,
        max: null,
        change: null,
        history: [],
      };
    }

    const values = metrics.map((m) => Number(m.value));
    const first = values[0];
    const last = values[values.length - 1];

    return {
      metricTypeId,
      current: last,
      min: Math.min(...values),
      max: Math.max(...values),
      change: parseFloat((last - first).toFixed(2)),
      history: metrics.map((m) => ({
        date: m.recordedAt.toISOString().split('T')[0],
        value: Number(m.value),
      })),
    };
  }

  async getSummary(userId: number): Promise<IStatisticsSummary> {
    // Total workouts
    const totalWorkouts = await this.workoutRepo.count({
      where: { userId, status: WorkoutStatus.COMPLETED },
    });

    // Total exercises performed
    const totalExercisesResult = await this.logExerciseRepo
      .createQueryBuilder('le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getCount();

    // Total sets
    const totalSets = await this.logSetRepo
      .createQueryBuilder('ls')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getCount();

    // Total weight lifted
    const totalWeightResult = await this.logSetRepo
      .createQueryBuilder('ls')
      .select('COALESCE(SUM(ls.weight * ls.reps), 0)', 'total')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .getRawOne();

    // Current streak (consecutive days with completed workouts)
    const currentStreak = await this.calculateStreak(userId);

    return {
      totalWorkouts,
      totalExercisesPerformed: totalExercisesResult,
      totalSets,
      totalWeightLifted: parseFloat(totalWeightResult?.total ?? '0'),
      currentStreak,
    };
  }

  private async calculateStreak(userId: number): Promise<number> {
    // Get distinct workout dates ordered descending
    const dates = await this.workoutRepo
      .createQueryBuilder('w')
      .select('w.started_at::date', 'workoutDate')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
      .groupBy('w.started_at::date')
      .orderBy('w.started_at::date', 'DESC')
      .getRawMany();

    if (dates.length === 0) return 0;

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i].workoutDate);
      const previous = new Date(dates[i + 1].workoutDate);
      const diffDays =
        (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private buildDateFilter(
    from?: string,
    to?: string,
    column = 'w.started_at',
  ): { clause: string; params: Record<string, Date> } {
    const parts: string[] = [];
    const params: Record<string, Date> = {};

    if (from) {
      parts.push(`${column} >= :fromDate`);
      params.fromDate = new Date(from);
    }
    if (to) {
      parts.push(`${column} <= :toDate`);
      params.toDate = new Date(to);
    }

    return {
      clause: parts.length > 0 ? parts.join(' AND ') : '1=1',
      params,
    };
  }
}
