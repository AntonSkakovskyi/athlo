import { useState, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from '@/hooks/useRouter';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { getTrackingType } from '@/utils/workout';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { ExerciseWithRelations, useCreateLogExercise, useCreateTemplateExercise, useGetEquipments, useGetMuscles, useInfiniteExercises, useDeleteLogExercise, useCreateExercise, useGetTrackingTypes } from '@/hooks/api';

export function useExercisePickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { exercises: activeExercises, addExercise, replaceExercise, workout: activeWorkout } = useActiveWorkout();
  const isEditingActiveWorkout = !!activeWorkout?.id && String(activeWorkout.id) === String(params.workoutId);

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
  const trackingTypesQuery = useGetTrackingTypes();
  const createExercise = useCreateExercise();

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

      if (workoutId) {
        if (isReplaceMode && params.replaceLogExerciseId) {
          // 1. Delete old
          await deleteLogExercise.mutateAsync(params.replaceLogExerciseId);
          // 2. Create new with same order
          const ex = selectedList[0];
          await createLogExercise.mutateAsync({
            exerciseId: ex.id,
            order: Number(params.replaceOrder ?? 1),
          });
          // We don't fetch sets here anymore, useActiveWorkoutScreen will handle it
        } else {
          const startingOrder = params.nextOrder ? Number(params.nextOrder) : activeExercises.length + 1;
          
          // Use Promise.all to create exercises in parallel
          await Promise.all(selectedList.map((ex, i) => 
            createLogExercise.mutateAsync({
              exerciseId: ex.id,
              order: startingOrder + i,
            })
          ));
        }
      } else if (params.templateId) {
        const startingOrder = params.nextOrder ? Number(params.nextOrder) : 1;
        await Promise.all(selectedList.map((ex, i) => 
          createTemplateExercise.mutateAsync({
            exerciseId: ex.id,
            order: startingOrder + i,
          })
        ));
      }

      router.back();
    } catch (error) {
      console.error('Failed to add/replace exercise:', error);
    } finally {
      setIsAdding(false);
    }
  }, [
    selectedExercises,
    params,
    activeWorkout,
    activeExercises,
    createLogExercise,
    deleteLogExercise,
    isReplaceMode,
    createTemplateExercise,
    router,
  ]);

  const handleCreateExercise = useCallback(
    async (data: {
      name: string;
      description?: string;
      trackingTypeId: number;
      equipmentId?: number;
      muscles: { muscleId: number; isPrimary: boolean }[];
    }) => {
      try {
        const newExercise = await createExercise.mutateAsync(data);
        setShowCreateModal(false);
        setSelectedExercises((prev) => {
          const next = new Map(prev);
          next.set(newExercise.id, newExercise as ExerciseWithRelations);
          return next;
        });
      } catch (error) {
        console.error('Failed to create exercise:', error);
      }
    },
    [createExercise],
  );

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
    trackingTypesQuery,
    exerciseList,
    hasFilters,
    toggleMuscle,
    toggleEquipment,
    toggleExercise,
    handleAdd,
    clearFilters,
    insets,
    router,
    user,
    showCreateModal,
    setShowCreateModal,
    createExercise,
    handleCreateExercise,
  };
}
