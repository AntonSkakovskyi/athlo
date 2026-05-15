import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useDeleteTemplate, useDeleteTemplateExercise, useGetTemplateById, useStartFromTemplate, useUpdateTemplate } from '@/hooks/api';

export function useTemplateDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: template, isLoading, error } = useGetTemplateById(id);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const startFromTemplate = useStartFromTemplate();
  const deleteExercise = useDeleteTemplateExercise(id);

  const { startWorkout, isActive } = useActiveWorkout();

  const [editName, setEditName] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState<string | null>(null);

  const typedTemplate = template;
  const exercises = useMemo(
    () =>
      (typedTemplate?.templateExercises ?? []).sort((a, b) => a.order - b.order),
    [typedTemplate],
  );

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
      params: { templateId: id },
    });
  }, [router, id]);

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
    handleSaveName,
    handleSaveDesc,
    handleDelete,
    handleStart,
    handleDeleteExercise,
    handleAddExercise,
    startFromTemplatePending: startFromTemplate.isPending,
    deleteTemplatePending: deleteTemplate.isPending,
    insets,
    router,
  };
}
