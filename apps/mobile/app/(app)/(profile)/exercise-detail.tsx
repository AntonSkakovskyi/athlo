import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { Tag } from '@/components/ui/Tag/Tag';
import { LineChartBlock } from '@/components/ui/LineChartBlock/LineChartBlock';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Card } from '@/components/ui/Card/Card';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { ExerciseLogCard } from '@/features/workout/components/ExerciseLogCard/ExerciseLogCard';
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
    progress,
    prHistory,
    isLoading,
    metrics,
    currentMetric,
    chartData,
    exerciseMuscles,
    historyRecords,
    formatMetricValue,
    PERIOD_LABELS,
    trackingType,
  } = useExerciseDetailScreen();

  const renderHeader = () => {
    // Group PR history by metricType to find the latest
    const currentPRs = (prHistory ?? []).reduce((acc, curr) => {
      if (!acc[curr.metricType] || new Date(curr.createdAt) > new Date(acc[curr.metricType].createdAt)) {
        acc[curr.metricType] = curr;
      }
      return acc;
    }, {} as Record<string, any>);

    return (
      <View style={styles.headerContent}>
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

        {Object.keys(currentPRs).length > 0 && (
          <View style={styles.prsContainer}>
            <Text style={styles.prsTitle}>Personal Records</Text>
            <View style={styles.prsRow}>
              {Object.values(currentPRs).map((pr: any) => (
                <Card key={pr.metricType} style={styles.prCard}>
                  <Text style={styles.prTrophy}>🏆</Text>
                  <Text style={styles.prMetricType}>{pr.metricType}</Text>
                  <Text style={styles.prValue}>
                    {pr.metricType === 'WEIGHT' || pr.metricType === '1RM' ? `${Math.round(pr.value * 10) / 10} kg` : 
                     pr.metricType === 'VOLUME' ? `${Math.round(pr.value)} kg` : 
                     pr.metricType === 'DURATION' ? `${Math.floor(pr.value / 60)}:${String(pr.value % 60).padStart(2, '0')}` : 
                     pr.value}
                  </Text>
                </Card>
              ))}
            </View>
          </View>
        )}

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
          <Text style={styles.historyTitle}>History</Text>
        )}
      </View>
    );
  };

  return (
    <InfiniteList
      data={historyRecords}
      keyExtractor={(item) => String(item.workoutId)}
      renderItem={({ item }) => (
        <Pressable 
          style={styles.historyCardWrapper}
          onPress={() => router.push({
            pathname: '/(app)/(workout)/workout-summary',
            params: { workoutId: String(item.workoutId) }
          })}
        >
          <Text style={styles.historyDate}>
            {new Date(item.date).toLocaleDateString('en-US', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Text>
          <ExerciseLogCard
            exerciseName={params.exerciseName ?? ''}
            trackingType={trackingType}
            mode="summary"
            isEditing={false}
            sets={item.sets ?? []}
            showNotes={false}
            onUpdateSet={() => {}}
          />
        </Pressable>
      )}
      ListHeaderComponent={renderHeader()}
      contentContainerStyle={[
        styles.listContent,
        { paddingTop: insets.top + 8, paddingBottom: 100 }
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    marginBottom: spacing.md,
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
  prsContainer: { marginBottom: spacing.lg },
  prsTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  prsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  prCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: spacing.md },
  prTrophy: { fontSize: 24, marginBottom: 4 },
  prMetricType: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 2, textTransform: 'uppercase' },
  prValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  loader: { marginVertical: 40 },
  historyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: 12 },
  historyCardWrapper: {
    marginBottom: spacing.sm,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
});
