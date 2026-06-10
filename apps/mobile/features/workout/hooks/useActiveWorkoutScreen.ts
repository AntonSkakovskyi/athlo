import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { buildFinalizedExercises, getTrackingType, formatSetValue } from '@/utils/workout';
import { formatHMS } from '@/utils/time';
import { showErrorAlert } from '@/utils/alerts';
import apiClient from '@/api/api-client';
import {
  useDeleteLogExercise,
  useDeleteLogSet,
  useDeleteWorkout,
  useGetBatchLastPerformance,
  useGetWorkoutById,
  useUpdateLogExercise,
  useUpdateWorkout,
} from '@/hooks/api';
import type { SetRowData } from '@/features/workout/components/ActiveExerciseCard/SetRow/SetRow';
import type { ILastPerformance } from '@athlo/shared';

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
    reconcileSetId,
    updateSet: updateSetLocal,
    removeSet: removeSetLocal,
    reorderExercises: reorderExercisesLocal,
    reorderSets: reorderSetsLocal,
    toggleSetComplete: toggleSetCompleteLocal,
    endWorkout,
    removeExercise,
  } = useActiveWorkout();

  const [editName, setEditName] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(60);
  const [newAchievement, setNewAchievement] = useState<{ title: string; description?: string } | null>(null);
  const [errorToast, setErrorToast] = useState<{ title: string; description?: string } | null>(null);

  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkout = useDeleteWorkout();

  const workoutId = workout?.id ? String(workout.id) : '';
  const workoutQuery = useGetWorkoutById(workoutId);

  // API hooks for sets and exercises
  const updateLogExercise = useUpdateLogExercise(workoutId);
  const deleteLogExercise = useDeleteLogExercise(workoutId);
  const deleteLogSet = useDeleteLogSet(workoutId);

  // Refs must be declared before any useMemo/useEffect that reads them.
  const addedLogExerciseIds = useRef(new Set<number>());
  // Cache last-performance data across multiple batch fetches to avoid re-fetching
  // for exercises already loaded when a new exercise is added.
  const lastPerfCache = useRef<Record<number, ILastPerformance>>({});
  const fetchedLastPerfIds = useRef(new Set<number>());

  const exerciseIds = useMemo(
    () =>
      workoutQuery.data?.logExercises
        ?.map((ex) => ex.exerciseId)
        .filter((id): id is number => !!id) ?? [],
    [workoutQuery.data],
  );

  // Only fetch last-perf for exercise IDs we haven't fetched yet.
  // Prevents re-fetching already-cached exercises when a new one is added.
  const newExerciseIds = useMemo(
    () => exerciseIds.filter((id) => !fetchedLastPerfIds.current.has(id)),
    [exerciseIds],
  );

  const lastPerfQuery = useGetBatchLastPerformance(newExerciseIds);

  const isLoadingExercises =
    workoutQuery.isLoading ||
    (!!workoutQuery.data &&
      exercises.length === 0 &&
      (workoutQuery.data.logExercises?.length ?? 0) > 0 &&
      !lastPerfQuery.isSuccess &&
      !lastPerfQuery.isError);

  // Accumulate last-perf results into the cache so they survive query key changes.
  useEffect(() => {
    if (!lastPerfQuery.data) return;
    Object.assign(lastPerfCache.current, lastPerfQuery.data);
    newExerciseIds.forEach((id) => fetchedLastPerfIds.current.add(id));
  }, [lastPerfQuery.data, newExerciseIds]);

  // Гідрація локального стану з сервера. Prefill-сети створює бекенд
  // транзакційно в POST /workouts/:id/exercises — тут лише читання.
  useEffect(() => {
    // Only wait for in-flight last-perf if there are genuinely new exercises to fetch for.
    if (newExerciseIds.length > 0 && !lastPerfQuery.isSuccess && !lastPerfQuery.isError) return;
    if (!workoutQuery.data?.logExercises?.length) return;

    const existingIds = new Set(exercises.map((e) => e.logExerciseId));
    // Копія перед sort: in-place сортування мутує кеш TanStack Query
    const sortedLogExercises = [...workoutQuery.data.logExercises].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    for (const ex of sortedLogExercises) {
      if (existingIds.has(ex.id) || addedLogExerciseIds.current.has(ex.id)) continue;

      addedLogExerciseIds.current.add(ex.id);
      const trackingType = getTrackingType(ex.exercise?.trackingTypeId);

      // Use accumulated cache — data for old exercises is available immediately.
      const prevSets = lastPerfCache.current[ex.exerciseId]?.sets ?? [];
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
              const previousInWorkout = idx > 0 ? sortedLogSets[idx - 1] : null;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutQuery.data, lastPerfQuery.data, lastPerfQuery.isSuccess, lastPerfQuery.isError, newExerciseIds, exercises]);

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
      // Optimistic update with a stable client key; the server id is bound later
      // by localKey, so concurrent adds can't write an id onto the wrong row.
      const localKey = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      addSetLocal(exerciseIndex, localKey);

      try {
        const response = await apiClient.post(
          `workouts/${workoutId}/exercises/${ex.logExerciseId}/sets`,
          { order: newOrder },
        );
        reconcileSetId(exerciseIndex, localKey, response.data.id);
      } catch {
        showErrorAlert('Failed to add set. Please check your connection.');
      }
    },
    [exercises, workoutId, addSetLocal, reconcileSetId],
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

      if (ex.logExerciseId && set.id) {
        deleteLogSet.mutate({
          exerciseId: String(ex.logExerciseId),
          setId: String(set.id),
        });
      }
      removeSetLocal(exerciseIndex, setIndex);
    },
    [exercises, deleteLogSet, removeSetLocal],
  );

  const moveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= exercises.length) return;
    reorderExercisesLocal(index, toIndex);
  }, [exercises.length, reorderExercisesLocal]);

  const reorderSets = useCallback(async (exerciseIndex: number, direction: 'up' | 'down', setIndex: number) => {
    const toIndex = direction === 'up' ? setIndex - 1 : setIndex + 1;
    const ex = exercises[exerciseIndex];
    if (!ex || toIndex < 0 || toIndex >= ex.sets.length) return;

    // Compute the new order locally BEFORE calling reorderSetsLocal.
    // Reading exercises[exerciseIndex] after setState is a stale closure —
    // React state doesn't update synchronously.
    const reorderedSets = [...ex.sets];
    const [moved] = reorderedSets.splice(setIndex, 1);
    reorderedSets.splice(toIndex, 0, moved);

    reorderSetsLocal(exerciseIndex, setIndex, toIndex);

    if (ex.logExerciseId) {
      const updatePromises = reorderedSets.map((s, idx) =>
        s.id
          ? apiClient.patch(`workouts/${workoutId}/exercises/${ex.logExerciseId}/sets/${s.id}`, { order: idx + 1 })
          : Promise.resolve(),
      );
      try {
        await Promise.all(updatePromises);
      } catch {
        showErrorAlert('Failed to save set order. Please check your connection.');
      }
    }
  }, [exercises, reorderSetsLocal, workoutId]);

  const deleteExercise = useCallback((index: number) => {
    const ex = exercises[index];
    if (!ex) return;
    if (ex.logExerciseId) {
      deleteLogExercise.mutate(String(ex.logExerciseId));
    }
    removeExercise(index);
  }, [exercises, deleteLogExercise, removeExercise]);

  const toggleSetComplete = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const ex = exercises[exerciseIndex];
      const set = ex?.sets[setIndex];
      if (!set) return;

      const newCompleted = !set.isCompleted;

      const resolvedValues: Partial<SetRowData> = {};
      if (newCompleted) {
        if (set.weight == null && set.placeholderWeight != null) {
          resolvedValues.weight = set.placeholderWeight;
        }
        if (set.reps == null && set.placeholderReps != null) {
          resolvedValues.reps = set.placeholderReps;
        }
        if (set.duration == null && set.placeholderDuration != null) {
          resolvedValues.duration = set.placeholderDuration;
        }
        if (set.distance == null && set.placeholderDistance != null) {
          resolvedValues.distance = set.placeholderDistance;
        }
      }

      if (Object.keys(resolvedValues).length > 0) {
        updateSetLocal(exerciseIndex, setIndex, resolvedValues);
      }
      toggleSetCompleteLocal(exerciseIndex, setIndex);

      if (ex?.logExerciseId && set.id) {
        apiClient
          .patch(`workouts/${workoutId}/exercises/${ex.logExerciseId}/sets/${set.id}`, {
            isCompleted: newCompleted,
            ...resolvedValues,
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
                  const recordDetails = formatSetValue(ex.trackingType, set);

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
        description: 'Fill in the values for all completed sets before finishing.',
      });
      return;
    }

    const elapsed = Date.now() - new Date(workout.started_at).getTime();

    router.push({
      pathname: '/(app)/(workout)/finish-workout',
      params: {
        duration: formatHMS(elapsed),
        volume: String(totalVolume),
        completedSets: String(completedSets),
        totalSets: String(totalSets),
      },
    });
  }, [workout, exercises, completedSets, router, totalVolume, totalSets]);

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
    reorderSets,
    endWorkout,
    editName,
    setEditName,
    showRestTimer,
    setShowRestTimer,
    restTimerSeconds,
    newAchievement,
    setNewAchievement,
    errorToast,
    setErrorToast,
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

