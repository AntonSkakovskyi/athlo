import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IWorkoutTemplate, IWorkout, IUserWorkoutTemplate, IPaginatedResponse } from '@athlo/shared';
import type { TemplateWithRelations } from '@/features/workout/types';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { templateKeys, workoutKeys } from '@/api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetMyTemplates = () => {
  return useQuery({
    queryKey: templateKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IWorkoutTemplate[]>(apiRoutes.templates.getAll);
      return response.data;
    },
  });
};

export const useGetTemplateById = (id: string) => {
  return useQuery({
    queryKey: templateKeys.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<TemplateWithRelations>(apiRoutes.templates.getById(id));
      return response.data;
    },
    enabled: !!id,
  });
};

export const useGetPublicTemplates = () => {
  return useQuery({
    queryKey: templateKeys.public,
    queryFn: async () => {
      const response = await apiClient.get<IPaginatedResponse<IWorkoutTemplate>>(apiRoutes.templates.getPublic, {
        params: { page: 1, limit: 1000 },
      });
      return response.data.data;
    },
  });
};

export const useInfinitePublicTemplates = (search?: string) => {
  return useInfiniteQuery({
    queryKey: [...templateKeys.publicInfinite, { search }],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = { page: pageParam, limit: 10 };
      if (search) params.search = search;
      const response = await apiClient.get<IPaginatedResponse<IWorkoutTemplate & { creatorNickname?: string }>>(
        apiRoutes.templates.getPublic,
        { params },
      );
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
  });
};

export const useGetSavedTemplates = () => {
  return useQuery({
    queryKey: templateKeys.saved,
    queryFn: async () => {
      const response = await apiClient.get<(IUserWorkoutTemplate & { workoutTemplate?: IWorkoutTemplate })[]>(apiRoutes.templates.getSaved);
      return response.data;
    },
  });
};

// ─── Mutations ──────────────────────────────────────

interface CreateTemplateData {
  name: string;
  description?: string;
  visibilityTypeId?: number;
}

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      const response = await apiClient.post<IWorkoutTemplate>(apiRoutes.templates.getAll, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};

interface UpdateTemplateData {
  name?: string;
  description?: string;
  visibilityTypeId?: number;
}

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTemplateData }) => {
      const response = await apiClient.patch<IWorkoutTemplate>(apiRoutes.templates.getById(id), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(apiRoutes.templates.getById(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};

export const useSaveTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.post(apiRoutes.templates.save(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.saved });
    },
  });
};

export const useUnsaveTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(apiRoutes.templates.save(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.saved });
    },
  });
};

export const useStartFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<IWorkout>(apiRoutes.templates.start(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
};
