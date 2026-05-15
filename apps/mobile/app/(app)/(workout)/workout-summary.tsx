import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { MetricCard } from '@/components/ui/MetricCard/MetricCard';
import { LoadingScreen } from '@/components/ui/LoadingScreen/LoadingScreen';
import { ExerciseSummaryCard } from '@/features/workout/components';
import { useWorkoutSummaryScreen } from '@/features/workout/hooks/useWorkoutSummaryScreen';

const FEELING_EMOJIS = ['😫', '😐', '😊', '😄', '🔥'];

export default function WorkoutSummaryScreen() {
  const {
    workout,
    isLoading,
    exercises,
    completedSets,
    totalVolume,
    duration,
    insets,
    router,
  } = useWorkoutSummaryScreen();

  if (isLoading) {
    return <LoadingScreen paddingTop={insets.top} />;
  }

  if (!workout) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Workout not found</Text>
        <Button title="Go Back" variant="secondary" onPress={() => router.back()} style={styles.goBackBtn} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader title="Summary" onBack={() => router.back()} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.workoutName}>{workout.name}</Text>
        <Text style={styles.workoutDate}>
          {new Date(workout.started_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>

        <View style={styles.metricsGrid}>
          <MetricCard icon="⏱️" value={duration} label="Duration" />
          <MetricCard icon="🏋️" value={`${totalVolume.toLocaleString()} kg`} label="Volume" />
          <MetricCard icon="💪" value={String(exercises.length)} label="Exercises" />
          <MetricCard icon="✅" value={String(completedSets)} label="Sets" />
        </View>

        {(workout.rpe || workout.feelingScore || workout.calories || workout.avgHeartRate) && (
          <View style={styles.optionalMetrics}>
            {workout.rpe != null && (
              <View style={styles.optionalItem}>
                <Text style={styles.optionalLabel}>RPE</Text>
                <Text style={styles.optionalValue}>{workout.rpe}/10</Text>
              </View>
            )}
            {workout.feelingScore != null && (
              <View style={styles.optionalItem}>
                <Text style={styles.optionalLabel}>Feeling</Text>
                <Text style={styles.optionalValueLarge}>
                  {FEELING_EMOJIS[workout.feelingScore - 1] ?? '😐'}
                </Text>
              </View>
            )}
            {workout.calories != null && (
              <View style={styles.optionalItem}>
                <Text style={styles.optionalLabel}>Calories</Text>
                <Text style={styles.optionalValue}>{workout.calories} kcal</Text>
              </View>
            )}
            {workout.avgHeartRate != null && (
              <View style={styles.optionalItem}>
                <Text style={styles.optionalLabel}>Heart Rate</Text>
                <Text style={styles.optionalValue}>
                  {workout.avgHeartRate}
                  {workout.maxHeartRate ? ` / ${workout.maxHeartRate}` : ''} bpm
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Exercises</Text>
        {exercises.map((ex) => (
          <ExerciseSummaryCard key={ex.id} exercise={ex} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  goBackBtn: {
    marginTop: 16,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  workoutName: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  optionalMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionalItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  optionalLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  optionalValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  optionalValueLarge: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
});
