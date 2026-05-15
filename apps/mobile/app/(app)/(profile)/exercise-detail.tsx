import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { Tag } from '@/components/ui/Tag/Tag';
import { LineChartBlock } from '@/components/ui/LineChartBlock/LineChartBlock';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useExerciseDetailScreen } from '@/features/profile/hooks/useExerciseDetailScreen';

export default function ExerciseDetailScreen() {
  const {
    insets,
    router,
    params,
    periodLabel,
    setPeriodLabel,
    metricIndex,
    setMetricIndex,
    isLoading,
    metrics,
    currentMetric,
    chartData,
    exerciseMuscles,
    historyRecords,
    formatMetricValue,
    PERIOD_LABELS,
  } = useExerciseDetailScreen();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title={params.exerciseName ?? 'Exercise'} onBack={() => router.back()} />

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

      {historyRecords.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History</Text>
          {historyRecords.map((record, i) => (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {new Date(record.date).toLocaleDateString('en-US', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
              <View style={styles.historyMetrics}>
                {record.heaviestWeight != null && record.heaviestWeight > 0 && (
                  <Text style={styles.historyMetric}>
                    🏋️ {formatMetricValue(record.heaviestWeight, 'Heaviest Weight')}
                  </Text>
                )}
                {record.totalReps != null && record.totalReps > 0 && (
                  <Text style={styles.historyMetric}>🔄 {record.totalReps} reps</Text>
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
  exerciseInfo: { alignItems: 'center', marginBottom: 20 },
  exerciseImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseImageEmoji: { fontSize: 32 },
  exerciseName: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  loader: { marginVertical: 40 },
  historySection: { marginTop: 8 },
  historyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  historyDate: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  historyMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  historyMetric: { fontSize: 14, color: colors.text },
});
