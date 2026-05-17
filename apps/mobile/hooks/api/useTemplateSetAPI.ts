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

export const useCreateTemplateSet = (templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      data,
    }: {
      exerciseId: string;
      data: CreateTemplateSetData;
    }) => {
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

export const useUpdateTemplateSet = (templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      setId,
      data,
    }: {
      exerciseId: string;
      setId: string;
      data: UpdateTemplateSetData;
    }) => {
      const response = await apiClient.patch<ITemplateSet>(
        apiRoutes.templates.set(templateId, exerciseId, setId),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(templateId) });
    },
  });
};

export const useDeleteTemplateSet = (templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, setId }: { exerciseId: string; setId: string }) =>
      apiClient.delete(apiRoutes.templates.set(templateId, exerciseId, setId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(templateId) });
    },
  });
};
