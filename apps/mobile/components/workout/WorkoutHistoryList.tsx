import { useCallback } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { IWorkoutTemplate, IWorkoutWithRelations } from '@athlo/shared';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { WorkoutHistoryCard } from './WorkoutHistoryCard';
import { formatDuration, formatDate, computeVolume } from '../../utils/workout';
import { useActiveWorkout } from '../../contexts/ActiveWorkoutContext';
import { useCreateWorkout, useDeleteWorkout } from '../../hooks/api/useWorkoutHooks';
import { useCreateTemplate } from '../../hooks/api/useTemplateHooks';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';

export type { IWorkoutWithRelations as WorkoutWithRelations };

interface WorkoutHistoryListProps {
  workouts: IWorkoutWithRelations[];
  isLoading?: boolean;
  onWorkoutPress: (workoutId: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export function WorkoutHistoryList({
  workouts,
  isLoading,
  onWorkoutPress,
  emptyTitle = 'No workouts yet',
  emptyDescription = 'Start your first workout to see your history',
  emptyActionLabel,
  onEmptyAction,
}: WorkoutHistoryListProps) {
  const router = useRouter();
  const { isActive, startWorkout } = useActiveWorkout();
  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const createTemplate = useCreateTemplate();

  const handleSaveAsTemplate = useCallback(
    async (w: IWorkoutWithRelations) => {
      try {
        const template = await new Promise<IWorkoutTemplate>((resolve, reject) => {
          createTemplate.mutate({ name: w.name }, { onSuccess: resolve, onError: reject });
        });

        for (const ex of w.logExercises ?? []) {
          if (!ex.exerciseId) continue;
          const { data: templateExercise } = await apiClient.post(
            apiRoutes.templates.exercises(String(template.id)),
            { exerciseId: ex.exerciseId, order: ex.order ?? 1, restTime: ex.restTime ?? 0 },
          );
          for (const s of ex.sets ?? []) {
            await apiClient.post(
              apiRoutes.templates.sets(String(template.id), String(templateExercise.id)),
              { order: s.order ?? 1, weight: s.weight, reps: s.reps, duration: s.duration, distance: s.distance },
            );
          }
        }

        router.push(`/(app)/(workout)/template/${template.id}`);
      } catch {
        Alert.alert('Error', 'Failed to save as template. Please try again.');
      }
    },
    [createTemplate, router],
  );

  const handleCopyWorkout = useCallback(
    async (w: IWorkoutWithRelations) => {
      if (isActive) {
        Alert.alert('Active Workout', 'You already have an active workout. Finish it first.');
        return;
      }
      try {
        const newWorkout = await new Promise<IWorkout>((resolve, reject) => {
          createWorkout.mutate({ name: w.name }, { onSuccess: resolve, onError: reject });
        });

        for (const ex of w.logExercises ?? []) {
          if (!ex.exerciseId) continue;
          const { data: newExercise } = await apiClient.post(
            apiRoutes.workouts.exercises(String(newWorkout.id)),
            {
              exerciseId: ex.exerciseId,
              order: ex.order ?? 1,
              restTime: ex.restTime ?? 0,
              notes: ex.notes ?? '',
            },
          );
          for (const s of ex.sets ?? []) {
            await apiClient.post(
              apiRoutes.workouts.sets(String(newWorkout.id), String(newExercise.id)),
              { order: s.order ?? 1, weight: s.weight, reps: s.reps, duration: s.duration, distance: s.distance },
            );
          }
        }

        startWorkout(newWorkout, []);
        router.push('/(app)/(workout)/active-workout');
      } catch {
        Alert.alert('Error', 'Failed to copy workout. Please try again.');
      }
    },
    [isActive, createWorkout, startWorkout, router],
  );

  const handleDelete = useCallback(
    (w: IWorkoutWithRelations) => {
      Alert.alert('Delete Workout', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkout.mutate(String(w.id)),
        },
      ]);
    },
    [deleteWorkout],
  );

  if (isLoading) {
    return <Spinner style={{ marginVertical: 20 }} />;
  }

  if (!workouts.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <View>
      {workouts.map((w) => {
        const exerciseSets =
          w.logExercises?.map((e) => ({
            exerciseName: e.exercise?.name ?? '',
            setsCount: e.sets?.length ?? 0,
          })) ?? [];

        return (
          <WorkoutHistoryCard
            key={w.id}
            name={w.name}
            date={formatDate(w.started_at)}
            duration={formatDuration(w.started_at, w.ended_at)}
            volume={computeVolume(w)}
            exerciseCount={w.logExercises?.length ?? 0}
            sets={exerciseSets}
            onPress={() => onWorkoutPress(w.id)}
            onSaveAsTemplate={() => handleSaveAsTemplate(w)}
            onCopyWorkout={() => handleCopyWorkout(w)}
            onEdit={() =>
              router.push({ pathname: '/(app)/(workout)/workout-summary', params: { workoutId: String(w.id) } })
            }
            onDelete={() => handleDelete(w)}
          />
        );
      })}
    </View>
  );
}
