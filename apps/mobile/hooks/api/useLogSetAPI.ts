import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ILogSet } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { workoutKeys } from '@/api/queries/query-keys';

// ─── Mutations ──────────────────────────────────────

interface CreateLogSetData {
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isCompleted?: boolean;
}

export const useCreateLogSet = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ exerciseId, data }: { exerciseId: string; data: CreateLogSetData }) => {
      const response = await apiClient.post<ILogSet>(
        apiRoutes.workouts.sets(workoutId, exerciseId),
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

export const useUpdateLogSet = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      setId,
      data,
    }: {
      exerciseId: string;
      setId: string;
      data: UpdateLogSetData;
    }) => {
      const response = await apiClient.patch<ILogSet>(
        apiRoutes.workouts.set(workoutId, exerciseId, setId),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(workoutId) });
    },
  });
};

export const useDeleteLogSet = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, setId }: { exerciseId: string; setId: string }) =>
      apiClient.delete(apiRoutes.workouts.set(workoutId, exerciseId, setId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(workoutId) });
    },
  });
};
