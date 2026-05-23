import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IUser, IUserProfile } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { profileKeys } from '@/api/queries/query-keys';

export const useGetUserProfile = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.byId(userId),
    queryFn: async () => {
      const response = await apiClient.get<IUserProfile>(apiRoutes.profile.getById(userId));
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: profileKeys.search(query),
    queryFn: async () => {
      const response = await apiClient.get<IUser[]>(apiRoutes.profile.search, {
        params: { query },
      });
      return response.data;
    },
    enabled: query.length >= 2,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Omit<IUser, 'id' | 'email' | 'password_hash'>>) => {
      const response = await apiClient.patch<Omit<IUser, 'password_hash'>>(apiRoutes.profile.update, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.all, data);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(apiRoutes.profile.delete);
    },
  });
};
