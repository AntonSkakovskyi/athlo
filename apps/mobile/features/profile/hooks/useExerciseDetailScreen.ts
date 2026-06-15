import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from '@/hooks/useRouter';
import type { IExerciseProgressRecord } from '@athlo/shared';
import { TrackingType } from '@athlo/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useExerciseProgress } from '@/features/profile/hooks';
import { getScopeRange } from '@/utils/date';
import { useGetExerciseById, useUpdateExercise, useDeleteExercise } from '@/hooks/api';
import { useGetExerciseRecordHistory } from '@/hooks/api/useAchievementAPI';
import { useGetTrackingTypes, useGetMuscles, useGetEquipments } from '@/hooks/api';

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
      return ['Best Duration'];
    case 'DISTANCE_AND_TIME':
      return TIME_METRICS;
    case 'DISTANCE_ONLY':
      return ['Best Distance'];
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
    return `${Math.round(value * 10) / 10} kg`;
  }
  return String(Math.round(value));
}

export function useExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
    trackingType: string;
  }>();

  const exerciseId = params.exerciseId ?? '';

  const [periodLabel, setPeriodLabel] = useState('3 Months');
  const [metricIndex, setMetricIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  const scope = SCOPE_MAP[periodLabel] ?? '3m';
  const { from, to } = getScopeRange(scope);

  const { data: exercise } = useGetExerciseById(exerciseId);
  const { data: progress, isLoading } = useExerciseProgress(exerciseId, from, to);
  const { data: prHistory, isLoading: isLoadingPRs } = useGetExerciseRecordHistory(exerciseId);

  const trackingTypesQuery = useGetTrackingTypes();
  const musclesQuery = useGetMuscles();
  const equipmentsQuery = useGetEquipments();

  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  const isOwner = Boolean(user && exercise?.userId === user.id);

  const trackingType = (progress?.trackingType || exercise?.trackingType?.name || params.trackingType || 'WEIGHT_AND_REPS') as TrackingType;

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

  const historyRecords = useMemo(() => {
    const records = progress?.records ?? [];
    return [...records]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((record) => ({
        ...record,
        sets: (record.sets ?? []).filter((s) => s.isCompleted).map((s) => ({
          ...s,
          weight: s.weight != null ? Number(s.weight) : undefined,
          reps: s.reps != null ? Number(s.reps) : undefined,
          duration: s.duration != null ? Number(s.duration) : undefined,
          distance: s.distance != null ? Number(s.distance) : undefined,
          isPR: s.isPR,
          achievementId: s.achievementId,
          achievement: s.achievement,
        })),
      }));
  }, [progress]);

  const handleUpdate = useCallback(
    async (data: {
      name?: string;
      description?: string;
      trackingTypeId?: number;
      equipmentId?: number | null;
      muscles?: { muscleId: number; isPrimary: boolean }[];
    }) => {
      try {
        await updateExercise.mutateAsync({ id: exerciseId, data });
        setShowEditModal(false);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to update exercise';
        Alert.alert('Error', msg);
      }
    },
    [updateExercise, exerciseId],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExercise.mutateAsync(exerciseId);
              router.back();
            } catch (err: unknown) {
              const msg =
                err instanceof Error
                  ? err.message
                  : 'Failed to delete exercise';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  }, [deleteExercise, exerciseId, router]);

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
    prHistory,
    isLoading: isLoading || isLoadingPRs,
    metrics,
    currentMetric,
    chartData,
    exerciseMuscles,
    historyRecords,
    formatMetricValue,
    PERIOD_LABELS,
    trackingType,
    isOwner,
    showEditModal,
    setShowEditModal,
    updateExercise,
    deleteExercise,
    handleUpdate,
    handleDelete,
    trackingTypesQuery,
    musclesQuery,
    equipmentsQuery,
  };
}
