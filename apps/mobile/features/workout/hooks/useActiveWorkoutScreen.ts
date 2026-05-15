import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { formatElapsed, getTrackingType } from '@/utils/workout';
import { useDeleteWorkout, useGetBatchLastPerformance, useGetWorkoutById, useUpdateWorkout } from '@/hooks/api';

export function useActiveWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    workout,
    exercises,
    isActive,
    totalVolume,
    completedSets,
    totalSets,
    addExercise,
    updateExercise,
    addSet,
    updateSet,
    toggleSetComplete,
    endWorkout,
  } = useActiveWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [editName, setEditName] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(60);

  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkout = useDeleteWorkout();

  const workoutQuery = useGetWorkoutById(workout?.id ? String(workout.id) : '');

  const exerciseIds = useMemo(
    () =>
      workoutQuery.data?.logExercises
        ?.map((ex) => ex.exerciseId)
        .filter((id): id is number => !!id) ?? [],
    [workoutQuery.data],
  );

  const lastPerfQuery = useGetBatchLastPerformance(exerciseIds);

  const isLoadingExercises =
    workoutQuery.isLoading ||
    (!!workoutQuery.data &&
      exercises.length === 0 &&
      (workoutQuery.data.logExercises?.length ?? 0) > 0 &&
      !lastPerfQuery.isSuccess &&
      !lastPerfQuery.isError);

  useEffect(() => {
    if (!isActive || !workout) return;
    const start = new Date(workout.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, workout]);

  useEffect(() => {
    if (!workoutQuery.data || exercises.length > 0) return;
    if (exerciseIds.length > 0 && !lastPerfQuery.isSuccess && !lastPerfQuery.isError) return;
    if (workoutQuery.data.logExercises?.length) {
      for (const ex of workoutQuery.data.logExercises.sort((a, b) => a.order - b.order)) {
        const trackingType = getTrackingType(ex.exercise?.trackingTypeId);
        const prevSets = lastPerfQuery.data?.[ex.exerciseId]?.sets ?? [];
        addExercise({
          logExerciseId: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exercise?.name ?? `Exercise #${ex.order}`,
          trackingType,
          restTime: ex.restTime ?? 0,
          notes: ex.notes ?? '',
          sets:
            ex.sets?.sort((a, b) => a.order - b.order).map((s, idx) => ({
              id: s.id,
              order: s.order,
              weight: s.weight,
              reps: s.reps,
              duration: s.duration,
              distance: s.distance,
              isCompleted: s.isCompleted,
              previousWeight: prevSets[idx]?.weight,
              previousReps: prevSets[idx]?.reps,
              previousDuration: prevSets[idx]?.duration,
              previousDistance: prevSets[idx]?.distance,
            })) ?? [{ order: 1, isCompleted: false }],
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutQuery.data, lastPerfQuery.data, lastPerfQuery.isSuccess, lastPerfQuery.isError, exerciseIds]);

  const handleFinish = useCallback(() => {
    if (!workout) return;
    if (completedSets === 0) {
      Alert.alert('No Sets Completed', 'Your workout has no set values.', [{ text: 'Ok' }]);
      return;
    }
    router.push({
      pathname: '/(app)/(workout)/finish-workout',
      params: {
        duration: formatElapsed(elapsed),
        volume: String(totalVolume),
        completedSets: String(completedSets),
        totalSets: String(totalSets),
      },
    });
  }, [workout, completedSets, elapsed, totalVolume, totalSets, router]);

  const handleRestTimer = useCallback((seconds: number) => {
    setRestTimerSeconds(seconds);
    setShowRestTimer(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (!workout) return;
    Alert.alert(
      'Discard Workout',
      'Are you sure? All progress will be lost.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            deleteWorkout.mutate(String(workout.id), {
              onSuccess: () => {
                endWorkout();
                router.back();
              },
            });
          },
        },
      ],
    );
  }, [workout, deleteWorkout, endWorkout, router]);

  const handleAddExercise = useCallback(() => {
    if (!workout) return;
    router.push({
      pathname: '/(app)/(workout)/exercise-picker',
      params: { workoutId: String(workout.id) },
    });
  }, [workout, router]);

  const handleSaveName = useCallback(() => {
    if (editName === null || !workout) return;
    updateWorkoutMutation.mutate({ id: String(workout.id), data: { name: editName } });
    setEditName(null);
  }, [editName, workout, updateWorkoutMutation]);

  return {
    workout,
    exercises,
    isActive,
    totalVolume,
    completedSets,
    totalSets,
    addExercise,
    updateExercise,
    addSet,
    updateSet,
    toggleSetComplete,
    endWorkout,
    elapsed,
    editName,
    setEditName,
    showRestTimer,
    setShowRestTimer,
    restTimerSeconds,
    isLoadingExercises,
    handleFinish,
    handleRestTimer,
    handleCancel,
    handleAddExercise,
    handleSaveName,
    insets,
    router,
  };
}
