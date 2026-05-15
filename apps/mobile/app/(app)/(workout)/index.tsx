import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WorkoutStatus } from '@athlo/shared';
import { colors, spacing } from '../../../constants/theme';
import { useGetWorkouts, useCreateWorkout } from '../../../hooks/api/useWorkoutHooks';
import { useGetMyTemplates, useStartFromTemplate } from '../../../hooks/api/useTemplateHooks';
import { useActiveWorkout } from '../../../contexts/ActiveWorkoutContext';
import { TemplateCard } from '../../../components/workout/TemplateCard';
import type { IWorkoutWithRelations } from '@athlo/shared';
import { WorkoutHistoryList } from '../../../components/workout/WorkoutHistoryList';
import { QuickActionCard } from '../../../components/workout/QuickActionCard';
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';

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
          router.push('/(app)/(workout)/active-workout');
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
            router.push('/(app)/(workout)/active-workout');
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
        <QuickActionCard
          icon="⚡"
          title="Empty Workout"
          description="Start from scratch"
          onPress={handleEmptyWorkout}
        />
        <QuickActionCard
          icon="📋"
          title="From Template"
          description="Use a saved plan"
          onPress={() => router.push('/(app)/(workout)/templates')}
        />
      </View>

      {/* My Templates */}
      <View style={styles.section}>
        <SectionHeader
          title="My Templates"
          actionLabel="See All"
          onAction={() => router.push('/(app)/(workout)/templates')}
        />

        {templatesQuery.isLoading ? (
          <Spinner style={styles.loader} />
        ) : !templateItems.length ? (
          <EmptyState
            title="No templates yet"
            description="Create your first workout template"
            actionLabel="Browse Templates"
            onAction={() => router.push('/(app)/(workout)/templates')}
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
                  onPress={() => router.push(`/(app)/(workout)/template/${item.id}`)}
                  onStart={() => handleStartFromTemplate(item.id)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Workout History */}
      <View style={styles.section}>
        <SectionHeader
          title="Recent Workouts"
        />
        <WorkoutHistoryList
          workouts={completedWorkouts.slice(0, 10) as IWorkoutWithRelations[]}
          isLoading={workoutsQuery.isLoading}
          onWorkoutPress={(id) =>
            router.push({ pathname: '/(app)/(workout)/workout-summary', params: { workoutId: String(id) } })
          }
          emptyTitle="No workouts yet"
          emptyDescription="Start your first workout to see your history"
          emptyActionLabel="Start Workout"
          onEmptyAction={handleEmptyWorkout}
        />
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  templateList: {
    paddingRight: 16,
    gap: 12,
  },
  templateCardWrapper: {
    width: 260,
    height: 160,
  },
  loader: {
    marginVertical: 20,
  },
});
