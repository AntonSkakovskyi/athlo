import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { formatElapsed, getTrackingType } from '@/utils/workout';
import apiClient from '@/api/api-client';
import {
  useDeleteWorkout,
  useGetBatchLastPerformance,
  useGetWorkoutById,
  useUpdateLogExercise,
  useUpdateWorkout,
} from '@/hooks/api';
import type { SetRowData } from '@/features/workout/components/ActiveExerciseCard/SetRow/SetRow';

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
    updateExercise: updateExerciseLocal,
    addSet: addSetLocal,
    updateSet: updateSetLocal,
    removeSet: removeSetLocal,
    reorderExercises: reorderExercisesLocal,
    toggleSetComplete: toggleSetCompleteLocal,
    endWorkout,
    removeExercise,
  } = useActiveWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [editName, setEditName] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(60);
  const [newAchievement, setNewAchievement] = useState<{ title: string; description?: string } | null>(null);

  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkout = useDeleteWorkout();

  const workoutId = workout?.id ? String(workout.id) : '';
  const workoutQuery = useGetWorkoutById(workoutId);

  // API hooks for sets and exercises
  const updateLogExercise = useUpdateLogExercise(workoutId);

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
    if (exerciseIds.length > 0 && !lastPerfQuery.isSuccess && !lastPerfQuery.isError) return;
    if (workoutQuery.data.logExercises?.length) {
      for (const ex of workoutQuery.data.logExercises.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
        const trackingType = getTrackingType(ex.exercise?.trackingTypeId);
        const prevSets = lastPerfQuery.data?.[ex.exerciseId]?.sets ?? [];
        
        const sortedLogSets = [...(ex.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        addExercise({
          logExerciseId: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exercise?.name ?? `Exercise #${ex.order}`,
          trackingType,
          restTime: ex.restTime ?? 0,
          notes: ex.notes ?? '',
          sets: sortedLogSets.length > 0 
            ? sortedLogSets.map((s, idx) => {
                const prevPerformanceSet = prevSets[idx];
                const previousInWorkout = idx > 0 ? sortedLogSets[idx-1] : null;

                return {
                  id: s.id,
                  order: s.order,
                  weight: s.weight,
                  reps: s.reps,
                  duration: s.duration,
                  distance: s.distance,
                  isCompleted: s.isCompleted,
                  isPR: s.isPR,
                  achievementId: s.achievementId,
                  achievement: s.achievement,
                  previousWeight: prevPerformanceSet?.weight,
                  previousReps: prevPerformanceSet?.reps,
                  previousDuration: prevPerformanceSet?.duration,
                  previousDistance: prevPerformanceSet?.distance,
                  // Placeholders
                  placeholderWeight: previousInWorkout?.weight ?? prevPerformanceSet?.weight,
                  placeholderReps: previousInWorkout?.reps ?? prevPerformanceSet?.reps,
                  placeholderDuration: previousInWorkout?.duration ?? prevPerformanceSet?.duration,
                  placeholderDistance: previousInWorkout?.distance ?? prevPerformanceSet?.distance,
                };
              })
            : [{ 
                order: 1, 
                isCompleted: false,
                previousWeight: prevSets[0]?.weight,
                previousReps: prevSets[0]?.reps,
                previousDuration: prevSets[0]?.duration,
                previousDistance: prevSets[0]?.distance,
                placeholderWeight: prevSets[0]?.weight,
                placeholderReps: prevSets[0]?.reps,
                placeholderDuration: prevSets[0]?.duration,
                placeholderDistance: prevSets[0]?.distance,
              }],
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutQuery.data, lastPerfQuery.data, lastPerfQuery.isSuccess, lastPerfQuery.isError, exerciseIds]);

  const updateExercise = useCallback(
    (index: number, data: Partial<{ notes: string; restTime: number; showNotes: boolean }>) => {
      updateExerciseLocal(index, data);
      const ex = exercises[index];
      if (ex?.logExerciseId && (data.notes !== undefined || data.restTime !== undefined)) {
        updateLogExercise.mutate({
          id: String(ex.logExerciseId),
          data: { notes: data.notes, restTime: data.restTime },
        });
      }
    },
    [exercises, updateExerciseLocal, updateLogExercise],
  );

  const addSet = useCallback(
    async (exerciseIndex: number) => {
      const ex = exercises[exerciseIndex];
      if (!ex?.logExerciseId) return;

      const newOrder = ex.sets.length + 1;
      // Optimistic update
      addSetLocal(exerciseIndex);

      try {
        const response = await apiClient.post(
          `workouts/${workoutId}/exercises/${ex.logExerciseId}/sets`,
          { order: newOrder },
        );
        // Update the newly added set with its real ID
        const setIndex = ex.sets.length; // The index after addSetLocal
        updateSetLocal(exerciseIndex, setIndex, { id: response.data.id });
      } catch {
        Alert.alert('Error', 'Failed to add set. Please check your connection.');
      }
    },
    [exercises, workoutId, addSetLocal, updateSetLocal],
  );

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, data: Partial<SetRowData>) => {
      updateSetLocal(exerciseIndex, setIndex, data);
      const ex = exercises[exerciseIndex];
      const set = ex?.sets[setIndex];
      if (ex?.logExerciseId && set?.id) {
        apiClient
          .patch(`workouts/${workoutId}/exercises/${ex.logExerciseId}/sets/${set.id}`, data)
          .then((response) => {
            if (response.data) {
              updateSetLocal(exerciseIndex, setIndex, {
                isPR: response.data.isPR,
                achievementId: response.data.achievementId,
                achievement: response.data.achievement,
              });
            }
          });
      }
    },
    [exercises, workoutId, updateSetLocal],
  );

  const deleteSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const ex = exercises[exerciseIndex];
      const set = ex?.sets[setIndex];
      if (!ex || !set) return;

      if (set.id) {
        apiClient.delete(`workouts/${workoutId}/exercises/${ex.logExerciseId}/sets/${set.id}`);
      }
      removeSetLocal(exerciseIndex, setIndex);
    },
    [exercises, workoutId, removeSetLocal],
  );

  const moveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= exercises.length) return;
    reorderExercisesLocal(index, toIndex);
  }, [exercises.length, reorderExercisesLocal]);

  const deleteExercise = useCallback((index: number) => {
    const ex = exercises[index];
    if (!ex) return;
    if (ex.logExerciseId) {
      apiClient.delete(`workouts/${workoutId}/exercises/${ex.logExerciseId}`);
    }
    removeExercise(index);
  }, [exercises, workoutId, removeExercise]);

  const toggleSetComplete = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const ex = exercises[exerciseIndex];
      const set = ex?.sets[setIndex];
      if (!set) return;

      const newCompleted = !set.isCompleted;
      toggleSetCompleteLocal(exerciseIndex, setIndex);

      if (ex?.logExerciseId && set.id) {
        apiClient
          .patch(`workouts/${workoutId}/exercises/${ex.logExerciseId}/sets/${set.id}`, {
            isCompleted: newCompleted,
          })
          .then((response) => {
            // Update with returned data (isPR, achievementId, achievement)
            if (response.data) {
              updateSetLocal(exerciseIndex, setIndex, {
                isPR: response.data.isPR,
                achievementId: response.data.achievementId,
                achievement: response.data.achievement,
              });

              if (newCompleted && (response.data.isPR || response.data.achievement)) {
                if (response.data.achievement) {
                  setNewAchievement({
                    title: response.data.achievement.name,
                    description: response.data.achievement.description,
                  });
                } else if (response.data.isPR) {
                  let recordDetails = '';
                  if (ex.trackingType === 'WEIGHT_AND_REPS') {
                    if (set.weight != null && set.reps != null) {
                      recordDetails = `${set.weight}kg × ${set.reps} reps`;
                    } else if (set.weight != null) {
                      recordDetails = `${set.weight}kg`;
                    } else if (set.reps != null) {
                      recordDetails = `${set.reps} reps`;
                    }
                  } else if (ex.trackingType === 'REPS_ONLY') {
                    if (set.reps != null) recordDetails = `${set.reps} reps`;
                  } else if (ex.trackingType === 'TIME_BASED') {
                    const formatSecs = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
                    const dur = set.duration ? formatSecs(set.duration) : '';
                    const dist = set.distance ? `${set.distance}m` : '';
                    recordDetails = [dur, dist].filter(Boolean).join(' ');
                  }

                  setNewAchievement({
                    title: 'Personal Record!',
                    description: recordDetails
                      ? `You've set a new personal record of ${recordDetails} for ${ex.exerciseName}!`
                      : `You've set a new personal record for ${ex.exerciseName}!`,
                  });
                }
              }
            }
          })
          .catch((err) => {
            console.error('Failed to update set completion status:', err);
          });
      }
    },
    [exercises, workoutId, toggleSetCompleteLocal, updateSetLocal],
  );

  const handleFinish = useCallback(async () => {
    if (!workout) return;

    // Silent pruning: remove exercises with no sets
    const emptyExerciseIndices = exercises
      .map((ex, idx) => (ex.sets.length === 0 ? idx : -1))
      .filter((idx) => idx !== -1);

    if (emptyExerciseIndices.length > 0) {
      // Delete from DB and local state
      // We process in reverse to not mess up indices during local removal
      const reverseIndices = [...emptyExerciseIndices].reverse();
      for (const idx of reverseIndices) {
        const ex = exercises[idx];
        if (ex.logExerciseId) {
          try {
            await apiClient.delete(`workouts/${workoutId}/exercises/${ex.logExerciseId}`);
          } catch (e) {
            console.error('Failed to prune empty exercise:', e);
          }
        }
        removeExercise(idx);
      }
    }

    // Recalculate completed sets after pruning if necessary, 
    // but the summary screen will use the latest state anyway.
    
    if (completedSets === 0 && emptyExerciseIndices.length === exercises.length) {
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
  }, [workout, exercises, workoutId, removeExercise, completedSets, router, elapsed, totalVolume, totalSets]);

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
    deleteSet,
    toggleSetComplete,
    deleteExercise,
    moveExercise,
    endWorkout,
    elapsed,
    editName,
    setEditName,
    showRestTimer,
    setShowRestTimer,
    restTimerSeconds,
    newAchievement,
    setNewAchievement,
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

