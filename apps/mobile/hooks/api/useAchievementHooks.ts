import { useQuery } from '@tanstack/react-query';
import type {
  IAchievement,
  IUserAchievement,
  IUserExerciseRecord,
} from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { achievementKeys } from '../../api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetAchievements = () => {
  return useQuery({
    queryKey: achievementKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IAchievement[]>(apiRoutes.achievements.getAll);
      return response.data;
    },
  });
};

export const useGetUserAchievements = () => {
  return useQuery({
    queryKey: achievementKeys.user,
    queryFn: async () => {
      const response = await apiClient.get<IUserAchievement[]>(apiRoutes.achievements.user);
      return response.data;
    },
  });
};

export const useGetExerciseRecords = () => {
  return useQuery({
    queryKey: achievementKeys.records,
    queryFn: async () => {
      const response = await apiClient.get<IUserExerciseRecord[]>(apiRoutes.achievements.records);
      return response.data;
    },
  });
};

export const useGetExerciseRecord = (exerciseId: string) => {
  return useQuery({
    queryKey: achievementKeys.recordByExercise(exerciseId),
    queryFn: async () => {
      const response = await apiClient.get<IUserExerciseRecord | null>(
        apiRoutes.achievements.recordByExercise(exerciseId),
      );
      return response.data;
    },
    enabled: !!exerciseId,
  });
};
