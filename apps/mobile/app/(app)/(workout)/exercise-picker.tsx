import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import type { IMuscle, IEquipment } from '@athlo/shared';
import { colors, spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Chip } from '@/components/ui/Chip/Chip';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { ExerciseListItem } from '@/features/workout/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { trackingTypeIcon } from '@/utils/workout';
import { useExercisePickerScreen } from '@/features/workout/hooks/useExercisePickerScreen';
import { ExerciseWithRelations } from '@/hooks/api/useExerciseAPI';

export default function ExercisePickerScreen() {
  const {
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
  } = useExercisePickerScreen();

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
      <ScreenHeader title="Choose Exercise" onBack={() => router.back()} />

      <View style={styles.searchWrap}>
        <Input
          placeholder="Search exercises..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {(musclesQuery.data?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {musclesQuery.data!.map((muscle: IMuscle) => (
            <Chip
              key={muscle.id}
              label={muscle.name}
              active={selectedMuscleIds.includes(muscle.id)}
              onPress={() => toggleMuscle(muscle.id)}
            />
          ))}
        </ScrollView>
      )}

      {(equipmentsQuery.data?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {equipmentsQuery.data!.map((eq: IEquipment) => (
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
        <Pressable style={styles.clearFilters} onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </Pressable>
      )}

      {exercisesQuery.isLoading ? (
        <Spinner size="large" style={styles.loader} />
      ) : (
        <InfiniteList
          data={exerciseList}
          keyExtractor={(item) => String(item.id)}
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
