import { View, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { ExerciseListItem } from '@/features/workout/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { trackingTypeIcon } from '@/utils/workout';
import type { ExerciseWithRelations } from '@/hooks/api/useExerciseAPI';

interface ExercisePickerListProps {
  data: ExerciseWithRelations[];
  isLoading: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  selectedExercises: Map<number, ExerciseWithRelations>;
  onToggleExercise: (id: number) => void;
  onExerciseDetailPress: (exercise: ExerciseWithRelations) => void;
}

export function ExercisePickerList({
  data,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  hasFilters,
  onClearFilters,
  selectedExercises,
  onToggleExercise,
  onExerciseDetailPress,
}: ExercisePickerListProps) {
  const renderExercise = ({ item }: { item: ExerciseWithRelations }) => {
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
        selected={selectedExercises.has(item.id)}
        onPress={() => onToggleExercise(item.id)}
        onRightIconPress={() => onExerciseDetailPress(item)}
      />
    );
  };

  return (
    <View style={styles.listWrap}>
      {isLoading ? (
        <Spinner size="large" style={styles.loader} />
      ) : (
        <InfiniteList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderExercise}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                title="No exercises found"
                description="Try adjusting your search or filters"
              />
              {hasFilters && (
                <Button
                  title="Reset Filters"
                  variant="outline"
                  onPress={onClearFilters}
                  style={styles.resetBtn}
                />
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

export default ExercisePickerList;

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  resetBtn: {
    marginTop: spacing.md,
    minWidth: 150,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
});
