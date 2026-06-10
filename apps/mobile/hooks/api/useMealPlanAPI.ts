import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IMealPlan, IUserMealPlan } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { mealPlanKeys } from '@/api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetMyMealPlans = () => {
  return useQuery({
    queryKey: mealPlanKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IMealPlan[]>(apiRoutes.mealPlans.getAll);
      return response.data;
    },
  });
};

export const useGetMealPlanById = (id: string) => {
  return useQuery({
    queryKey: mealPlanKeys.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<IMealPlan>(apiRoutes.mealPlans.getById(id));
      return response.data;
    },
    enabled: !!id,
  });
};

export const useGetUserMealPlans = (userId: string) => {
  return useQuery({
    queryKey: mealPlanKeys.byUserId(userId),
    queryFn: async () => {
      const response = await apiClient.get<IMealPlan[]>(apiRoutes.mealPlans.getByUserId(userId));
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useGetActiveMealPlan = () => {
  return useQuery({
    queryKey: mealPlanKeys.active,
    queryFn: async () => {
      const response = await apiClient.get<IUserMealPlan | null>(apiRoutes.mealPlans.active);
      return response.data;
    },
  });
};

export const useGetPublicMealPlans = (search?: string) => {
  return useQuery({
    queryKey: mealPlanKeys.public(search),
    queryFn: async () => {
      const response = await apiClient.get<{ data: IMealPlan[] }>(apiRoutes.mealPlans.getPublic, {
        params: { search },
      });
      return response.data.data;
    },
  });
};

export const useGetFriendsMealPlans = () => {
  return useQuery({
    queryKey: mealPlanKeys.friends,
    queryFn: async () => {
      const response = await apiClient.get<IMealPlan[]>(apiRoutes.mealPlans.getFriends);
      return response.data;
    },
  });
};

export const useGetSavedMealPlans = () => {
  return useQuery({
    queryKey: mealPlanKeys.saved,
    queryFn: async () => {
      const response = await apiClient.get<IMealPlan[]>(apiRoutes.mealPlans.getSaved);
      return response.data;
    },
  });
};

// ─── Mutations ──────────────────────────────────────

interface CreateMealPlanData {
  name: string;
  description?: string;
  visibilityTypeId?: number;
  totalDays?: number;
}

export const useCreateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMealPlanData) => {
      const response = await apiClient.post<IMealPlan>(apiRoutes.mealPlans.getAll, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
    },
  });
};

export const useUpdateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateMealPlanData> }) => {
      const response = await apiClient.patch<IMealPlan>(apiRoutes.mealPlans.getById(id), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
    },
  });
};

export const useDeleteMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiRoutes.mealPlans.getById(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
    },
  });
};

export const useSaveMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<IMealPlan>(apiRoutes.mealPlans.save(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.saved });
    },
  });
};

export const useUnsaveMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiRoutes.mealPlans.unsave(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.saved });
    },
  });
};

export const useActivateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, startDay }: { id: string; startDay?: number }) => {
      const response = await apiClient.post<IUserMealPlan>(apiRoutes.mealPlans.activate(id), { startDay });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.active });
    },
  });
};

export const useDeactivateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(apiRoutes.mealPlans.deactivate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.active });
    },
  });
};

// ─── Nested resources ───────────────────────────────

export const useAddPlanDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: { dayNumber: number; notes?: string } }) => {
      const response = await apiClient.post(apiRoutes.mealPlans.days(planId), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.planId) });
    },
  });
};

export const useRemovePlanDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, dayId }: { planId: string; dayId: string }) => {
      await apiClient.delete(apiRoutes.mealPlans.day(planId, dayId));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.planId) });
    },
  });
};

export const useAddPlanMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      dayId,
      data,
    }: {
      planId: string;
      dayId: string;
      data: { mealTypeId: number; order: number; timeSuggestion?: string };
    }) => {
      const response = await apiClient.post(apiRoutes.mealPlans.meals(planId, dayId), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.planId) });
    },
  });
};

export const useRemovePlanMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, mealId }: { planId: string; mealId: string }) => {
      await apiClient.delete(apiRoutes.mealPlans.meal(planId, mealId));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.planId) });
    },
  });
};

export const useAddPlanMealItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      mealId,
      data,
    }: {
      planId: string;
      mealId: string;
      data: { foodId: number; unitId: number; amount: number };
    }) => {
      const response = await apiClient.post(apiRoutes.mealPlans.mealItems(planId, mealId), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.planId) });
    },
  });
};

interface UpdatePlanMealData {
  mealTypeId?: number;
  order?: number;
  timeSuggestion?: string;
}

export const useUpdatePlanMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, mealId, data }: { planId: string; mealId: string; data: UpdatePlanMealData }) => {
      const response = await apiClient.patch(apiRoutes.mealPlans.meal(planId, mealId), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.planId) });
    },
  });
};

export const useUpdatePlanMealItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      itemId,
      data,
    }: {
      planId: string;
      itemId: string;
      data: { amount: number; unitId: number };
    }) => {
      const response = await apiClient.patch(apiRoutes.mealPlans.mealItem(planId, itemId), data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.planId) });
    },
  });
};

export const useRemovePlanMealItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, itemId }: { planId: string; itemId: string }) => {
      await apiClient.delete(apiRoutes.mealPlans.mealItem(planId, itemId));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.byId(variables.planId) });
    },
  });
};
