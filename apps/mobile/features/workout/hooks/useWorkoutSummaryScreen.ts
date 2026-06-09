import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatDurationRange, getTrackingType, hasEmptySets } from '@/utils/workout';
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
import { confirmDestructive } from '@/utils/alerts';
import { VisibilityType } from '@athlo/shared';

export function useWorkoutSummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutId, autoEdit, fromCompletion } = useLocalSearchParams<{ workoutId: string; autoEdit?: string; fromCompletion?: string }>();

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
  const [localNotesMap, setLocalNotesMap] = useState<Record<string, string>>({});
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

      const notesMap: Record<string, string> = {};
      workout.logExercises?.forEach(ex => {
        notesMap[String(ex.id)] = ex.notes ?? '';
      });
      setLocalNotesMap(notesMap);
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
      const commit = () => {
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
            description: localDescription.trim() || undefined,
          },
        });

        // Save buffered exercise notes only if changed
        exercises.forEach(ex => {
          const buffered = localNotesMap[String(ex.id)];
          if (buffered !== undefined && buffered !== (ex.notes ?? '')) {
            updateLogExercise.mutate({
              id: String(ex.id),
              data: { notes: buffered.trim() || undefined },
            });
          }
        });

        // Renumber completed sets consecutively so view mode shows #1, #2, ... not #1, #3
        exercises.forEach(ex => {
          const sorted = [...(ex.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const completed = sorted.filter(s => s.isCompleted);
          completed.forEach((set, i) => {
            const newOrder = i + 1;
            if ((set.order ?? 0) !== newOrder) {
              updateLogSet.mutate({
                exerciseId: String(ex.id),
                setId: String(set.id),
                data: { order: newOrder },
              });
            }
          });
        });

        setIsEditing(false);
      };

      const hasEmpty = exercises.some((ex) => {
        const trackingType = getTrackingType(ex.exercise?.trackingTypeId);
        return hasEmptySets(ex.sets ?? [], trackingType, { completedOnly: true });
      });

      if (hasEmpty) {
        Alert.alert(
          'Незаповнені підходи',
          'Деякі виконані підходи не мають значень. Продовжити?',
          [
            { text: 'Скасувати', style: 'cancel' },
            { text: 'Продовжити', onPress: commit },
          ],
        );
        return;
      }

      commit();
      return;
    }
    setIsEditing(true);
  }, [isEditing, localRpe, localCalories, localFeeling, localDuration, localVisibility, localDescription, localNotesMap, workoutId, workout?.started_at, workout?.name, nameInput, updateWorkout, updateLogExercise, updateLogSet, exercises, deleteLogExercise]);

  const updateTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingSetData = useRef<Map<string, any>>(new Map());

  const handleUpdateSet = useCallback((exerciseId: number, setIndex: number, data: any) => {
    const ex = exercises.find(e => e.id === exerciseId);
    const sets = [...(ex?.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const set = sets[setIndex];
    if (!set) return;

    const key = String(set.id);
    pendingSetData.current.set(key, { ...(pendingSetData.current.get(key) ?? {}), ...data });

    clearTimeout(updateTimers.current.get(key));
    updateTimers.current.set(key, setTimeout(() => {
      updateLogSet.mutate({
        exerciseId: String(exerciseId),
        setId: key,
        data: pendingSetData.current.get(key),
      });
      pendingSetData.current.delete(key);
      updateTimers.current.delete(key);
    }, 400));
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

    confirmDestructive('Delete Set', 'Are you sure?', () => deleteLogSet.mutate({ exerciseId: String(exerciseId), setId: String(set.id) }));
  }, [exercises, deleteLogSet]);

  const handleUpdateExercise = useCallback((exerciseId: number, data: any) => {
    updateLogExercise.mutate({
      id: String(exerciseId),
      data
    });
  }, [updateLogExercise]);

  const handleUpdateExerciseNotes = useCallback((exerciseId: number, notes: string) => {
    setLocalNotesMap(prev => ({ ...prev, [String(exerciseId)]: notes }));
  }, []);

  const handleDeleteExercise = useCallback((exerciseId: number) => {
    confirmDestructive('Delete Exercise', 'Are you sure?', () => deleteLogExercise.mutate(String(exerciseId)));
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

  const duration = workout ? formatDurationRange(workout.started_at, workout.ended_at) : '—';

  return {
    workout,
    isLoading,
    fromCompletion: fromCompletion === '1',
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
    localNotesMap,
    handleUpdateExerciseNotes,
    lastPerformances,
    newAchievement,
    setNewAchievement,
  };
}
