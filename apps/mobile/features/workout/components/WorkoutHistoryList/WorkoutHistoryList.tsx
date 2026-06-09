import React, { useCallback, useState } from 'react';
import { Alert, View, FlatList, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import { confirmDestructive, showErrorAlert } from '@/utils/alerts';
import { useRouter } from 'expo-router';
import type { IWorkoutWithRelations } from '@athlo/shared';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { WorkoutHistoryCard } from '@/features/workout/components/WorkoutHistoryCard/WorkoutHistoryCard';
import { formatDurationRange, formatDate, computeVolume } from '@/utils/workout';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import {
  useCopyWorkout,
  useCreateTemplateFromWorkout,
  useDeleteWorkout,
} from '@/hooks/api';
import { InfiniteList, InfiniteListProps } from '@/components/ui/InfiniteList/InfiniteList';

interface WorkoutHistoryListProps extends Omit<InfiniteListProps<IWorkoutWithRelations>, 'data' | 'renderItem'> {
  workouts: IWorkoutWithRelations[];
  isLoading?: boolean;
  onWorkoutPress: (workoutId: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export const WorkoutHistoryList = ({
  workouts,
  isLoading,
  onWorkoutPress,
  emptyTitle = 'No workouts yet',
  emptyDescription = 'Start your first workout to see your history',
  emptyActionLabel,
  onEmptyAction,
  ListHeaderComponent,
  contentContainerStyle,
  ...infiniteListProps
}: WorkoutHistoryListProps) => {
  const router = useRouter();
  const { isActive, startWorkout } = useActiveWorkout();
  const deleteWorkout = useDeleteWorkout();
  const copyWorkout = useCopyWorkout();
  const createTemplateFromWorkout = useCreateTemplateFromWorkout();
  const [savingAsTemplateId, setSavingAsTemplateId] = useState<number | null>(null);

  const handleSaveAsTemplate = useCallback(
    async (w: IWorkoutWithRelations) => {
      setSavingAsTemplateId(w.id);
      try {
        const template = await createTemplateFromWorkout.mutateAsync({
          workoutId: String(w.id),
          name: w.name,
        });
        router.push(`/(app)/(workout)/template/${template.id}`);
      } catch {
        showErrorAlert('Failed to save as template. Please try again.');
      } finally {
        setSavingAsTemplateId(null);
      }
    },
    [createTemplateFromWorkout, router],
  );

  const handleCopyWorkout = useCallback(
    async (w: IWorkoutWithRelations) => {
      if (isActive) {
        Alert.alert('Active Workout', 'You already have an active workout. Finish it first.');
        return;
      }
      try {
        const newWorkout = await copyWorkout.mutateAsync(String(w.id));
        startWorkout(newWorkout, []);
        router.push('/(app)/(workout)/active-workout');
      } catch {
        showErrorAlert('Failed to copy workout. Please try again.');
      }
    },
    [isActive, copyWorkout, startWorkout, router],
  );

  const handleDelete = useCallback(
    (w: IWorkoutWithRelations) => {
      confirmDestructive('Delete Workout', 'This cannot be undone.', () => deleteWorkout.mutate(String(w.id)));
    },
    [deleteWorkout],
  );

  if (isLoading) {
    return (
      <View style={contentContainerStyle}>
        {typeof ListHeaderComponent === 'function' ? (
          <ListHeaderComponent />
        ) : (
          ListHeaderComponent
        )}
        <Spinner style={styles.loader} />
      </View>
    );
  }

  const renderEmptyComponent = () => (
    <EmptyState
      title={emptyTitle}
      description={emptyDescription}
      actionLabel={emptyActionLabel}
      onAction={onEmptyAction}
    />
  );

  return (
    <InfiniteList
      data={workouts}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: w }) => {
        const exerciseSets =
          w.logExercises?.map((e) => ({
            exerciseName: e.exercise?.name ?? '',
            setsCount: e.sets?.length ?? 0,
          })) ?? [];

        return (
          <WorkoutHistoryCard
            name={w.name}
            date={formatDate(w.started_at)}
            duration={formatDurationRange(w.started_at, w.ended_at)}
            volume={computeVolume(w)}
            exerciseCount={w.logExercises?.length ?? 0}
            sets={exerciseSets}
            onPress={() => onWorkoutPress(w.id)}
            onSaveAsTemplate={() => handleSaveAsTemplate(w)}
            isSavingAsTemplate={savingAsTemplateId === w.id}
            onCopyWorkout={() => handleCopyWorkout(w)}
            onEdit={() =>
              router.push({
                pathname: '/(app)/(workout)/workout-summary',
                params: { workoutId: String(w.id), autoEdit: 'true' },
              })
            }
            onDelete={() => handleDelete(w)}
          />
        );
      }}
      {...infiniteListProps}
    />
  );
};

const styles = StyleSheet.create({
  loader: {
    marginVertical: spacing.xl,
  },
});


