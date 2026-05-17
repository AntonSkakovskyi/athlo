import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IWorkout, IWorkoutWithRelations, ILastPerformance, IPaginatedResponse } from '@athlo/shared';
import { WorkoutStatus, VisibilityType } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { workoutKeys, lastPerformanceKeys } from '@/api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetWorkouts = () => {
  return useQuery({
    queryKey: workoutKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IPaginatedResponse<IWorkoutWithRelations>>(apiRoutes.workouts.getAll, {
        params: { page: 1, limit: 1000 },
      });
      return response.data.data;
    },
  });
};

export const useInfiniteWorkouts = (status?: WorkoutStatus) => {
  return useInfiniteQuery({
    queryKey: status ? [...workoutKeys.infinite, { status }] : workoutKeys.infinite,
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = { page: pageParam, limit: 5 };
      if (status) params.status = status;
      const response = await apiClient.get<IPaginatedResponse<IWorkoutWithRelations>>(apiRoutes.workouts.getAll, { params });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
  });
};

export const useInfiniteUserWorkouts = (userId: string) => {
  return useInfiniteQuery({
    queryKey: workoutKeys.infiniteByUser(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<IPaginatedResponse<IWorkoutWithRelations>>(
        apiRoutes.workouts.getByUserId(userId),
        { params: { page: pageParam, limit: 10 } },
      );
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
    enabled: !!userId,
  });
};

export const useGetWorkoutById = (id: string) => {
  return useQuery({
    queryKey: workoutKeys.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<IWorkoutWithRelations>(apiRoutes.workouts.getById(id));
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
  ended_at?: string;
  visibility?: VisibilityType;
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
  visibility?: VisibilityType;
  description?: string;
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

export const useCopyWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<IWorkout>(apiRoutes.workouts.copy(id));
      return response.data;
    },
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
