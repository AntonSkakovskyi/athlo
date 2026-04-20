import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ITemplateExercise, ITemplateSet, IExercise } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useActiveWorkout } from '../../../contexts/ActiveWorkoutContext';
import {
  useGetTemplateById,
  useUpdateTemplate,
  useDeleteTemplate,
  useStartFromTemplate,
} from '../../../hooks/api/useTemplateHooks';
import { useDeleteTemplateExercise } from '../../../hooks/api/useTemplateExerciseHooks';

interface TemplateExerciseWithRelations extends ITemplateExercise {
  exercise?: IExercise & { equipment?: { name: string } };
  templateSets?: ITemplateSet[];
}

interface TemplateWithRelations {
  id: number;
  name: string;
  description?: string | null;
  visibilityTypeId: number;
  templateExercises?: TemplateExerciseWithRelations[];
}

export default function TemplateDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: template, isLoading, error } = useGetTemplateById(id);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const startFromTemplate = useStartFromTemplate();
  const deleteExercise = useDeleteTemplateExercise(id);

  const { startWorkout, isActive } = useActiveWorkout();

  const [editName, setEditName] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState<string | null>(null);

  const typedTemplate = template as TemplateWithRelations | undefined;
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
    updateTemplate.mutate({ id, data: { name: editName } }, { onSuccess: () => setEditName(null) });
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
          router.push('/(app)/active-workout');
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
      pathname: '/(app)/exercise-picker',
      params: { templateId: id },
    });
  }, [router, id]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !typedTemplate) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Failed to load template</Text>
        <Button title="Go Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const renderExercise = ({ item }: { item: TemplateExerciseWithRelations }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>
            {item.exercise?.name ?? `Exercise #${item.order}`}
          </Text>
          {item.exercise?.equipment?.name && (
            <Text style={styles.equipmentTag}>{item.exercise.equipment.name}</Text>
          )}
        </View>
        <View style={styles.exerciseActions}>
          <Text style={styles.setsCount}>{item.templateSets?.length ?? 0} sets</Text>
          <Pressable onPress={() => handleDeleteExercise(item.id)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      {item.restTime != null && item.restTime > 0 && (
        <Text style={styles.restTime}>⏱️ Rest: {item.restTime}s</Text>
      )}

      {item.templateSets
        ?.sort((a, b) => a.order - b.order)
        .map((set) => (
          <View key={set.id} style={styles.setRow}>
            <Text style={styles.setNum}>Set {set.order}</Text>
            {(set.weight ?? 0) > 0 && <Text style={styles.setValue}>{set.weight} kg</Text>}
            {(set.reps ?? 0) > 0 && <Text style={styles.setValue}>× {set.reps}</Text>}
            {(set.duration ?? 0) > 0 && <Text style={styles.setValue}>{set.duration}s</Text>}
            {(set.distance ?? 0) > 0 && <Text style={styles.setValue}>{set.distance}m</Text>}
          </View>
        ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderExercise}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Name */}
            {editName !== null ? (
              <TextInput
                style={styles.nameInput}
                value={editName}
                onChangeText={setEditName}
                onBlur={handleSaveName}
                onSubmitEditing={handleSaveName}
                autoFocus
                selectionColor={colors.primary}
              />
            ) : (
              <Pressable onPress={() => setEditName(typedTemplate.name)}>
                <Text style={styles.title}>{typedTemplate.name}</Text>
              </Pressable>
            )}

            {/* Description */}
            {editDesc !== null ? (
              <TextInput
                style={styles.descInput}
                value={editDesc}
                onChangeText={setEditDesc}
                onBlur={handleSaveDesc}
                multiline
                placeholder="Add description..."
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
              />
            ) : (
              <Pressable onPress={() => setEditDesc(typedTemplate.description ?? '')}>
                <Text style={styles.description}>
                  {typedTemplate.description || 'Tap to add description'}
                </Text>
              </Pressable>
            )}

            <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No exercises yet"
            description="Add exercises to build your template"
            actionLabel="+ Add Exercise"
            onAction={handleAddExercise}
          />
        }
        ListFooterComponent={
          exercises.length > 0 ? (
            <Button
              title="+ Add Exercise"
              variant="ghost"
              onPress={handleAddExercise}
              style={styles.addExerciseBtn}
            />
          ) : null
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="▶ Start Workout"
          variant="primary"
          onPress={handleStart}
          isLoading={startFromTemplate.isPending}
          style={styles.footerButton}
        />
        <Button
          title="Delete"
          variant="danger"
          onPress={handleDelete}
          isLoading={deleteTemplate.isPending}
          style={styles.deleteButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  backBtn: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  descInput: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    minHeight: 60,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 14,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  equipmentTag: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  setsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  deleteIcon: {
    fontSize: 18,
  },
  restTime: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 4,
    gap: 8,
  },
  setNum: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 48,
  },
  setValue: {
    fontSize: 14,
    color: colors.text,
  },
  addExerciseBtn: {
    marginTop: 4,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
  },
  deleteButton: {
    width: 90,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
  },
});
