import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IWorkout, ILastPerformance } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { workoutKeys, lastPerformanceKeys } from '../../api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetWorkouts = () => {
  return useQuery({
    queryKey: workoutKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IWorkout[]>(apiRoutes.workouts.getAll);
      return response.data;
    },
  });
};

export const useGetWorkoutById = (id: string) => {
  return useQuery({
    queryKey: workoutKeys.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<IWorkout>(apiRoutes.workouts.getById(id));
      return response.data;
    },
    enabled: !!id,
  });
};

// ─── Mutations ──────────────────────────────────────

interface CreateWorkoutData {
  name: string;
  description?: string;
}

export const useCreateWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWorkoutData) => {
      const response = await apiClient.post<IWorkout>(apiRoutes.workouts.getAll, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
};

interface UpdateWorkoutData {
  name?: string;
  description?: string;
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  rpe?: number;
  feelingScore?: number;
}

export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkoutData }) => {
      const response = await apiClient.patch<IWorkout>(apiRoutes.workouts.getById(id), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
};

interface CompleteWorkoutData {
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  rpe?: number;
  feelingScore?: number;
}

export const useCompleteWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompleteWorkoutData }) => {
      const response = await apiClient.patch<IWorkout>(apiRoutes.workouts.complete(id), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
};

export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(apiRoutes.workouts.getById(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
};

// ─── Last Performance ───────────────────────────────

export const useGetLastPerformance = (exerciseId: string) => {
  return useQuery({
    queryKey: lastPerformanceKeys.byExercise(exerciseId),
    queryFn: async () => {
      const response = await apiClient.get<ILastPerformance | null>(
        apiRoutes.lastPerformance.byExercise(exerciseId),
      );
      return response.data;
    },
    enabled: !!exerciseId,
  });
};

export const useGetBatchLastPerformance = (exerciseIds: number[]) => {
  return useQuery({
    queryKey: lastPerformanceKeys.batch(exerciseIds),
    queryFn: async () => {
      const response = await apiClient.post<Record<number, ILastPerformance>>(
        apiRoutes.lastPerformance.batch,
        { exerciseIds },
      );
      return response.data;
    },
    enabled: exerciseIds.length > 0,
  });
};
