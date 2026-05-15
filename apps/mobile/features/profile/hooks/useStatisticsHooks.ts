import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type {
  IWorkoutStatistics,
  IExerciseProgress,
  IBodyMetricProgress,
  IStatisticsSummary,
  IFrequentExercise,
} from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { statisticsKeys } from '@/api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useWorkoutStatistics = (from?: string, to?: string) => {
  return useQuery({
    queryKey: statisticsKeys.workouts(from, to),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await apiClient.get<IWorkoutStatistics>(
        apiRoutes.statistics.workouts,
        { params },
      );
      return response.data;
    },
  });
};

export const useFrequentExercises = (search?: string) => {
  return useInfiniteQuery({
    queryKey: statisticsKeys.frequentExercises(search),
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = { page: pageParam, limit: 20 };
      if (search) params.search = search;
      const response = await apiClient.get<{
        data: IFrequentExercise[];
        meta: { page: number; limit: number; total: number };
      }>(apiRoutes.statistics.frequentExercises, { params });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
  });
};

export const useExerciseProgress = (exerciseId: string, from?: string, to?: string) => {
  return useQuery({
    queryKey: statisticsKeys.exerciseProgress(exerciseId, from, to),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await apiClient.get<IExerciseProgress>(
        apiRoutes.statistics.exerciseProgress(exerciseId),
        { params },
      );
      return response.data;
    },
    enabled: !!exerciseId,
  });
};

export const useBodyMetricProgress = (metricTypeId: string, from?: string, to?: string) => {
  return useQuery({
    queryKey: statisticsKeys.bodyMetricProgress(metricTypeId, from, to),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await apiClient.get<IBodyMetricProgress>(
        apiRoutes.statistics.bodyMetricProgress(metricTypeId),
        { params },
      );
      return response.data;
    },
    enabled: !!metricTypeId,
  });
};

export const useStatisticsSummary = () => {
  return useQuery({
    queryKey: statisticsKeys.summary,
    queryFn: async () => {
      const response = await apiClient.get<IStatisticsSummary>(apiRoutes.statistics.summary);
      return response.data;
    },
  });
};
