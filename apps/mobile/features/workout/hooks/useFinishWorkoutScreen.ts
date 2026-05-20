import { useState, useCallback } from 'react';
import { confirmDestructive } from '@/utils/alerts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useCompleteWorkout, useDeleteWorkout } from '@/hooks/api';
import { VisibilityType } from '@athlo/shared';

export function useFinishWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { duration, volume, completedSets, totalSets } = useLocalSearchParams<{
    duration: string;
    volume: string;
    completedSets: string;
    totalSets: string;
  }>();

  const { workout, endWorkout } = useActiveWorkout();
  const completeWorkout = useCompleteWorkout();
  const deleteWorkout = useDeleteWorkout();

  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [feeling, setFeeling] = useState<number | undefined>(undefined);
  const [calories, setCalories] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [maxHr, setMaxHr] = useState('');
  const [visibility, setVisibility] = useState<VisibilityType>(VisibilityType.PUBLIC);
  const [description, setDescription] = useState('');

  const handleFinish = useCallback(() => {
    if (!workout) return;
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
        },
      },
      {
        onSuccess: () => {
          endWorkout();
          router.replace({
            pathname: '/(app)/(workout)/workout-summary',
            params: { workoutId: String(workout.id) },
          });
        },
      },
    );
  }, [workout, completeWorkout, rpe, feeling, calories, avgHr, maxHr, visibility, description, endWorkout, router]);

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
    completeWorkoutPending: completeWorkout.isPending,
    deleteWorkoutPending: deleteWorkout.isPending,
    insets,
    router,
  };
}
