import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IUser } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { profileKeys } from '../../api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetProfile = () => {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: async () => {
      const response = await apiClient.get<Omit<IUser, 'password_hash'>>(apiRoutes.profile.get);
      return response.data;
    },
  });
};

// ─── Mutations ──────────────────────────────────────

interface UpdateProfileData {
  fullName?: string;
  nickname?: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await apiClient.patch<Omit<IUser, 'password_hash'>>(apiRoutes.profile.update, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
};
