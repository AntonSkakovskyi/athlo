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
    retry: (failureCount, error: any) => {
      // Don't retry if the template is not found (404)
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

export const useGetUserTemplates = (userId: string) => {
  return useQuery({
    queryKey: templateKeys.byUserId(userId),
    queryFn: async () => {
      const response = await apiClient.get<IWorkoutTemplate[]>(apiRoutes.templates.getByUserId(userId));
      return response.data;
    },
    enabled: !!userId,
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
      const response = await apiClient.get<(IUserWorkoutTemplate & { workoutTemplate?: IWorkoutTemplate & { creatorNickname?: string } })[]>(apiRoutes.templates.getSaved);
      return response.data;
    },
  });
};

export const useGetFriendsTemplates = () => {
  return useQuery({
    queryKey: [...templateKeys.all, 'friends'],
    queryFn: async () => {
      const response = await apiClient.get<(IWorkoutTemplate & { creatorNickname?: string })[]>(apiRoutes.templates.getFriends);
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
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: templateKeys.byId(id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};

export interface SaveTemplateInput {
  id: string;
  template: IWorkoutTemplate & { creatorNickname?: string };
}

export const useSaveTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: SaveTemplateInput) => apiClient.post(apiRoutes.templates.save(id)),
    onMutate: async ({ id, template }: SaveTemplateInput) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.saved });
      const previousSaved = queryClient.getQueryData(templateKeys.saved);
      queryClient.setQueryData(templateKeys.saved, (old: any) => [
        ...(old ?? []),
        { id: -Date.now(), userId: -1, workoutTemplateId: Number(id), workoutTemplate: template },
      ]);
      return { previousSaved };
    },
    onError: (err: unknown, _input, context) => {
      const isAlreadySaved =
        (err as any)?.response?.data?.message === 'Template is already saved';
      if (!isAlreadySaved && context?.previousSaved !== undefined) {
        queryClient.setQueryData(templateKeys.saved, context.previousSaved);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.saved });
    },
  });
};

export const useUnsaveTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(apiRoutes.templates.save(id)),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.saved });
      const previousSaved = queryClient.getQueryData(templateKeys.saved);
      queryClient.setQueryData(templateKeys.saved, (old: any) =>
        (old ?? []).filter((s: any) => s.workoutTemplateId !== Number(id)),
      );
      return { previousSaved };
    },
    onError: (_err, _id, context) => {
      if (context?.previousSaved !== undefined) {
        queryClient.setQueryData(templateKeys.saved, context.previousSaved);
      }
    },
    onSettled: () => {
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

export const useCreateTemplateFromWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, name }: { workoutId: string; name?: string }) => {
      const response = await apiClient.post<IWorkoutTemplate>(
        apiRoutes.templates.createFromWorkout(workoutId),
        { name },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};
