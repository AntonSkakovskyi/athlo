import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IUserProfile, Gender, ActivityLevel, FitnessGoal } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { profileKeys } from '@/api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetProfile = () => {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: async () => {
      const response = await apiClient.get<IUserProfile>(apiRoutes.profile.get);
      return response.data;
    },
  });
};

// ─── Mutations ──────────────────────────────────────

interface UpdateProfileData {
  fullName?: string;
  nickname?: string;
  avatar?: string | null;
  gender?: Gender;
  age?: number;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  fitnessGoal?: FitnessGoal;
  waterGoal?: number | null;
  proteinGoal?: number | null;
  fatGoal?: number | null;
  carbGoal?: number | null;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await apiClient.patch<IUserProfile>(apiRoutes.profile.update, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me, data);
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
};
