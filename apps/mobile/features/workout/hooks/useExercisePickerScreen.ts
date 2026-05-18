import { useState, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { getTrackingType } from '@/utils/workout';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { ExerciseWithRelations, useCreateLogExercise, useCreateTemplateExercise, useGetEquipments, useGetMuscles, useInfiniteExercises, useDeleteLogExercise } from '@/hooks/api';

export function useExercisePickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    workoutId?: string; 
    templateId?: string;
    replaceLogExerciseId?: string;
    replaceOrder?: string;
    nextOrder?: string;
  }>();

  const isReplaceMode = !!params.replaceLogExerciseId;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [selectedMuscleId, setSelectedMuscleId] = useState<number | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<Map<number, ExerciseWithRelations>>(new Map());
  const [isAdding, setIsAdding] = useState(false);

  const { exercises: activeExercises, addExercise, replaceExercise, workout: activeWorkout } = useActiveWorkout();
  const isEditingActiveWorkout = activeWorkout?.id === Number(params.workoutId);

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (debouncedSearch.trim()) f.search = debouncedSearch.trim();
    if (selectedMuscleId) f.muscleId = selectedMuscleId;
    if (selectedEquipmentId) f.equipmentId = selectedEquipmentId;
    return f;
  }, [debouncedSearch, selectedMuscleId, selectedEquipmentId]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearch(text);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => setDebouncedSearch(text.trim()), 300);
      setDebounceTimer(timer);
    },
    [debounceTimer],
  );

  const exercisesQuery = useInfiniteExercises(filters);
  const equipmentsQuery = useGetEquipments();
  const musclesQuery = useGetMuscles();

  const createLogExercise = useCreateLogExercise(params.workoutId ?? String(activeWorkout?.id ?? ''));
  const deleteLogExercise = useDeleteLogExercise(params.workoutId ?? String(activeWorkout?.id ?? ''));
  const createTemplateExercise = useCreateTemplateExercise(params.templateId ?? '');

  const exerciseList = useMemo(() => {
    const pages = exercisesQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.data);
  }, [exercisesQuery.data]);

  const toggleMuscle = useCallback((id: number) => {
    setSelectedMuscleId((prev) => (prev === id ? null : id));
  }, []);

  const toggleEquipment = useCallback((id: number) => {
    setSelectedEquipmentId((prev) => (prev === id ? null : id));
  }, []);

  const toggleExercise = useCallback((id: number) => {
    // We need the full exercise object, so we look it up in the current list
    const pages = exercisesQuery.data?.pages ?? [];
    const allFetched = pages.flatMap(p => p.data);
    const exercise = allFetched.find(ex => ex.id === id) || selectedExercises.get(id);
    
    if (!exercise) return;

    setSelectedExercises((prev) => {
      const next = new Map(prev);
      if (isReplaceMode) {
        next.clear();
        next.set(id, exercise);
        return next;
      }
      if (next.has(id)) next.delete(id);
      else next.set(id, exercise);
      return next;
    });
  }, [isReplaceMode, exercisesQuery.data, selectedExercises]);

  const hasFilters = !!selectedMuscleId || !!selectedEquipmentId || !!debouncedSearch;

  const clearFilters = useCallback(() => {
    setSelectedMuscleId(null);
    setSelectedEquipmentId(null);
    setSearch('');
    setDebouncedSearch('');
  }, []);

  const handleAdd = useCallback(async () => {
    const selectedList = Array.from(selectedExercises.values());
    if (selectedList.length === 0) return;

    setIsAdding(true);
    try {
      const workoutId = params.workoutId ?? (activeWorkout?.id ? String(activeWorkout.id) : null);

      // Fetch last performance for all selected exercises to pre-fill
      let lastPerformances: Record<number, any> = {};
      try {
        const lpResponse = await apiClient.post(apiRoutes.lastPerformance.batch, {
          exerciseIds: selectedList.map(ex => ex.id)
        });
        lastPerformances = lpResponse.data;
      } catch (e) {
        console.error('Failed to fetch last performances:', e);
      }

      if (workoutId) {
        if (isReplaceMode && params.replaceLogExerciseId) {
          // 1. Delete old
          await deleteLogExercise.mutateAsync(params.replaceLogExerciseId);
          // 2. Create new with same order
          const ex = selectedList[0];
          const logExercise = await createLogExercise.mutateAsync({
            exerciseId: ex.id,
            order: Number(params.replaceOrder ?? 1),
          });

          const lp = lastPerformances[ex.id];
          const trackingType = getTrackingType(ex.trackingTypeId);

          if (isEditingActiveWorkout) {
            const setsWithIds: any[] = [];
            if (lp?.sets?.length) {
              for (const s of lp.sets) {
                const setResp = await apiClient.post(apiRoutes.lastPerformance.batch, {
                  exerciseIds: [ex.id] // Re-using batch for consistency or could use single
                });
                // Wait, I should just use the lp I already have
                const dbSet = await apiClient.post(apiRoutes.workouts.sets(workoutId, String(logExercise.id)), {
                  order: s.order,
                  weight: undefined,
                  reps: undefined,
                  isCompleted: false,
                });
                setsWithIds.push({
                  id: dbSet.data.id,
                  order: s.order,
                  isCompleted: false,
                  previousWeight: s.weight,
                  previousReps: s.reps,
                  previousDuration: s.duration,
                  previousDistance: s.distance,
                  placeholderWeight: s.weight,
                  placeholderReps: s.reps,
                  placeholderDuration: s.duration,
                  placeholderDistance: s.distance,
                });
              }
            }
            
            replaceExercise(Number(params.replaceOrder ?? 1) - 1, {
              logExerciseId: logExercise.id,
              exerciseId: ex.id,
              exerciseName: ex.name,
              trackingType,
              restTime: 0,
              sets: setsWithIds.length > 0 ? setsWithIds : [{ order: 1, isCompleted: false }],
            });
          } else {
            // Past workout summary replacement
            if (lp?.sets?.length) {
              for (const s of lp.sets) {
                await apiClient.post(apiRoutes.workouts.sets(workoutId, String(logExercise.id)), {
                  order: s.order,
                  weight: s.weight,
                  reps: s.reps,
                  duration: s.duration,
                  distance: s.distance,
                  isCompleted: true,
                });
              }
            }
          }
        } else {
          const startingOrder = params.nextOrder ? Number(params.nextOrder) : activeExercises.length + 1;
          
          for (let i = 0; i < selectedList.length; i++) {
            const ex = selectedList[i];
            const logExercise = await createLogExercise.mutateAsync({
              exerciseId: ex.id,
              order: startingOrder + i,
            });

            const lp = lastPerformances[ex.id];
            const trackingType = getTrackingType(ex.trackingTypeId);

            if (isEditingActiveWorkout) {
              const setsWithIds: any[] = [];
              if (lp?.sets?.length) {
                for (const s of lp.sets) {
                  const setResp = await apiClient.post(apiRoutes.workouts.sets(workoutId, String(logExercise.id)), {
                    order: s.order,
                    weight: undefined,
                    reps: undefined,
                    isCompleted: false,
                  });
                  setsWithIds.push({
                    id: setResp.data.id,
                    order: s.order,
                    isCompleted: false,
                    previousWeight: s.weight,
                    previousReps: s.reps,
                    previousDuration: s.duration,
                    previousDistance: s.distance,
                    placeholderWeight: s.weight,
                    placeholderReps: s.reps,
                    placeholderDuration: s.duration,
                    placeholderDistance: s.distance,
                  });
                }
              }

              addExercise({
                logExerciseId: logExercise.id,
                exerciseId: ex.id,
                exerciseName: ex.name,
                trackingType,
                restTime: 0,
                sets: setsWithIds.length > 0 ? setsWithIds : [{ order: 1, isCompleted: false }],
              });
            } else {
              // Past workout summary editing
              if (lp?.sets?.length) {
                for (const s of lp.sets) {
                  await apiClient.post(apiRoutes.workouts.sets(workoutId, String(logExercise.id)), {
                    order: s.order,
                    weight: s.weight,
                    reps: s.reps,
                    duration: s.duration,
                    distance: s.distance,
                    isCompleted: true,
                  });
                }
              }
            }
          }
        }
      } else if (params.templateId) {
        const startingOrder = params.nextOrder ? Number(params.nextOrder) : 1;
        for (let i = 0; i < selectedList.length; i++) {
          const ex = selectedList[i];
          await createTemplateExercise.mutateAsync({
            exerciseId: ex.id,
            order: startingOrder + i,
          });
        }
      }

      router.back();
    } catch (error) {
      console.error('Failed to add/replace exercise:', error);
    } finally {
      setIsAdding(false);
    }
  }, [
    selectedExercises,
    exerciseList,
    params,
    activeWorkout,
    activeExercises,
    isEditingActiveWorkout,
    createLogExercise,
    deleteLogExercise,
    isReplaceMode,
    createTemplateExercise,
    addExercise,
    router,
  ]);

  return {
    workoutId: params.workoutId,
    templateId: params.templateId,
    isReplaceMode,
    search,
    setSearch: handleSearchChange,
    selectedMuscleId,
    selectedEquipmentId,
    selectedExercises,
    isAdding,
    exercisesQuery,
    musclesQuery,
    equipmentsQuery,
    exerciseList,
    hasFilters,
    toggleMuscle,
    toggleEquipment,
    toggleExercise,
    handleAdd,
    clearFilters,
    insets,
    router,
  };
}
