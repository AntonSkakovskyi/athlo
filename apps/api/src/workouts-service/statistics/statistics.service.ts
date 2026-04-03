import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkoutEntity } from '../entities/workout.entity';
import { LogExerciseEntity } from '../entities/log-exercise.entity';
import { LogSetEntity } from '../entities/log-set.entity';
import { BodyMetricEntity } from '../../user-service/body-metrics/entities/body-metric.entity';
import { WorkoutStatus } from '@athlo/shared';
import type {
  IWorkoutStatistics,
  IExerciseProgress,
  IBodyMetricProgress,
  IStatisticsSummary,
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

    // Determine the metric to track based on tracking type
    let bestValueExpression: string;
    switch (trackingType) {
      case 'REPS_ONLY':
        bestValueExpression = 'MAX(ls.reps)';
        break;
      case 'TIME_BASED':
        bestValueExpression = 'MAX(ls.duration)';
        break;
      case 'WEIGHT_AND_REPS':
      default:
        bestValueExpression = 'MAX(ls.weight)';
        break;
    }

    const records = await this.logSetRepo
      .createQueryBuilder('ls')
      .select('w.id', 'workoutId')
      .addSelect('w.started_at::date::text', 'date')
      .addSelect(bestValueExpression, 'bestValue')
      .innerJoin('ls.logExercise', 'le')
      .innerJoin('le.workout', 'w')
      .where('w.user_id = :userId', { userId })
      .andWhere('le.exercise_id = :exerciseId', { exerciseId })
      .andWhere('w.status = :status', { status: WorkoutStatus.COMPLETED })
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
        bestValue: parseFloat(r.bestValue),
        workoutId: r.workoutId,
      })),
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
