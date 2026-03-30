import { useQuery } from '@tanstack/react-query';
import type { IMuscle } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { muscleKeys } from '../../api/queries/query-keys';

export const useGetMuscles = () => {
  return useQuery({
    queryKey: muscleKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IMuscle[]>(apiRoutes.muscles.getAll);
      return response.data;
    },
  });
};
