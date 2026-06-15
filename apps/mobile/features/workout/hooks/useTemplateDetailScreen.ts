import { useState, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { confirmDestructive, showErrorAlert } from '@/utils/alerts';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from '@/hooks/useRouter';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useDeleteTemplate, useDeleteTemplateExercise, useGetTemplateById, useStartFromTemplate, useUpdateTemplate, useUpdateTemplateExercise, useSaveTemplate, useUnsaveTemplate, useGetSavedTemplates } from '@/hooks/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import apiClient from '@/api/api-client';
import { templateKeys } from '@/api/queries/query-keys';
import { getTrackingType } from '@/utils/workout';
import { VisibilityType } from '@athlo/shared';
import { VISIBILITY_ENUM_TO_ID } from '@/utils/visibility';
import { validateFields, required } from '@/utils/validation';

export function useTemplateDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, edit, fromProfileId } = useLocalSearchParams<{ id: string; edit?: string; fromProfileId?: string }>();
  const queryClient = useQueryClient();

  const { data: template, isLoading, error } = useGetTemplateById(id);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const startFromTemplate = useStartFromTemplate();
  const deleteExercise = useDeleteTemplateExercise(id);
  const updateExercise = useUpdateTemplateExercise(id);
  const saveTemplate = useSaveTemplate();
  const unsaveTemplate = useUnsaveTemplate();
  const savedTemplatesQuery = useGetSavedTemplates();

  const { showToast } = useToast();
  const { startWorkout, isActive } = useActiveWorkout();

  const isSaved = useMemo(() => {
    const saved = (savedTemplatesQuery.data ?? []) as Array<{ workoutTemplateId: number }>;
    return saved.some((s) => s.workoutTemplateId === Number(id));
  }, [savedTemplatesQuery.data, id]);

  const handleSave = useCallback(() => {
    if (isSaved) {
      unsaveTemplate.mutate(id);
    } else {
      saveTemplate.mutate({ id, template: template! }, {
        onSuccess: () => {
          showToast({
            title: 'Template Saved!',
            description: 'The workout template has been added to your library. Go to the "My" tab to use it.',
            icon: '📁',
          });
        },
      });
    }
  }, [isSaved, id, template, saveTemplate, unsaveTemplate, showToast]);

  const [editName, setEditName] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(edit === '1');

  // Pending set value changes — flushed to API only on "Done"
  const pendingSetUpdates = useRef<Map<number, { exerciseEntryId: number; data: any }>>(new Map());

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

  const flushPendingSetUpdates = useCallback(async () => {
    const updates = Array.from(pendingSetUpdates.current.entries());
    pendingSetUpdates.current.clear();
    if (updates.length === 0) return;
    await Promise.allSettled(
      updates.map(([setId, { exerciseEntryId, data }]) =>
        apiClient.patch(`templates/${id}/exercises/${exerciseEntryId}/sets/${setId}`, data),
      ),
    );
    queryClient.invalidateQueries({ queryKey: templateKeys.byId(id) });
  }, [id, queryClient]);

  const toggleEditing = useCallback(() => {
    if (isEditing) {
      flushPendingSetUpdates();
      setIsEditing(false);
      return;
    }
    // Entering edit mode — clear stale pending updates
    pendingSetUpdates.current.clear();
    setIsEditing(true);
  }, [isEditing, flushPendingSetUpdates]);

  const handleUpdateSet = useCallback((exerciseEntryId: number, setIndex: number, data: any) => {
    const ex = exercises.find(e => e.id === exerciseEntryId);
    const set = ex?.templateSets?.sort((a, b) => a.order - b.order)[setIndex];
    if (!set) return;

    // Accumulate changes — no API call until "Done"
    pendingSetUpdates.current.set(set.id, {
      exerciseEntryId,
      data: { ...(pendingSetUpdates.current.get(set.id)?.data ?? {}), ...data },
    });
  }, [exercises]);

  const handleAddSet = useCallback(async (exerciseEntryId: number) => {
    const ex = exercises.find(e => e.id === exerciseEntryId);
    if (!ex) return;
    const newOrder = (ex.templateSets?.length ?? 0) + 1;
    
    try {
      await apiClient.post(`templates/${id}/exercises/${exerciseEntryId}/sets`, { order: newOrder });
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(id) });
    } catch {
      showErrorAlert('Failed to add set.');
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
      showErrorAlert('Failed to delete set.');
    }
  }, [exercises, id, queryClient]);

  const handleMoveSet = useCallback(async (exerciseEntryId: number, setIndex: number, direction: 'up' | 'down') => {
    const ex = exercises.find(e => e.id === exerciseEntryId);
    const sorted = (ex?.templateSets ?? []).slice().sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? setIndex - 1 : setIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const setA = sorted[setIndex];
    const setB = sorted[targetIndex];
    try {
      await Promise.all([
        apiClient.patch(`templates/${id}/exercises/${exerciseEntryId}/sets/${setA.id}`, { order: setB.order }),
        apiClient.patch(`templates/${id}/exercises/${exerciseEntryId}/sets/${setB.id}`, { order: setA.order }),
      ]);
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(id) });
    } catch {
      showErrorAlert('Failed to reorder set.');
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
    const error = validateFields([
      { value: editName ?? '', rules: [required('Template name')] },
    ]);
    if (error) { showToast({ title: error, variant: 'error' }); return; }

    updateTemplate.mutate(
      { id, data: { name: editName } },
      { onSuccess: () => setEditName(null) },
    );
  }, [editName, typedTemplate, updateTemplate, id, showToast]);

  const handleSaveDesc = useCallback(() => {
    if (editDesc === null) return;
    if (editDesc === (typedTemplate?.description ?? '')) {
      setEditDesc(null);
      return;
    }
    updateTemplate.mutate(
      { id, data: { description: editDesc } },
      { onSuccess: () => setEditDesc(null) },
    );
  }, [editDesc, typedTemplate, updateTemplate, id]);

  const currentVisibility = useMemo((): VisibilityType => {
    if (typedTemplate?.visibilityTypeId === 2) return VisibilityType.PUBLIC;
    if (typedTemplate?.visibilityTypeId === 3) return VisibilityType.FRIENDS_ONLY;
    return VisibilityType.PRIVATE;
  }, [typedTemplate?.visibilityTypeId]);

  const handleVisibilityChange = useCallback((value: VisibilityType) => {
    updateTemplate.mutate({ id, data: { visibilityTypeId: VISIBILITY_ENUM_TO_ID[value] } });
  }, [updateTemplate, id]);

  const handleDelete = useCallback(() => {
    confirmDestructive('Delete Template', 'Are you sure?', () => deleteTemplate.mutate(id, { onSuccess: () => router.back() }));
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
      confirmDestructive('Remove Exercise', 'Remove this exercise from the template?', () => deleteExercise.mutate(String(exerciseEntryId)), 'Remove');
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
    fromProfileId,
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
    handleMoveSet,
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
    currentVisibility,
    handleVisibilityChange,
    startFromTemplatePending: startFromTemplate.isPending,
    deleteTemplatePending: deleteTemplate.isPending,
    isSaved,
    handleSave,
    isSavePending: saveTemplate.isPending || unsaveTemplate.isPending,
    insets,
    router,
  };
}
