import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatDuration, getTrackingType } from '@/utils/workout';
import { 
  useGetWorkoutById, 
  useUpdateWorkout, 
  useUpdateLogSet, 
  useCreateLogSet, 
  useDeleteLogSet, 
  useUpdateLogExercise, 
  useDeleteLogExercise,
  useGetBatchLastPerformance
} from '@/hooks/api';
import { Alert } from 'react-native';
import { VisibilityType } from '@athlo/shared';

export function useWorkoutSummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutId, autoEdit } = useLocalSearchParams<{ workoutId: string; autoEdit?: string }>();

  const { data: workout, isLoading } = useGetWorkoutById(workoutId ?? '');
  const updateWorkout = useUpdateWorkout();
  const updateLogSet = useUpdateLogSet(workoutId ?? '');
  const createLogSet = useCreateLogSet(workoutId ?? '');
  const deleteLogSet = useDeleteLogSet(workoutId ?? '');
  const updateLogExercise = useUpdateLogExercise(workoutId ?? '');
  const deleteLogExercise = useDeleteLogExercise(workoutId ?? '');

  const [nameInput, setNameInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showNotesMap, setShowNotesMap] = useState<Record<string, boolean>>({});

  // Local metric states for stability
  const [localRpe, setLocalRpe] = useState<string>('');
  const [localCalories, setLocalCalories] = useState<string>('');
  const [localFeeling, setLocalFeeling] = useState<number | null>(null);
  const [localDuration, setLocalDuration] = useState<string>(''); // format "HH:MM:SS" or similar
  const [localVisibility, setLocalVisibility] = useState<VisibilityType>(VisibilityType.PRIVATE);
  const [localDescription, setLocalDescription] = useState<string>('');
  const [newAchievement, setNewAchievement] = useState<{ title: string; description?: string } | null>(null);

  useEffect(() => {
    if (workout) {
      setLocalRpe(workout.rpe != null ? String(workout.rpe) : '');
      setLocalCalories(workout.calories != null ? String(workout.calories) : '');
      setLocalFeeling(workout.feelingScore ?? null);
      setNameInput(workout.name ?? '');
      
      const visibilityMap: Record<number, VisibilityType> = {
        1: VisibilityType.PRIVATE,
        2: VisibilityType.PUBLIC,
        3: VisibilityType.FRIENDS_ONLY,
      };
      setLocalVisibility(visibilityMap[workout.visibilityTypeId] || VisibilityType.PRIVATE);
      setLocalDescription(workout.description ?? '');
      
      if (workout.started_at && workout.ended_at) {
        const diff = Math.floor((new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime()) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setLocalDuration(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    }
  }, [workout]);

  useEffect(() => {
    if (autoEdit === 'true' && workout) {
      setIsEditing(true);
    }
  }, [autoEdit, workout]);

  const exercises = useMemo(
    () => workout?.logExercises?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) ?? [],
    [workout],
  );

  const exerciseIds = useMemo(() => exercises.map(ex => ex.exerciseId), [exercises]);
  const { data: lastPerformances } = useGetBatchLastPerformance(exerciseIds);

  const toggleEditing = useCallback(() => {
    if (isEditing) {
      // Silent pruning: remove exercises with no sets
      const emptyExercises = exercises.filter(ex => !ex.sets || ex.sets.length === 0);
      emptyExercises.forEach(ex => {
        deleteLogExercise.mutate(String(ex.id));
      });

      // Sync metrics on "Done"
      const diffParts = localDuration.split(':').map(Number);
      let totalSeconds = 0;
      if (diffParts.length === 3) totalSeconds = diffParts[0] * 3600 + diffParts[1] * 60 + diffParts[2];
      else if (diffParts.length === 2) totalSeconds = diffParts[0] * 60 + diffParts[1];

      const newEndDate = new Date(new Date(workout?.started_at ?? '').getTime() + totalSeconds * 1000);

      updateWorkout.mutate({
        id: workoutId ?? '',
        data: {
          name: nameInput.trim() || workout?.name,
          rpe: localRpe ? Number(localRpe) : undefined,
          calories: localCalories ? Number(localCalories) : undefined,
          feelingScore: localFeeling ?? undefined,
          ended_at: newEndDate.toISOString(),
          visibility: localVisibility,
          description: localDescription.trim() || undefined
        }
      });
    }
    setIsEditing(prev => !prev);
  }, [isEditing, localRpe, localCalories, localFeeling, localDuration, localVisibility, localDescription, workoutId, workout?.started_at, workout?.name, nameInput, updateWorkout, exercises, deleteLogExercise]);

  const handleUpdateSet = useCallback((exerciseId: number, setIndex: number, data: any) => {
    const ex = exercises.find(e => e.id === exerciseId);
    const sets = [...(ex?.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const set = sets[setIndex];
    if (!set) return;

    updateLogSet.mutate({
      exerciseId: String(exerciseId),
      setId: String(set.id),
      data
    });
  }, [exercises, updateLogSet]);

  const handleToggleSetComplete = useCallback((exerciseId: number, setIndex: number) => {
    const ex = exercises.find(e => e.id === exerciseId);
    const sets = [...(ex?.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const set = sets[setIndex];
    if (!set || !ex) return;

    const isNowCompleted = !set.isCompleted;

    updateLogSet.mutate({
      exerciseId: String(exerciseId),
      setId: String(set.id),
      data: { isCompleted: isNowCompleted }
    }, {
      onSuccess: (data) => {
        if (isNowCompleted && data && (data.isPR || data.achievement)) {
          if (data.achievement) {
            setNewAchievement({
              title: data.achievement.name,
              description: data.achievement.description,
            });
          } else if (data.isPR) {
            const trackingType = getTrackingType(ex.exercise?.trackingTypeId);
            let recordDetails = '';
            if (trackingType === 'WEIGHT_AND_REPS') {
              if (set.weight != null && set.reps != null) {
                recordDetails = `${set.weight}kg × ${set.reps} reps`;
              } else if (set.weight != null) {
                recordDetails = `${set.weight}kg`;
              } else if (set.reps != null) {
                recordDetails = `${set.reps} reps`;
              }
            } else if (trackingType === 'REPS_ONLY') {
              if (set.reps != null) recordDetails = `${set.reps} reps`;
            } else if (trackingType === 'TIME_BASED') {
              const formatSecs = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
              const dur = set.duration ? formatSecs(set.duration) : '';
              const dist = set.distance ? `${set.distance}m` : '';
              recordDetails = [dur, dist].filter(Boolean).join(' ');
            }

            const exName = ex.exercise?.name ?? `Exercise #${ex.order}`;
            setNewAchievement({
              title: 'Personal Record!',
              description: recordDetails
                ? `You've set a new personal record of ${recordDetails} for ${exName}!`
                : `You've set a new personal record for ${exName}!`,
            });
          }
        }
      }
    });
  }, [exercises, updateLogSet]);

  const handleAddSet = useCallback((exerciseId: number) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    
    const sets = [...(ex.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const lastSet = sets[sets.length - 1];
    const newOrder = sets.length + 1;

    createLogSet.mutate({
      exerciseId: String(exerciseId),
      data: { 
        order: newOrder, 
        isCompleted: true,
        // Optional: pre-fill DB if needed, but LogSetRow handles placeholder-to-value on checkbox click
      }
    });
  }, [exercises, createLogSet]);

  const handleDeleteSet = useCallback((exerciseId: number, setIndex: number) => {
    const ex = exercises.find(e => e.id === exerciseId);
    const set = ex?.sets?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[setIndex];
    if (!set) return;

    Alert.alert('Delete Set', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteLogSet.mutate({
            exerciseId: String(exerciseId),
            setId: String(set.id)
          });
        }
      }
    ]);
  }, [exercises, deleteLogSet]);

  const handleUpdateExercise = useCallback((exerciseId: number, data: any) => {
    updateLogExercise.mutate({
      id: String(exerciseId),
      data
    });
  }, [updateLogExercise]);

  const handleDeleteExercise = useCallback((exerciseId: number) => {
    Alert.alert('Delete Exercise', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteLogExercise.mutate(String(exerciseId));
        }
      }
    ]);
  }, [deleteLogExercise]);

  const handleMoveExercise = useCallback(async (exerciseId: number, direction: 'up' | 'down') => {
    const currentIndex = exercises.findIndex(e => e.id === exerciseId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === exercises.length - 1) return;

    const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const neighbor = exercises[neighborIndex];

    try {
      // Swap orders sequentially to avoid race conditions
      await updateLogExercise.mutateAsync({
        id: String(exerciseId),
        data: { order: neighbor.order }
      });
      await updateLogExercise.mutateAsync({
        id: String(neighbor.id),
        data: { order: exercises[currentIndex].order }
      });
    } catch (e) {
      console.error('Failed to move exercise:', e);
    }
  }, [exercises, updateLogExercise]);

  const handleMoveSet = useCallback(async (exerciseId: number, setIndex: number, direction: 'up' | 'down') => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    const sets = [...(ex.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    if (direction === 'up' && setIndex === 0) return;
    if (direction === 'down' && setIndex === sets.length - 1) return;

    const currentSet = sets[setIndex];
    const neighborSet = direction === 'up' ? sets[setIndex - 1] : sets[setIndex + 1];

    try {
      await updateLogSet.mutateAsync({
        exerciseId: String(exerciseId),
        setId: String(currentSet.id),
        data: { order: neighborSet.order }
      });
      await updateLogSet.mutateAsync({
        exerciseId: String(exerciseId),
        setId: String(neighborSet.id),
        data: { order: currentSet.order }
      });
    } catch (e) {
      console.error('Failed to move set:', e);
    }
  }, [exercises, updateLogSet]);

  const handleChangeExercise = useCallback((exerciseId: number) => {
    const ex = exercises.find(e => e.id === exerciseId);
    router.push({
      pathname: '/exercise-picker',
      params: { 
        workoutId, 
        replaceLogExerciseId: String(exerciseId),
        replaceOrder: String(ex?.order ?? 1)
      }
    });
  }, [router, workoutId, exercises]);

  const handleAddExercise = useCallback(() => {
    router.push({
      pathname: '/exercise-picker',
      params: { 
        workoutId,
        nextOrder: String(exercises.length + 1)
      }
    });
  }, [router, workoutId, exercises.length]);

  const toggleNotes = useCallback((exerciseId: number) => {
    setShowNotesMap(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  }, []);

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
    nameInput,
    setNameInput,
    isSavingName: updateWorkout.isPending,
    isEditing,
    toggleEditing,
    handleUpdateSet,
    handleToggleSetComplete,
    handleAddSet,
    handleDeleteSet,
    handleUpdateExercise,
    handleDeleteExercise,
    handleMoveExercise,
    handleMoveSet,
    handleChangeExercise,
    handleAddExercise,
    toggleNotes,
    showNotesMap,
    updateWorkout,
    localRpe,
    setLocalRpe,
    localCalories,
    setLocalCalories,
    localFeeling,
    setLocalFeeling,
    localDuration,
    setLocalDuration,
    localVisibility,
    setLocalVisibility,
    localDescription,
    setLocalDescription,
    lastPerformances,
    newAchievement,
    setNewAchievement,
  };
}
