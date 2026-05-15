import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { IExerciseProgressRecord } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../../constants/theme';
import { useExerciseProgress } from '../../../hooks/api/useStatisticsHooks';
import { useGetExerciseById } from '../../../hooks/api/useExerciseQueries';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Tag } from '@/components/ui/Tag/Tag';
import { LineChartBlock } from '@/components/ui/LineChartBlock/LineChartBlock';
import { getScopeRange } from '../../../utils/date';
import { Spinner } from '@/components/ui/Spinner/Spinner';

type Scope = '3m' | '1y' | 'all';

const SCOPE_MAP: Record<string, Scope> = {
  '3 Months': '3m',
  '1 Year': '1y',
  'All Time': 'all',
};

const PERIOD_LABELS = ['3 Months', '1 Year', 'All Time'];

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

function formatMetricValue(value: number, metricName: string): string {
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

export default function ExerciseDetailScreen() {
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
    const ex = exercise as Record<string, unknown> | undefined;
    const muscles = (ex?.exerciseMuscles ?? []) as Array<{
      isPrimary: boolean;
      muscle: { name: string };
    }>;
    return {
      primary: muscles.filter((m) => m.isPrimary).map((m) => m.muscle?.name).filter(Boolean),
      secondary: muscles.filter((m) => !m.isPrimary).map((m) => m.muscle?.name).filter(Boolean),
    };
  }, [exercise]);

  const historyRecords = useMemo(
    () => [...(progress?.records ?? [])].reverse(),
    [progress],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={params.exerciseName ?? 'Exercise'} onBack={() => router.back()} />

      {/* Exercise Info */}
      <View style={styles.exerciseInfo}>
        <View style={styles.exerciseImagePlaceholder}>
          <Text style={styles.exerciseImageEmoji}>💪</Text>
        </View>
        <Text style={styles.exerciseName}>{params.exerciseName}</Text>
        {(exerciseMuscles.primary.length > 0 || exerciseMuscles.secondary.length > 0) && (
          <View style={styles.muscleRow}>
            {exerciseMuscles.primary.map((m) => (
              <Tag key={m} label={m} color="primary" />
            ))}
            {exerciseMuscles.secondary.map((m) => (
              <Tag key={m} label={m} />
            ))}
          </View>
        )}
      </View>

      {/* Line Chart */}
      {isLoading ? (
        <Spinner style={styles.loader} />
      ) : (
        <LineChartBlock
          metricLabel={currentMetric}
          data={chartData}
          period={periodLabel}
          onPeriodChange={setPeriodLabel}
          periods={PERIOD_LABELS}
          formatValue={(v) => formatMetricValue(v, currentMetric)}
          emptyText="Perform this exercise to see your progress"
          metrics={metrics}
          activeMetric={metricIndex}
          onMetricChange={setMetricIndex}
        />
      )}

      {/* History */}
      {historyRecords.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History</Text>
          {historyRecords.map((record, i) => (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {new Date(record.date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <View style={styles.historyMetrics}>
                {record.heaviestWeight != null && record.heaviestWeight > 0 && (
                  <Text style={styles.historyMetric}>
                    🏋️ {formatMetricValue(record.heaviestWeight, 'Heaviest Weight')}
                  </Text>
                )}
                {record.totalReps != null && record.totalReps > 0 && (
                  <Text style={styles.historyMetric}>
                    🔄 {record.totalReps} reps
                  </Text>
                )}
                {record.totalVolume != null && record.totalVolume > 0 && (
                  <Text style={styles.historyMetric}>
                    📊 {formatMetricValue(record.totalVolume, 'Total Volume')}
                  </Text>
                )}
                {record.bestDuration != null && record.bestDuration > 0 && (
                  <Text style={styles.historyMetric}>
                    ⏱️ {formatMetricValue(record.bestDuration, 'Best Duration')}
                  </Text>
                )}
                {record.bestDistance != null && record.bestDistance > 0 && (
                  <Text style={styles.historyMetric}>
                    📏 {formatMetricValue(record.bestDistance, 'Best Distance')}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  exerciseInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseImageEmoji: {
    fontSize: 32,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  loader: {
    marginVertical: 40,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  historyMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  historyMetric: {
    fontSize: 14,
    color: colors.text,
  },
});