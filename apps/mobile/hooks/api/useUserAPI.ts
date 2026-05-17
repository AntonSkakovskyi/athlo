import { useQuery } from '@tanstack/react-query';
import type { IUser } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { profileKeys } from '@/api/queries/query-keys';

export const useGetUserProfile = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.byId(userId),
    queryFn: async () => {
      const response = await apiClient.get<Omit<IUser, 'password_hash'>>(apiRoutes.profile.getById(userId));
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: profileKeys.search(query),
    queryFn: async () => {
      const response = await apiClient.get<Omit<IUser, 'password_hash'>[]>(apiRoutes.profile.search, {
        params: { query },
      });
      return response.data;
    },
    enabled: query.length >= 2,
  });
};
