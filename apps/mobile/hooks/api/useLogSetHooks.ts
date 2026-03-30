import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ILogSet } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { workoutKeys } from '../../api/queries/query-keys';

// ─── Mutations ──────────────────────────────────────

interface CreateLogSetData {
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isCompleted?: boolean;
}

export const useCreateLogSet = (workoutId: string, logExerciseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLogSetData) => {
      const response = await apiClient.post<ILogSet>(
        apiRoutes.workouts.sets(workoutId, logExerciseId),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(workoutId) });
    },
  });
};

interface UpdateLogSetData {
  order?: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isCompleted?: boolean;
}

export const useUpdateLogSet = (workoutId: string, logExerciseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLogSetData }) => {
      const response = await apiClient.patch<ILogSet>(
        apiRoutes.workouts.set(workoutId, logExerciseId, id),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(workoutId) });
    },
  });
};

export const useDeleteLogSet = (workoutId: string, logExerciseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(apiRoutes.workouts.set(workoutId, logExerciseId, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(workoutId) });
    },
  });
};
