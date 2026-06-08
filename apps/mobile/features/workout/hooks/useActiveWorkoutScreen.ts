import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { getTrackingType, hasEmptySets } from '@/utils/workout';
import { formatHMS, formatSeconds } from '@/utils/time';
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
    updateSet: updateSetLocal,
    removeSet: removeSetLocal,
    reorderExercises: reorderExercisesLocal,
    reorderSets: reorderSetsLocal,
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

//TODO виправити, бо тут піздєц
  useEffect(() => {
    if (!isActive || !workout) return;
    const start = new Date(workout.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, workout]);

  // Accumulate last-perf results into the cache so they survive query key changes.
  useEffect(() => {
    if (!lastPerfQuery.data) return;
    Object.assign(lastPerfCache.current, lastPerfQuery.data);
    newExerciseIds.forEach((id) => fetchedLastPerfIds.current.add(id));
  }, [lastPerfQuery.data, newExerciseIds]);

  const initializingIds = useRef(new Set<number>());
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Only wait for in-flight last-perf if there are genuinely new exercises to fetch for.
    if (newExerciseIds.length > 0 && !lastPerfQuery.isSuccess && !lastPerfQuery.isError) return;
    if (workoutQuery.data?.logExercises?.length) {
      const existingIds = new Set(exercises.map((e) => e.logExerciseId));
      let newlyAdded = false;

      for (const ex of workoutQuery.data.logExercises.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
        if (existingIds.has(ex.id) || addedLogExerciseIds.current.has(ex.id) || initializingIds.current.has(ex.id)) continue;

        newlyAdded = true;
        initializingIds.current.add(ex.id);
        setIsInitializing(true);
        const trackingType = getTrackingType(ex.exercise?.trackingTypeId);
        
        // Use accumulated cache — data for old exercises is available immediately.
        const prevSets = lastPerfCache.current[ex.exerciseId]?.sets ?? [];
        const sortedLogSets = [...(ex.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const initExercise = async () => {
          let setsToUse = sortedLogSets;
          
          // If no sets exist in DB, create initial sets based on last performance
          if (sortedLogSets.length === 0 && prevSets.length > 0) {
            try {
              const createdSets = await Promise.all(
                prevSets.map(s => 
                  apiClient.post(`workouts/${workoutId}/exercises/${ex.id}/sets`, {
                    order: s.order,
                    isCompleted: false,
                  })
                )
              );
              setsToUse = createdSets.map(r => r.data);
            } catch (e) {
              console.error('Failed to initialize sets for exercise:', ex.id, e);
            }
          }

          addedLogExerciseIds.current.add(ex.id);
          initializingIds.current.delete(ex.id);
          if (initializingIds.current.size === 0) {
            setIsInitializing(false);
          }

          addExercise({
            logExerciseId: ex.id,
            exerciseId: ex.exerciseId,
            exerciseName: ex.exercise?.name ?? `Exercise #${ex.order}`,
            trackingType,
            restTime: ex.restTime ?? 0,
            notes: ex.notes ?? '',
            sets: setsToUse.length > 0 
              ? setsToUse.map((s, idx) => {
                  const prevPerformanceSet = prevSets[idx];
                  const previousInWorkout = idx > 0 ? setsToUse[idx-1] : null;

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
        };

        initExercise();
      }

      if (!newlyAdded && initializingIds.current.size === 0) {
        setIsInitializing(false);
      }
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
        showErrorAlert('Failed to add set. Please check your connection.');
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
    
    // 1. Update local state
    reorderSetsLocal(exerciseIndex, setIndex, toIndex);
    
    // 2. Persist to API
    if (ex.logExerciseId) {
      const updatedEx = exercises[exerciseIndex]; // Get fresh sets after local update
      // We need to update orders for all sets to be safe
      const updatePromises = updatedEx.sets.map((s, idx) => 
        apiClient.patch(`workouts/${workoutId}/exercises/${ex.logExerciseId}/sets/${s.id}`, {
          order: idx + 1
        })
      );
      try {
        await Promise.all(updatePromises);
      } catch (e) {
        console.error('Failed to persist set reordering:', e);
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
                    if (set.duration != null) recordDetails = formatSeconds(set.duration);
                  } else if (ex.trackingType === 'DISTANCE_AND_TIME') {
                    const dur = set.duration ? formatSeconds(set.duration) : '';
                    const dist = set.distance ? `${set.distance}m` : '';
                    recordDetails = [dur, dist].filter(Boolean).join(' ');
                  } else if (ex.trackingType === 'DISTANCE_ONLY') {
                    if (set.distance != null) recordDetails = `${set.distance}m`;
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

    const proceed = async () => {
      // Silent pruning: remove exercises with no sets
      const emptyExerciseIndices = exercises
        .map((ex, idx) => (ex.sets.length === 0 ? idx : -1))
        .filter((idx) => idx !== -1);

      if (emptyExerciseIndices.length > 0) {
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

      if (completedSets === 0 && emptyExerciseIndices.length === exercises.length) {
        Alert.alert('No Sets Completed', 'Your workout has no set values.', [{ text: 'Ok' }]);
        return;
      }

      router.push({
        pathname: '/(app)/(workout)/finish-workout',
        params: {
          duration: formatHMS(elapsed),
          volume: String(totalVolume),
          completedSets: String(completedSets),
          totalSets: String(totalSets),
        },
      });
    };

    const hasEmpty = exercises.some((ex) =>
      hasEmptySets(ex.sets, ex.trackingType, { completedOnly: true, allowPlaceholders: true }),
    );
    if (hasEmpty) {
      Alert.alert(
        'Незаповнені підходи',
        'Деякі виконані підходи не мають значень і немає попередніх даних. Продовжити?',
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Продовжити', onPress: proceed },
        ],
      );
      return;
    }

    await proceed();
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
    reorderSets,
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
    isInitializing,
    handleFinish,
    handleRestTimer,
    handleCancel,
    handleAddExercise,
    handleSaveName,
    insets,
    router,
  };
}

