import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ITemplateExercise } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { templateKeys } from '@/api/queries/query-keys';

// ─── Mutations ──────────────────────────────────────

interface CreateTemplateExerciseData {
  exerciseId: number;
  order: number;
  restTime?: number;
}

export const useCreateTemplateExercise = (templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateExerciseData) => {
      const response = await apiClient.post<ITemplateExercise>(
        apiRoutes.templates.exercises(templateId),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};

interface UpdateTemplateExerciseData {
  order?: number;
  restTime?: number;
}

export const useUpdateTemplateExercise = (templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTemplateExerciseData }) => {
      const response = await apiClient.patch<ITemplateExercise>(
        apiRoutes.templates.exercise(templateId, id),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};

export const useDeleteTemplateExercise = (templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(apiRoutes.templates.exercise(templateId, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};
