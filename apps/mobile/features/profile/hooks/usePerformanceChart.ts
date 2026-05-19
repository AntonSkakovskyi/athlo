import { useState, useMemo } from 'react';
import type { IWorkoutChartPoint } from '@athlo/shared';
import { useWorkoutStatistics } from '@/hooks/api/useStatisticsAPI';
import { getScopeRange } from '@/utils/date';
import { aggregateByWeek, aggregateByMonth, AggregatedPoint } from '../utils/chart-aggregation';

type Scope = '3m' | '1y' | 'all';

const SCOPE_MAP: Record<string, Scope> = {
  '3 Months': '3m',
  '1 Year': '1y',
  'All Time': 'all',
};

export const PERIOD_LABELS = ['3 Months', '1 Year', 'All Time'];
export const PERFORMANCE_METRICS = ['Sets', 'Duration', 'Volume', 'Reps'];

function getPerformanceValue(point: IWorkoutChartPoint, metricName: string): number {
  switch (metricName) {
    case 'Sets':
      return point.totalSets;
    case 'Duration':
      return point.totalDurationMinutes;
    case 'Volume':
      return point.totalVolume;
    case 'Reps':
      return point.totalReps;
    default:
      return 0;
  }
}

export function formatPerformanceValue(value: number, metricName: string): string {
  if (metricName === 'Duration') {
    return `${Math.round(value)}m`;
  }
  if (metricName === 'Volume') {
    return `${Math.round(value)}kg`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

export function usePerformanceChart() {
  const [perfPeriod, setPerfPeriod] = useState('3 Months');
  const [perfMetricIndex, setPerfMetricIndex] = useState(0);

  const perfScope = SCOPE_MAP[perfPeriod] ?? '3m';
  const { from: perfFrom, to: perfTo } = getScopeRange(perfScope);
  const { data: stats, isLoading: statsLoading } = useWorkoutStatistics(perfFrom, perfTo);

  const currentPerfMetric = PERFORMANCE_METRICS[perfMetricIndex] ?? PERFORMANCE_METRICS[0];

  const aggregatedData = useMemo(() => {
    const rawData = stats?.chartData ?? [];
    if (rawData.length === 0) return [];

    const fromDate = perfFrom ? new Date(perfFrom) : new Date(rawData[0].date);
    const toDate = perfTo ? new Date(perfTo) : new Date();

    const getValue = (p: IWorkoutChartPoint) => getPerformanceValue(p, currentPerfMetric);

    if (perfScope === '3m') {
      return aggregateByWeek(rawData, fromDate, toDate, getValue);
    } else {
      return aggregateByMonth(rawData, fromDate, toDate, getValue);
    }
  }, [stats, currentPerfMetric, perfScope, perfFrom, perfTo]);

  return {
    perfPeriod,
    setPerfPeriod,
    perfMetricIndex,
    setPerfMetricIndex,
    statsLoading,
    aggregatedData,
    currentPerfMetric,
    formatPerformanceValue: (v: number) => formatPerformanceValue(v, currentPerfMetric),
    PERIOD_LABELS,
    PERFORMANCE_METRICS,
  };
}
