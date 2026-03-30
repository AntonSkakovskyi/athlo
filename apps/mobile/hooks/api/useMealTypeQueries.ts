import { useQuery } from '@tanstack/react-query';
import type { IMealType } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { mealTypeKeys } from '../../api/queries/query-keys';

export const useGetMealTypes = () => {
  return useQuery({
    queryKey: mealTypeKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IMealType[]>(apiRoutes.mealTypes.getAll);
      return response.data;
    },
  });
};
