import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WorkoutStatus } from '@athlo/shared';
import type { IWorkout } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../constants/theme';
import { useGetWorkouts, useCreateWorkout } from '../../hooks/api/useWorkoutHooks';
import { useGetMyTemplates, useStartFromTemplate } from '../../hooks/api/useTemplateHooks';
import { useActiveWorkout } from '../../contexts/ActiveWorkoutContext';
import { TemplateCard } from '../../components/workout/TemplateCard';
import { WorkoutHistoryCard } from '../../components/workout/WorkoutHistoryCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDuration, formatDate } from '../../utils/workout';

interface WorkoutWithRelations extends IWorkout {
  logExercises?: Array<{
    logSets?: Array<{ weight?: number; reps?: number; isCompleted?: boolean }>;
  }>;
}

function computeVolume(workout: WorkoutWithRelations): number {
  return (
    workout.logExercises?.reduce(
      (acc, ex) =>
        acc +
        (ex.logSets?.reduce(
          (sum, s) => (s.isCompleted ? sum + (s.weight ?? 0) * (s.reps ?? 0) : sum),
          0,
        ) ?? 0),
      0,
    ) ?? 0
  );
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startWorkout, isActive } = useActiveWorkout();

  const workoutsQuery = useGetWorkouts();
  const templatesQuery = useGetMyTemplates();
  const createWorkout = useCreateWorkout();
  const startFromTemplate = useStartFromTemplate();

  const completedWorkouts = useMemo(
    () => (workoutsQuery.data ?? []).filter((w) => w.status === WorkoutStatus.COMPLETED),
    [workoutsQuery.data],
  );

  const handleEmptyWorkout = useCallback(() => {
    if (isActive) {
      Alert.alert('Active Workout', 'You already have an active workout. Finish it first.');
      return;
    }
    createWorkout.mutate(
      { name: 'Quick Workout' },
      {
        onSuccess: (workout) => {
          startWorkout(workout, []);
          router.push('/(app)/active-workout');
        },
      },
    );
  }, [isActive, createWorkout, startWorkout, router]);

  const handleStartFromTemplate = useCallback(
    (templateId: number) => {
      if (isActive) {
        Alert.alert('Active Workout', 'You already have an active workout. Finish it first.');
        return;
      }
      startFromTemplate.mutate(String(templateId), {
        onSuccess: (workout) => {
          if (workout) {
            startWorkout(workout, []);
            router.push('/(app)/active-workout');
          }
        },
      });
    },
    [isActive, startFromTemplate, startWorkout, router],
  );

  const templateItems = useMemo(
    () => (templatesQuery.data ?? []).slice(0, 5),
    [templatesQuery.data],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.screenTitle}>Workouts</Text>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickCard}
          onPress={handleEmptyWorkout}
        >
          <Text style={styles.quickIcon}>⚡</Text>
          <Text style={styles.quickLabel}>Empty Workout</Text>
          <Text style={styles.quickDesc}>Start from scratch</Text>
        </Pressable>

        <Pressable
          style={styles.quickCard}
          onPress={() => router.push('/(app)/templates')}
        >
          <Text style={styles.quickIcon}>📋</Text>
          <Text style={styles.quickLabel}>From Template</Text>
          <Text style={styles.quickDesc}>Use a saved plan</Text>
        </Pressable>
      </View>

      {/* My Templates */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Templates</Text>
          <Pressable onPress={() => router.push('/(app)/templates')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {templatesQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : !templateItems.length ? (
          <EmptyState
            title="No templates yet"
            description="Create your first workout template"
            actionLabel="Browse Templates"
            onAction={() => router.push('/(app)/templates')}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateList}
          >
            {templateItems.map((item) => (
              <View key={item.id} style={styles.templateCardWrapper}>
                <TemplateCard
                  name={item.name}
                  description={item.description}
                  variant="my"
                  onPress={() => router.push(`/(app)/template/${item.id}`)}
                  onStart={() => handleStartFromTemplate(item.id)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Workout History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>

        {workoutsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : !completedWorkouts.length ? (
          <EmptyState
            title="No workouts yet"
            description="Start your first workout to see your history"
            actionLabel="Start Workout"
            onAction={handleEmptyWorkout}
          />
        ) : (
          completedWorkouts.slice(0, 10).map((w) => {
            const wRel = w as WorkoutWithRelations;
            return (
              <WorkoutHistoryCard
                key={w.id}
                name={w.name}
                date={formatDate(w.started_at)}
                duration={formatDuration(w.started_at, w.ended_at)}
                volume={computeVolume(wRel)}
                exerciseCount={wRel.logExercises?.length ?? 0}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  quickDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  templateList: {
    paddingRight: 16,
    gap: 12,
  },
  templateCardWrapper: {
    width: 260,
  },
  loader: {
    marginVertical: 20,
  },
});
