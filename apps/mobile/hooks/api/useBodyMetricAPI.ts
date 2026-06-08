import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IBodyMetric, IMetricType, IUnit } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { bodyMetricKeys } from '@/api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetUnits = () => {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await apiClient.get<IUnit[]>(apiRoutes.bodyMetrics.units);
      return response.data;
    },
  });
};

export const useGetMetricTypes = () => {
  return useQuery({
    queryKey: bodyMetricKeys.metricTypes,
    queryFn: async () => {
      const response = await apiClient.get<IMetricType[]>(apiRoutes.bodyMetrics.metricTypes);
      return response.data;
    },
  });
};

export const useGetBodyMetrics = (metricTypeId?: string) => {
  return useQuery({
    queryKey: metricTypeId ? bodyMetricKeys.byType(metricTypeId) : bodyMetricKeys.all,
    queryFn: async () => {
      const params = metricTypeId ? `?metricTypeId=${metricTypeId}` : '';
      const response = await apiClient.get<IBodyMetric[]>(`${apiRoutes.bodyMetrics.getAll}${params}`);
      return response.data;
    },
  });
};

// ─── Mutations ──────────────────────────────────────

interface CreateBodyMetricData {
  metricTypeId: number;
  value: number;
  recordedAt?: string;
}

export const useCreateBodyMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBodyMetricData) => {
      const response = await apiClient.post<IBodyMetric>(apiRoutes.bodyMetrics.getAll, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bodyMetricKeys.all });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
};

interface UpdateBodyMetricData {
  value?: number;
  recordedAt?: string;
}

export const useUpdateBodyMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBodyMetricData }) => {
      const response = await apiClient.patch<IBodyMetric>(apiRoutes.bodyMetrics.getById(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bodyMetricKeys.all });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
};

export const useDeleteBodyMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiRoutes.bodyMetrics.getById(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bodyMetricKeys.all });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
};
