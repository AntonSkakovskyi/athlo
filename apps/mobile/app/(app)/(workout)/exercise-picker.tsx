import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { IExercise, IMuscle, IEquipment } from '@athlo/shared';
import { colors, spacing } from '../../../constants/theme';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Chip } from '../../../components/ui/Chip';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { InfiniteList } from '../../../components/ui/InfiniteList';
import { ExerciseListItem } from '../../../components/workout/ExerciseListItem';
import { useInfiniteExercises } from '../../../hooks/api/useExerciseQueries';
import { useGetMuscles } from '../../../hooks/api/useMuscleQueries';
import { useGetEquipments } from '../../../hooks/api/useEquipmentQueries';
import { useActiveWorkout } from '../../../contexts/ActiveWorkoutContext';
import { useCreateLogExercise } from '../../../hooks/api/useLogExerciseHooks';
import { useCreateTemplateExercise } from '../../../hooks/api/useTemplateExerciseHooks';
import { getTrackingType, trackingTypeIcon } from '../../../utils/workout';

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
    if (selectedMuscleIds.length > 0) f.muscleId = selectedMuscleIds[0];
    if (selectedEquipmentIds.length > 0) f.equipmentId = selectedEquipmentIds[0];
    return f;
  }, [search, selectedMuscleIds, selectedEquipmentIds]);

  const exercisesQuery = useInfiniteExercises(filters);
  const musclesQuery = useGetMuscles();
  const equipmentsQuery = useGetEquipments();

  const createLogExercise = useCreateLogExercise(params.workoutId ?? String(workout?.id ?? ''));
  const createTemplateExercise = useCreateTemplateExercise(params.templateId ?? '');

  const exerciseList = useMemo(() => {
    const pages = exercisesQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.data) as ExerciseWithRelations[];
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

  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    const selectedList = exerciseList.filter((ex) => selectedExercises.has(ex.id));
    if (selectedList.length === 0) return;

    setIsAdding(true);
    try {
      const workoutId = params.workoutId ?? (workout?.id ? String(workout.id) : null);

      if (workoutId) {
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
      <ExerciseListItem
        name={item.name}
        trackingIcon={trackingTypeIcon(item.trackingTypeId)}
        equipment={item.equipment?.name}
        muscles={muscles}
        selected={isSelected}
        onPress={() => toggleExercise(item.id)}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <ScreenHeader title="Choose Exercise" onBack={() => router.back()} />

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
        <InfiniteList
          data={exerciseList}
          keyExtractor={(item) => String((item as ExerciseWithRelations).id)}
          renderItem={renderExercise}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          hasNextPage={exercisesQuery.hasNextPage}
          isFetchingNextPage={exercisesQuery.isFetchingNextPage}
          onLoadMore={() => exercisesQuery.fetchNextPage()}
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
