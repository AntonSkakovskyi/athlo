import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IFood, IPaginatedResponse } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { foodKeys } from '@/api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useSearchFoods = (search?: string) => {
  return useQuery({
    queryKey: foodKeys.search(search ?? ''),
    queryFn: async () => {
      const params: Record<string, string | number> = { page: 1, limit: 1000 };
      if (search) params.search = search;
      const response = await apiClient.get<IPaginatedResponse<IFood>>(apiRoutes.foods.getAll, { params });
      return response.data.data;
    },
  });
};

export const useInfiniteSearchFoods = (search?: string) => {
  return useInfiniteQuery({
    queryKey: [...foodKeys.search(search ?? ''), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = { page: pageParam, limit: 20 };
      if (search) params.search = search;
      const response = await apiClient.get<IPaginatedResponse<IFood>>(apiRoutes.foods.getAll, { params });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
  });
};

export const useGetFoodById = (id: string) => {
  return useQuery({
    queryKey: foodKeys.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<IFood>(apiRoutes.foods.getById(id));
      return response.data;
    },
    enabled: !!id,
  });
};

// ─── Mutations ──────────────────────────────────────

interface CreateFoodData {
  name: string;
  brand?: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export const useCreateFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFoodData) => {
      const response = await apiClient.post<IFood>(apiRoutes.foods.getAll, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.all });
    },
  });
};

export const useUpdateFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateFoodData> }) => {
      const response = await apiClient.patch<IFood>(apiRoutes.foods.getById(id), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: foodKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: foodKeys.all });
    },
  });
};

export const useDeleteFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiRoutes.foods.getById(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.all });
    },
  });
};
