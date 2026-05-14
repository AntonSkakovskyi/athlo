import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, borderRadius, spacing, fontSize } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { MetricCard } from '../../../components/ui/MetricCard';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { ExerciseSummaryCard } from '../../../components/workout/ExerciseSummaryCard';
import { useGetWorkoutById } from '../../../hooks/api/useWorkoutHooks';
import { formatDuration } from '../../../utils/workout';

interface LogSetData {
  id: number;
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isCompleted: boolean;
}

interface LogExerciseData {
  id: number;
  exerciseId: number;
  order: number;
  notes?: string;
  restTime?: number;
  exercise?: { name: string; trackingTypeId?: number };
  logSets?: LogSetData[];
}

interface WorkoutDetailData {
  id: number;
  name: string;
  status: string;
  started_at: string | Date;
  ended_at?: string | Date | null;
  description?: string | null;
  calories?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  rpe?: number | null;
  feelingScore?: number | null;
  logExercises?: LogExerciseData[];
}

const FEELING_EMOJIS = ['😫', '😐', '😊', '😄', '🔥'];

export default function WorkoutSummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  const { data, isLoading } = useGetWorkoutById(workoutId ?? '');
  const workout = data as WorkoutDetailData | undefined;

  if (isLoading) {
    return <LoadingScreen paddingTop={insets.top} />;
  }

  if (!workout) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Workout not found</Text>
        <Button title="Go Back" variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const exercises = workout.logExercises?.sort((a, b) => a.order - b.order) ?? [];
  const completedSets = exercises.reduce(
    (acc, ex) => acc + (ex.logSets?.filter((s) => s.isCompleted).length ?? 0),
    0,
  );
  const totalVolume = exercises.reduce(
    (acc, ex) =>
      acc +
      (ex.logSets
        ?.filter((s) => s.isCompleted)
        .reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0) ?? 0),
    0,
  );
  const duration = formatDuration(workout.started_at, workout.ended_at);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <ScreenHeader title="Summary" onBack={() => router.back()} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Title & Date */}
        <Text style={styles.workoutName}>{workout.name}</Text>
        <Text style={styles.workoutDate}>
          {new Date(workout.started_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>

        {/* Overview Cards */}
        <View style={styles.metricsGrid}>
          <MetricCard icon="⏱️" value={duration} label="Duration" />
          <MetricCard icon="🏋️" value={`${totalVolume.toLocaleString()} kg`} label="Volume" />
          <MetricCard icon="💪" value={String(exercises.length)} label="Exercises" />
          <MetricCard icon="✅" value={String(completedSets)} label="Sets" />
        </View>

        {/* Optional Metrics */}
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

        {/* Exercises List */}
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
