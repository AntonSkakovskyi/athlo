import { useState, useCallback } from 'react';
import { confirmDestructive } from '@/utils/alerts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useCompleteWorkout, useDeleteWorkout } from '@/hooks/api';
import { VisibilityType } from '@athlo/shared';
import { buildFinalizedExercises } from '@/utils/workout';

export function useFinishWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { duration, volume, completedSets, totalSets } = useLocalSearchParams<{
    duration: string;
    volume: string;
    completedSets: string;
    totalSets: string;
  }>();

  const { workout, exercises, endWorkout } = useActiveWorkout();
  const completeWorkout = useCompleteWorkout();
  const deleteWorkout = useDeleteWorkout();

  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [feeling, setFeeling] = useState<number | undefined>(undefined);
  const [calories, setCalories] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [maxHr, setMaxHr] = useState('');
  const [visibility, setVisibility] = useState<VisibilityType>(VisibilityType.PUBLIC);
  const [description, setDescription] = useState('');
  const [errorToast, setErrorToast] = useState<{ title: string; description?: string } | null>(null);

  const handleFinish = useCallback(() => {
    if (!workout) return;

    const { finalizedExercises, hasEmptyCompleted } = buildFinalizedExercises(exercises);

    if (finalizedExercises.length === 0) {
      setErrorToast({
        title: 'No completed sets',
        description: 'Mark at least one set as completed to finish the workout.',
      });
      return;
    }
    if (hasEmptyCompleted) {
      setErrorToast({
        title: 'Empty completed sets',
        description: 'Go back and fill in the values for all completed sets.',
      });
      return;
    }

    completeWorkout.mutate(
      {
        id: String(workout.id),
        data: {
          rpe,
          feelingScore: feeling,
          calories: calories ? Number(calories) : undefined,
          avgHeartRate: avgHr ? Number(avgHr) : undefined,
          maxHeartRate: maxHr ? Number(maxHr) : undefined,
          visibility,
          description: description.trim() || undefined,
          finalizedExercises,
        },
      },
      {
        onSuccess: () => {
          endWorkout();
          router.replace({
            pathname: '/(app)/(workout)/workout-summary',
            params: { workoutId: String(workout.id), fromCompletion: '1' },
          });
        },
      },
    );
  }, [workout, exercises, completeWorkout, rpe, feeling, calories, avgHr, maxHr, visibility, description, endWorkout, router]);

  const handleDiscard = useCallback(() => {
    if (!workout) return;
    confirmDestructive(
      'Discard Workout',
      'All progress will be lost. This cannot be undone.',
      () => deleteWorkout.mutate(String(workout.id), { onSuccess: () => { endWorkout(); router.replace('/(app)/(workout)'); } }),
      'Discard',
      'Keep',
    );
  }, [workout, deleteWorkout, endWorkout, router]);

  return {
    duration,
    volume,
    completedSets,
    totalSets,
    workout,
    endWorkout,
    rpe,
    setRpe,
    feeling,
    setFeeling,
    calories,
    setCalories,
    avgHr,
    setAvgHr,
    maxHr,
    setMaxHr,
    visibility,
    setVisibility,
    description,
    setDescription,
    handleFinish,
    handleDiscard,
    errorToast,
    setErrorToast,
    completeWorkoutPending: completeWorkout.isPending,
    deleteWorkoutPending: deleteWorkout.isPending,
    insets,
    router,
  };
}
