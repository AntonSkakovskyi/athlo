import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IWorkoutChartPoint } from '@athlo/shared';
import { useWorkoutStatistics, useBodyMetricProgress, useGetMetricTypes } from '@/features/profile/hooks';
import { getScopeRange } from '@/utils/date';

type Scope = '3m' | '1y' | 'all';

const SCOPE_MAP: Record<string, Scope> = {
  '3 Months': '3m',
  '1 Year': '1y',
  'All Time': 'all',
};

export const PERIOD_LABELS = ['3 Months', '1 Year', 'All Time'];
export const PERFORMANCE_METRICS = ['Trainings Count', 'Sets', 'Duration', 'Volume', 'Reps'];

function getPerformanceValue(point: IWorkoutChartPoint, metricName: string): number {
  switch (metricName) {
    case 'Trainings Count':
      return point.workoutsCount;
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
    return `${Math.round(value)} min`;
  }
  if (metricName === 'Volume') {
    return value >= 1000
      ? `${(value / 1000).toFixed(1)}t`
      : `${Math.round(value)} kg`;
  }
  return String(Math.round(value));
}

export function useStatisticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tabIndex, setTabIndex] = useState(0);
  const [perfPeriod, setPerfPeriod] = useState('3 Months');
  const [perfMetricIndex, setPerfMetricIndex] = useState(0);
  const [bodyPeriod, setBodyPeriod] = useState('3 Months');
  const [selectedMetricTypeIndex, setSelectedMetricTypeIndex] = useState(0);

  const perfScope = SCOPE_MAP[perfPeriod] ?? '3m';
  const { from: perfFrom, to: perfTo } = getScopeRange(perfScope);
  const { data: stats, isLoading: statsLoading } = useWorkoutStatistics(perfFrom, perfTo);

  const { data: metricTypes } = useGetMetricTypes();
  const bodyScope = SCOPE_MAP[bodyPeriod] ?? '3m';
  const { from: bodyFrom, to: bodyTo } = getScopeRange(bodyScope);
  const selectedMetricTypeId = metricTypes?.[selectedMetricTypeIndex]?.id;
  const { data: bodyMetricData } = useBodyMetricProgress(
    selectedMetricTypeId ? String(selectedMetricTypeId) : '',
    bodyFrom,
    bodyTo,
  );

  const currentPerfMetric = PERFORMANCE_METRICS[perfMetricIndex] ?? PERFORMANCE_METRICS[0];

  const perfChartData = useMemo(() => {
    return (stats?.chartData ?? []).map((point) => ({
      date: point.date,
      value: getPerformanceValue(point, currentPerfMetric),
    }));
  }, [stats, currentPerfMetric]);

  const bodyChartData = useMemo(() => {
    return (bodyMetricData?.history ?? []).map((h) => ({
      date: h.date,
      value: h.value,
    }));
  }, [bodyMetricData]);

  const bodyMetricNames = useMemo(
    () => (metricTypes ?? []).map((mt) => mt.name),
    [metricTypes],
  );

  return {
    insets,
    router,
    tabIndex,
    setTabIndex,
    perfPeriod,
    setPerfPeriod,
    perfMetricIndex,
    setPerfMetricIndex,
    bodyPeriod,
    setBodyPeriod,
    selectedMetricTypeIndex,
    setSelectedMetricTypeIndex,
    stats,
    statsLoading,
    metricTypes,
    bodyMetricData,
    perfChartData,
    bodyChartData,
    bodyMetricNames,
    currentPerfMetric,
    selectedMetricTypeId,
    formatPerformanceValue,
    PERIOD_LABELS,
    PERFORMANCE_METRICS,
  };
}
