import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/api-client';
import { API_URL } from '../../api/config';
import { apiRoutes } from '../../api/api-routes';
import { workoutQueryKey } from '../../api/queries/workout-query-keys';

export const useWorkoutMutations = () => {
  const queryClient = useQueryClient();

  const useGetWorkouts = () => {
    useQuery({
      queryKey: [workoutQueryKey.all],
      queryFn: async () => {
        const response = await apiClient.get(API_URL + apiRoutes.workouts.getAll)
        return response.data;
      }
    })
  }

  const useGetWorkoutById = (id: string) => {
    useQuery({
      queryKey: [workoutQueryKey.byId(id)],
      queryFn: async () => {
        const response = await apiClient.get(API_URL + apiRoutes.workouts.byId(id))
        return response.data;
      }
    })
  }

  const useDeleteWorkout = (id: string) => {
    useMutation({
      mutationFn: () => apiClient.delete(API_URL + apiRoutes.workouts.byId(id)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: workoutQueryKey.byId(id)})
      }
    })
  }
};

export const workoutQueries = {
  getAll: () =>
    queryOptions({
      queryKey: workoutQueryKey.all,
      queryFn: async () => {
        const response = await apiClient.get(API_URL + apiRoutes.workouts.getAll)
        return response.data;
      }
    }),
  getById: (id: string)=> (
    queryOptions({
      queryKey: workoutQueryKey.byId(id),
      queryFn: async () => {
        const response = await apiClient.get(API_URL + apiRoutes.workouts.byId(id))
        return response.data;
      }
    })
  )
}