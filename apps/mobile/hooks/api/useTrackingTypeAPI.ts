import { useQuery } from '@tanstack/react-query';
import type { ITrackingType } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { trackingTypeKeys } from '@/api/queries/query-keys';

export const useGetTrackingTypes = () => {
  return useQuery({
    queryKey: trackingTypeKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<ITrackingType[]>(apiRoutes.trackingTypes.getAll);
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
  });
};
