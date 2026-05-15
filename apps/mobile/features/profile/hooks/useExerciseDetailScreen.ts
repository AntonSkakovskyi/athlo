import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { IExerciseProgressRecord } from '@athlo/shared';
import { useExerciseProgress } from '@/features/profile/hooks';
import { getScopeRange } from '@/utils/date';
import { useGetExerciseById } from '@/hooks/api';

type Scope = '3m' | '1y' | 'all';

const SCOPE_MAP: Record<string, Scope> = {
  '3 Months': '3m',
  '1 Year': '1y',
  'All Time': 'all',
};

export const PERIOD_LABELS = ['3 Months', '1 Year', 'All Time'];

const WEIGHT_METRICS = ['Heaviest Weight', 'Best Set Volume', 'Total Volume', 'Total Reps'];
const TIME_METRICS = ['Best Duration', 'Best Distance'];
const REPS_METRICS = ['Total Reps'];

function getMetricsForType(trackingType: string): string[] {
  switch (trackingType) {
    case 'REPS_ONLY':
      return REPS_METRICS;
    case 'TIME_BASED':
      return TIME_METRICS;
    default:
      return WEIGHT_METRICS;
  }
}

function getMetricValue(record: IExerciseProgressRecord, metricName: string): number {
  switch (metricName) {
    case 'Heaviest Weight':
      return record.heaviestWeight ?? 0;
    case 'Best Set Volume':
      return record.bestSetVolume ?? 0;
    case 'Total Volume':
      return record.totalVolume ?? 0;
    case 'Total Reps':
      return record.totalReps ?? 0;
    case 'Best Duration':
      return record.bestDuration ?? 0;
    case 'Best Distance':
      return record.bestDistance ?? 0;
    default:
      return 0;
  }
}

export function formatMetricValue(value: number, metricName: string): string {
  if (metricName.includes('Duration')) {
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }
  if (metricName.includes('Distance')) {
    return `${Math.round(value * 10) / 10} m`;
  }
  if (metricName.includes('Weight') || metricName.includes('Volume')) {
    return value >= 1000
      ? `${(value / 1000).toFixed(1)}t`
      : `${Math.round(value * 10) / 10} kg`;
  }
  return String(Math.round(value));
}

export function useExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
    trackingType: string;
  }>();

  const exerciseId = params.exerciseId ?? '';
  const trackingType = params.trackingType ?? 'WEIGHT_AND_REPS';

  const [periodLabel, setPeriodLabel] = useState('3 Months');
  const [metricIndex, setMetricIndex] = useState(0);

  const scope = SCOPE_MAP[periodLabel] ?? '3m';
  const { from, to } = getScopeRange(scope);

  const { data: exercise } = useGetExerciseById(exerciseId);
  const { data: progress, isLoading } = useExerciseProgress(exerciseId, from, to);

  const metrics = useMemo(() => getMetricsForType(trackingType), [trackingType]);
  const currentMetric = metrics[metricIndex] ?? metrics[0];

  const chartData = useMemo(() => {
    return (progress?.records ?? []).map((r) => ({
      date: r.date,
      value: getMetricValue(r, currentMetric),
    }));
  }, [progress, currentMetric]);

  const exerciseMuscles = useMemo(() => {
    const muscles = exercise?.exerciseMuscles ?? [];
    return {
      primary: muscles
        .filter((m) => m.isPrimary)
        .map((m) => m.muscle?.name)
        .filter((n): n is string => Boolean(n)),
      secondary: muscles
        .filter((m) => !m.isPrimary)
        .map((m) => m.muscle?.name)
        .filter((n): n is string => Boolean(n)),
    };
  }, [exercise]);

  const historyRecords = useMemo(
    () => [...(progress?.records ?? [])].reverse(),
    [progress],
  );

  return {
    insets,
    router,
    params,
    periodLabel,
    setPeriodLabel,
    metricIndex,
    setMetricIndex,
    scope,
    from,
    to,
    exercise,
    progress,
    isLoading,
    metrics,
    currentMetric,
    chartData,
    exerciseMuscles,
    historyRecords,
    formatMetricValue,
    PERIOD_LABELS,
  };
}
