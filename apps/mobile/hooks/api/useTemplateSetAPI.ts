import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ITemplateSet } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { templateKeys } from '@/api/queries/query-keys';

// ─── Mutations ──────────────────────────────────────

interface CreateTemplateSetData {
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
}

export const useCreateTemplateSet = (templateId: string, exerciseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateSetData) => {
      const response = await apiClient.post<ITemplateSet>(
        apiRoutes.templates.sets(templateId, exerciseId),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(templateId) });
    },
  });
};

interface UpdateTemplateSetData {
  order?: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
}

export const useUpdateTemplateSet = (templateId: string, exerciseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTemplateSetData }) => {
      const response = await apiClient.patch<ITemplateSet>(
        apiRoutes.templates.set(templateId, exerciseId, id),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(templateId) });
    },
  });
};

export const useDeleteTemplateSet = (templateId: string, exerciseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(apiRoutes.templates.set(templateId, exerciseId, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(templateId) });
    },
  });
};
