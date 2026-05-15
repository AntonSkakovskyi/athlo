import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { LineChartBlock } from '@/components/ui/LineChartBlock/LineChartBlock';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useStatisticsScreen } from '@/features/profile/hooks/useStatisticsScreen';

export default function StatisticsScreen() {
  const {
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
    perfChartData,
    bodyChartData,
    bodyMetricNames,
    currentPerfMetric,
    selectedMetricTypeId,
    formatPerformanceValue,
    PERIOD_LABELS,
    PERFORMANCE_METRICS,
  } = useStatisticsScreen();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Statistics" onBack={() => router.back()} />

      <View style={styles.tabSection}>
        <SegmentControl
          segments={['Performance', 'Body Metrics']}
          activeIndex={tabIndex}
          onSelect={setTabIndex}
        />
      </View>

      {tabIndex === 0 ? (
        statsLoading ? (
          <Spinner style={styles.loader} />
        ) : !stats ? (
          <EmptyState title="No workout data yet" description="Complete workouts to see statistics" />
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
        <>
          {bodyMetricNames.length === 0 ? (
            <EmptyState title="No metric types available" description="Body metric types will appear here" />
          ) : (
            <LineChartBlock
              metricLabel={bodyMetricNames[selectedMetricTypeIndex] ?? ''}
              data={bodyChartData}
              period={bodyPeriod}
              onPeriodChange={setBodyPeriod}
              periods={PERIOD_LABELS}
              emptyText={
                bodyChartData.length === 0 && selectedMetricTypeId
                  ? 'No measurements recorded for this metric'
                  : 'Select a metric to view progress'
              }
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
  tabSection: { marginBottom: spacing.xl },
  loader: { marginVertical: spacing['4xl'] },
});
