import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { IExercise, IMuscle, IEquipment } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { useGetExercises } from '../../hooks/api/useExerciseQueries';
import { useGetMuscles } from '../../hooks/api/useMuscleQueries';
import { useGetEquipments } from '../../hooks/api/useEquipmentQueries';
import { useActiveWorkout } from '../../contexts/ActiveWorkoutContext';
import { useCreateLogExercise } from '../../hooks/api/useLogExerciseHooks';
import { useCreateTemplateExercise } from '../../hooks/api/useTemplateExerciseHooks';
import { getTrackingType, trackingTypeIcon } from '../../utils/workout';

interface ExerciseWithRelations extends IExercise {
  equipment?: IEquipment;
  exerciseMuscles?: Array<{
    muscle?: IMuscle;
    isPrimary?: boolean;
  }>;
}

export default function ExercisePickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ workoutId?: string; templateId?: string }>();

  const [search, setSearch] = useState('');
  const [selectedMuscleIds, setSelectedMuscleIds] = useState<number[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());

  const { exercises: activeExercises, addExercise, workout } = useActiveWorkout();

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (search.trim()) f.search = search.trim();
    if (selectedMuscleIds.length === 1) f.muscleId = selectedMuscleIds[0];
    if (selectedEquipmentIds.length === 1) f.equipmentId = selectedEquipmentIds[0];
    return f;
  }, [search, selectedMuscleIds, selectedEquipmentIds]);

  const exercisesQuery = useGetExercises(filters);
  const musclesQuery = useGetMuscles();
  const equipmentsQuery = useGetEquipments();

  const createLogExercise = useCreateLogExercise(params.workoutId ?? String(workout?.id ?? ''));
  const createTemplateExercise = useCreateTemplateExercise(params.templateId ?? '');

  const exerciseList = useMemo(() => {
    const list = (exercisesQuery.data ?? []) as ExerciseWithRelations[];
    // Client-side filter for multi-muscle/equipment (API only supports single)
    return list.filter((ex) => {
      if (selectedMuscleIds.length > 1) {
        const exMuscleIds = ex.exerciseMuscles?.map((m) => m.muscle?.id).filter(Boolean) ?? [];
        if (!selectedMuscleIds.some((id) => exMuscleIds.includes(id))) return false;
      }
      if (selectedEquipmentIds.length > 1) {
        if (!selectedEquipmentIds.includes(ex.equipmentId ?? 0)) return false;
      }
      return true;
    });
  }, [exercisesQuery.data, selectedMuscleIds, selectedEquipmentIds]);

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

  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    const selectedList = exerciseList.filter((ex) => selectedExercises.has(ex.id));
    if (selectedList.length === 0) return;

    setIsAdding(true);
    try {
      const workoutId = params.workoutId ?? (workout?.id ? String(workout.id) : null);

      if (workoutId) {
        // Adding to active workout — fire all mutations and wait for them
        const promises = selectedList.map(
          (ex, i) =>
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
        // Adding to template
        const promises = selectedList.map(
          (ex) =>
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

  const renderExercise = ({ item }: { item: ExerciseWithRelations }) => {
    const isSelected = selectedExercises.has(item.id);
    const muscles = item.exerciseMuscles
      ?.filter((m) => m.isPrimary)
      .map((m) => m.muscle?.name)
      .filter(Boolean)
      .join(', ');

    return (
      <Pressable
        style={[styles.exerciseItem, isSelected && styles.exerciseSelected]}
        onPress={() => toggleExercise(item.id)}
      >
        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseNameRow}>
            <Text style={styles.trackingIcon}>{trackingTypeIcon(item.trackingTypeId)}</Text>
            <Text style={styles.exerciseName} numberOfLines={1}>{item.name}</Text>
          </View>
          <View style={styles.exerciseTags}>
            {item.equipment?.name && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.equipment.name}</Text>
              </View>
            )}
            {muscles ? <Text style={styles.muscleText}>{muscles}</Text> : null}
          </View>
        </View>
        <View style={[styles.radioOuter, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Choose Exercise</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Input
          placeholder="Search exercises..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Muscle Filters */}
      {(musclesQuery.data?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {musclesQuery.data!.map((muscle) => (
            <Chip
              key={muscle.id}
              label={muscle.name}
              active={selectedMuscleIds.includes(muscle.id)}
              onPress={() => toggleMuscle(muscle.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Equipment Filters */}
      {(equipmentsQuery.data?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {equipmentsQuery.data!.map((eq) => (
            <Chip
              key={eq.id}
              label={eq.name}
              active={selectedEquipmentIds.includes(eq.id)}
              onPress={() => toggleEquipment(eq.id)}
            />
          ))}
        </ScrollView>
      )}

      {hasFilters && (
        <Pressable
          style={styles.clearFilters}
          onPress={() => {
            setSelectedMuscleIds([]);
            setSelectedEquipmentIds([]);
          }}
        >
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </Pressable>
      )}

      {/* Exercise List */}
      {exercisesQuery.isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={exerciseList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderExercise}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No exercises found"
              description="Try adjusting your search or filters"
            />
          }
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={`Add Exercise${selectedExercises.size > 0 ? ` (${selectedExercises.size})` : ''}`}
          variant="primary"
          onPress={handleAdd}
          disabled={selectedExercises.size === 0 || isAdding}
          style={styles.addBtn}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 12,
  },
  cancelBtn: {
    fontSize: 15,
    color: colors.danger,
    fontWeight: '600',
    width: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  filtersRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  clearFilters: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingIcon: {
    fontSize: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  exerciseTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  muscleText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addBtn: {
    width: '100%',
  },
  loader: {
    marginTop: 40,
  },
});
