import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IWorkoutChartPoint } from '@athlo/shared';
import { colors, spacing } from '../../../constants/theme';
import { useWorkoutStatistics } from '../../../hooks/api/useStatisticsHooks';
import { useBodyMetricProgress } from '../../../hooks/api/useStatisticsHooks';
import { useGetMetricTypes } from '../../../hooks/api/useBodyMetricHooks';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
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

const PERFORMANCE_METRICS = ['Trainings Count', 'Sets', 'Duration', 'Volume', 'Reps'];

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

function formatPerformanceValue(value: number, metricName: string): string {
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

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tabIndex, setTabIndex] = useState(0); // 0=Performance, 1=Body Metrics

  // Performance state
  const [perfPeriod, setPerfPeriod] = useState('3 Months');
  const [perfMetricIndex, setPerfMetricIndex] = useState(0);

  // Body metrics state
  const [bodyPeriod, setBodyPeriod] = useState('3 Months');
  const [selectedMetricTypeIndex, setSelectedMetricTypeIndex] = useState(0);

  // Performance data
  const perfScope = SCOPE_MAP[perfPeriod] ?? '3m';
  const { from: perfFrom, to: perfTo } = getScopeRange(perfScope);
  const { data: stats, isLoading: statsLoading } = useWorkoutStatistics(perfFrom, perfTo);

  // Body metrics data
  const { data: metricTypes } = useGetMetricTypes();
  const bodyScope = SCOPE_MAP[bodyPeriod] ?? '3m';
  const { from: bodyFrom, to: bodyTo } = getScopeRange(bodyScope);
  const selectedMetricTypeId = metricTypes?.[selectedMetricTypeIndex]?.id;
  const { data: bodyMetricData } = useBodyMetricProgress(
    selectedMetricTypeId ? String(selectedMetricTypeId) : '',
    bodyFrom,
    bodyTo,
  );

  // Performance chart data
  const currentPerfMetric = PERFORMANCE_METRICS[perfMetricIndex];
  const perfChartData = useMemo(() => {
    return (stats?.chartData ?? []).map((point) => ({
      date: point.date,
      value: getPerformanceValue(point, currentPerfMetric),
    }));
  }, [stats, currentPerfMetric]);

  // Body metric chart data
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Statistics" onBack={() => router.back()} />

      {/* Tab Selector */}
      <View style={styles.tabSection}>
        <SegmentControl
          segments={['Performance', 'Body Metrics']}
          activeIndex={tabIndex}
          onSelect={setTabIndex}
        />
      </View>

      {tabIndex === 0 ? (
        /* ───── Performance Tab ───── */
        statsLoading ? (
          <Spinner style={styles.loader} />
        ) : !stats ? (
          <EmptyState
            title="No workout data yet"
            description="Complete workouts to see statistics"
          />
        ) : (
          <LineChartBlock
            metricLabel={currentPerfMetric}
            data={perfChartData}
            period={perfPeriod}
            onPeriodChange={setPerfPeriod}
            periods={PERIOD_LABELS}
            formatValue={(v) => formatPerformanceValue(v, currentPerfMetric)}
            emptyText="No workouts in this period"
            metrics={PERFORMANCE_METRICS}
            activeMetric={perfMetricIndex}
            onMetricChange={setPerfMetricIndex}
          />
        )
      ) : (
        /* ───── Body Metrics Tab ───── */
        <>
          {bodyMetricNames.length === 0 ? (
            <EmptyState
              title="No metric types available"
              description="Body metric types will appear here"
            />
          ) : bodyChartData.length === 0 && selectedMetricTypeId ? (
            <LineChartBlock
              metricLabel={bodyMetricNames[selectedMetricTypeIndex] ?? ''}
              data={[]}
              period={bodyPeriod}
              onPeriodChange={setBodyPeriod}
              periods={PERIOD_LABELS}
              emptyText="No measurements recorded for this metric"
              metrics={bodyMetricNames}
              activeMetric={selectedMetricTypeIndex}
              onMetricChange={setSelectedMetricTypeIndex}
            />
          ) : (
            <LineChartBlock
              metricLabel={bodyMetricNames[selectedMetricTypeIndex] ?? ''}
              data={bodyChartData}
              period={bodyPeriod}
              onPeriodChange={setBodyPeriod}
              periods={PERIOD_LABELS}
              emptyText="Select a metric to view progress"
              metrics={bodyMetricNames}
              activeMetric={selectedMetricTypeIndex}
              onMetricChange={setSelectedMetricTypeIndex}
            />
          )}
        </>
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
  tabSection: {
    marginBottom: 20,
  },
  loader: {
    marginVertical: 40,
  },
});