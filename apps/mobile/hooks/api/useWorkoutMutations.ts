import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IWorkout } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { workoutQueryKey } from '../../api/queries/workout-query-keys';

export const useGetWorkouts = () => {
  return useQuery({
    queryKey: workoutQueryKey.all,
    queryFn: async () => {
      const response = await apiClient.get<IWorkout[]>(apiRoutes.workouts.getAll);
      return response.data;
    },
  });
};

export const useGetWorkoutById = (id: string) => {
  return useQuery({
    queryKey: workoutQueryKey.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<IWorkout>(apiRoutes.workouts.getById(id));
      return response.data;
    },
    enabled: !!id,
  });
};

export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(apiRoutes.workouts.getById(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKey.all });
    },
  });
};

export const workoutQueries = {
  getAll: () =>
    queryOptions({
      queryKey: workoutQueryKey.all,
      queryFn: async () => {
        const response = await apiClient.get<IWorkout[]>(apiRoutes.workouts.getAll);
        return response.data;
      },
    }),
  getById: (id: string) =>
    queryOptions({
      queryKey: workoutQueryKey.byId(id),
      queryFn: async () => {
        const response = await apiClient.get<IWorkout>(apiRoutes.workouts.getById(id));
        return response.data;
      },
    }),
};