import { useQuery } from '@tanstack/react-query';
import type { IExercise } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { exerciseKeys } from '../../api/queries/query-keys';

interface ExerciseFilters {
  [key: string]: unknown;
  page?: number;
  limit?: number;
  muscleId?: number;
  equipmentId?: number;
  search?: string;
}

export const useGetExercises = (filters: ExerciseFilters = {}) => {
  return useQuery({
    queryKey: exerciseKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<IExercise[]>(apiRoutes.exercises.getAll, {
        params: filters,
      });
      return response.data;
    },
  });
};
