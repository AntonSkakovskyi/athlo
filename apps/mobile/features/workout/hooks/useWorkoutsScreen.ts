import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WorkoutStatus } from '@athlo/shared';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useCreateWorkout, useGetMyTemplates, useGetWorkouts, useStartFromTemplate } from '@/hooks/api';

export function useWorkoutsScreen() {
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

  const templateItems = useMemo(
    () => (templatesQuery.data ?? []).slice(0, 5),
    [templatesQuery.data],
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

  return {
    completedWorkouts,
    templateItems,
    workoutsQuery,
    templatesQuery,
    handleEmptyWorkout,
    handleStartFromTemplate,
    insets,
    router,
  };
}
