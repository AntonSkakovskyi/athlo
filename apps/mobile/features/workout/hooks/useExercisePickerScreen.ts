import { useState, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { getTrackingType } from '@/utils/workout';
import { ExerciseWithRelations, useCreateLogExercise, useCreateTemplateExercise, useGetEquipments, useGetMuscles, useInfiniteExercises } from '@/hooks/api';

export function useExercisePickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ workoutId?: string; templateId?: string }>();

  const [search, setSearch] = useState('');
  const [selectedMuscleIds, setSelectedMuscleIds] = useState<number[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const { exercises: activeExercises, addExercise, workout } = useActiveWorkout();

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (search.trim()) f.search = search.trim();
    if (selectedMuscleIds.length > 0) f.muscleId = selectedMuscleIds[0];
    if (selectedEquipmentIds.length > 0) f.equipmentId = selectedEquipmentIds[0];
    return f;
  }, [search, selectedMuscleIds, selectedEquipmentIds]);

  const exercisesQuery = useInfiniteExercises(filters);
  const equipmentsQuery = useGetEquipments();
  const musclesQuery = useGetMuscles();

  const createLogExercise = useCreateLogExercise(params.workoutId ?? String(workout?.id ?? ''));
  const createTemplateExercise = useCreateTemplateExercise(params.templateId ?? '');

  const exerciseList = useMemo(() => {
    const pages = exercisesQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.data);
  }, [exercisesQuery.data]);

  const toggleMuscle = useCallback((id: number) => {
    setSelectedMuscleIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }, []);

  const toggleEquipment = useCallback((id: number) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }, []);

  const toggleExercise = useCallback((id: number) => {
    setSelectedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const hasFilters = selectedMuscleIds.length > 0 || selectedEquipmentIds.length > 0;

  const clearFilters = useCallback(() => {
    setSelectedMuscleIds([]);
    setSelectedEquipmentIds([]);
  }, []);

  const handleAdd = useCallback(async () => {
    const selectedList = exerciseList.filter((ex: ExerciseWithRelations) => selectedExercises.has(ex.id));
    if (selectedList.length === 0) return;

    setIsAdding(true);
    try {
      const workoutId = params.workoutId ?? (workout?.id ? String(workout.id) : null);

      if (workoutId) {
        const promises = selectedList.map(
          (ex: ExerciseWithRelations, i: number) =>
            new Promise<void>((resolve, reject) => {
              createLogExercise.mutate(
                {
                  exerciseId: ex.id,
                  order: activeExercises.length + 1 + i,
                },
                {
                  onSuccess: (logExercise) => {
                    addExercise({
                      logExerciseId: logExercise.id,
                      exerciseId: ex.id,
                      exerciseName: ex.name,
                      trackingType: getTrackingType(ex.trackingTypeId),
                      restTime: 0,
                    });
                    resolve();
                  },
                  onError: reject,
                },
              );
            }),
        );
        await Promise.all(promises);
      } else if (params.templateId) {
        const promises = selectedList.map(
          (ex: ExerciseWithRelations) =>
            new Promise<void>((resolve, reject) => {
              createTemplateExercise.mutate(
                { exerciseId: ex.id, order: 1 },
                { onSuccess: () => resolve(), onError: reject },
              );
            }),
        );
        await Promise.all(promises);
      }

      router.back();
    } finally {
      setIsAdding(false);
    }
  }, [
    selectedExercises,
    exerciseList,
    params,
    workout,
    activeExercises,
    createLogExercise,
    createTemplateExercise,
    addExercise,
    router,
  ]);

  return {
    workoutId: params.workoutId,
    templateId: params.templateId,
    search,
    setSearch,
    selectedMuscleIds,
    selectedEquipmentIds,
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
