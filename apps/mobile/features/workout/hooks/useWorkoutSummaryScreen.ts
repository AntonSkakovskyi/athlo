import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatDuration } from '@/utils/workout';
import { useGetWorkoutById } from '@/hooks/api';

export function useWorkoutSummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  const { data: workout, isLoading } = useGetWorkoutById(workoutId ?? '');

  const exercises = useMemo(
    () => workout?.logExercises?.sort((a, b) => a.order - b.order) ?? [],
    [workout],
  );

  const completedSets = useMemo(
    () =>
      exercises.reduce(
        (acc, ex) => acc + (ex.sets?.filter((s) => s.isCompleted).length ?? 0),
        0,
      ),
    [exercises],
  );

  const totalVolume = useMemo(
    () =>
      exercises.reduce(
        (acc, ex) =>
          acc +
          (ex.sets
            ?.filter((s) => s.isCompleted)
            .reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0) ?? 0),
        0,
      ),
    [exercises],
  );

  const duration = workout ? formatDuration(workout.started_at, workout.ended_at) : '—';

  return {
    workout,
    isLoading,
    exercises,
    completedSets,
    totalVolume,
    duration,
    insets,
    router,
    workoutId,
  };
}
