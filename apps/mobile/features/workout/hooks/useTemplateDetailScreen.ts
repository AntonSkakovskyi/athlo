import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useDeleteTemplate, useDeleteTemplateExercise, useGetTemplateById, useStartFromTemplate, useUpdateTemplate, useUpdateTemplateExercise } from '@/hooks/api';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/api-client';
import { templateKeys } from '@/api/queries/query-keys';
import { getTrackingType } from '@/utils/workout';

export function useTemplateDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: template, isLoading, error } = useGetTemplateById(id);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const startFromTemplate = useStartFromTemplate();
  const deleteExercise = useDeleteTemplateExercise(id);
  const updateExercise = useUpdateTemplateExercise(id);

  const { startWorkout, isActive } = useActiveWorkout();

  const [editName, setEditName] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Time Picker State (for Rest Time)
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerExerciseId, setPickerExerciseId] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState(0);

  const typedTemplate = template;
  const exercises = useMemo(
    () =>
      (typedTemplate?.templateExercises ?? []).sort((a, b) => a.order - b.order),
    [typedTemplate],
  );

  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  const handleUpdateSet = useCallback(async (exerciseEntryId: number, setIndex: number, data: any) => {
    const ex = exercises.find(e => e.id === exerciseEntryId);
    const set = ex?.templateSets?.sort((a, b) => a.order - b.order)[setIndex];
    if (!set) return;

    try {
      await apiClient.patch(`templates/${id}/exercises/${exerciseEntryId}/sets/${set.id}`, data);
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(id) });
    } catch {
      Alert.alert('Error', 'Failed to update set.');
    }
  }, [exercises, id, queryClient]);

  const handleAddSet = useCallback(async (exerciseEntryId: number) => {
    const ex = exercises.find(e => e.id === exerciseEntryId);
    if (!ex) return;
    const newOrder = (ex.templateSets?.length ?? 0) + 1;
    
    try {
      await apiClient.post(`templates/${id}/exercises/${exerciseEntryId}/sets`, { order: newOrder });
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(id) });
    } catch {
      Alert.alert('Error', 'Failed to add set.');
    }
  }, [exercises, id, queryClient]);

  const handleDeleteSet = useCallback(async (exerciseEntryId: number, setIndex: number) => {
    const ex = exercises.find(e => e.id === exerciseEntryId);
    const set = ex?.templateSets?.sort((a, b) => a.order - b.order)[setIndex];
    if (!set) return;

    try {
      await apiClient.delete(`templates/${id}/exercises/${exerciseEntryId}/sets/${set.id}`);
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(id) });
    } catch {
      Alert.alert('Error', 'Failed to delete set.');
    }
  }, [exercises, id, queryClient]);

  const handleUpdateExercise = useCallback((exerciseEntryId: number, data: any) => {
    updateExercise.mutate({ id: String(exerciseEntryId), data });
  }, [updateExercise]);

  const handleUpdateRestTime = useCallback((exerciseEntryId: number, currentRestTime: number) => {
    setPickerExerciseId(exerciseEntryId);
    setPickerValue(currentRestTime);
    setTimePickerVisible(true);
  }, []);

  const handleSaveRestTime = useCallback(() => {
    if (pickerExerciseId !== null) {
      handleUpdateExercise(pickerExerciseId, { restTime: pickerValue });
      setTimePickerVisible(false);
      setPickerExerciseId(null);
    }
  }, [pickerExerciseId, pickerValue, handleUpdateExercise]);

  const handleMoveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= exercises.length) return;
    
    const newExercises = [...exercises];
    const [moved] = newExercises.splice(index, 1);
    newExercises.splice(toIndex, 0, moved);

    newExercises.forEach((ex, i) => {
      updateExercise.mutate({ id: String(ex.id), data: { order: i + 1 } });
    });
  }, [exercises, updateExercise]);

  const handleSaveName = useCallback(() => {
    if (editName === null || editName === typedTemplate?.name) {
      setEditName(null);
      return;
    }
    updateTemplate.mutate(
      { id, data: { name: editName } },
      { onSuccess: () => setEditName(null) },
    );
  }, [editName, typedTemplate, updateTemplate, id]);

  const handleSaveDesc = useCallback(() => {
    if (editDesc === null) return;
    updateTemplate.mutate(
      { id, data: { description: editDesc || undefined } },
      { onSuccess: () => setEditDesc(null) },
    );
  }, [editDesc, updateTemplate, id]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Template', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTemplate.mutate(id, { onSuccess: () => router.back() }),
      },
    ]);
  }, [deleteTemplate, id, router]);

  const handleStart = useCallback(() => {
    if (isActive) {
      Alert.alert('Active Workout', 'You already have an active workout. Finish it first.');
      return;
    }
    startFromTemplate.mutate(id, {
      onSuccess: (workout) => {
        if (workout) {
          startWorkout(workout, []);
          router.push('/(app)/(workout)/active-workout');
        }
      },
    });
  }, [isActive, startFromTemplate, startWorkout, router, id]);

  const handleDeleteExercise = useCallback(
    (exerciseEntryId: number) => {
      Alert.alert('Remove Exercise', 'Remove this exercise from the template?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteExercise.mutate(String(exerciseEntryId)),
        },
      ]);
    },
    [deleteExercise],
  );

  const handleAddExercise = useCallback(() => {
    router.push({
      pathname: '/(app)/(workout)/exercise-picker',
      params: { 
        templateId: id,
        nextOrder: String(exercises.length + 1)
      },
    });
  }, [router, id, exercises.length]);

  return {
    id,
    typedTemplate,
    exercises,
    isLoading,
    error,
    editName,
    setEditName,
    editDesc,
    setEditDesc,
    isEditing,
    toggleEditing,
    handleSaveName,
    handleSaveDesc,
    handleUpdateSet,
    handleAddSet,
    handleDeleteSet,
    handleDelete,
    handleStart,
    handleDeleteExercise,
    handleUpdateExercise,
    handleUpdateRestTime,
    handleSaveRestTime,
    timePickerVisible,
    setTimePickerVisible,
    pickerValue,
    setPickerValue,
    handleMoveExercise,
    handleAddExercise,
    startFromTemplatePending: startFromTemplate.isPending,
    deleteTemplatePending: deleteTemplate.isPending,
    insets,
    router,
  };
}
