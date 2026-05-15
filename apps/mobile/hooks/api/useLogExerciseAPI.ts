import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ILogExercise } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { workoutKeys } from '@/api/queries/query-keys';

// ─── Mutations ──────────────────────────────────────

interface CreateLogExerciseData {
  exerciseId: number;
  order: number;
  notes?: string;
  restTime?: number;
}

export const useCreateLogExercise = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLogExerciseData) => {
      const response = await apiClient.post<ILogExercise>(
        apiRoutes.workouts.exercises(workoutId),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(workoutId) });
    },
  });
};

interface UpdateLogExerciseData {
  order?: number;
  notes?: string;
  restTime?: number;
}

export const useUpdateLogExercise = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLogExerciseData }) => {
      const response = await apiClient.patch<ILogExercise>(
        apiRoutes.workouts.exercise(workoutId, id),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(workoutId) });
    },
  });
};

export const useDeleteLogExercise = (workoutId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(apiRoutes.workouts.exercise(workoutId, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(workoutId) });
    },
  });
};
