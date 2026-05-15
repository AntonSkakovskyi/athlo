import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ILogMeal, IWaterLog } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { nutritionLogKeys } from '@/api/queries/query-keys';

// ─── Daily Summary ──────────────────────────────────

interface DailySummary {
  date: string;
  totalCalories: number;
  totalProteins: number;
  totalFats: number;
  totalCarbs: number;
  totalWaterMl: number;
  mealsCount: number;
  meals: ILogMeal[];
  waterLogs: IWaterLog[];
}

export const useGetDailySummary = (date: string) => {
  return useQuery({
    queryKey: nutritionLogKeys.summary(date),
    queryFn: async () => {
      const response = await apiClient.get<DailySummary>(
        `${apiRoutes.nutritionLog.summary}?date=${date}`,
      );
      return response.data;
    },
    enabled: !!date,
  });
};

// ─── Nutrition History ──────────────────────────────

export interface NutritionHistoryDay {
  date: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  waterMl: number;
}

export const useGetNutritionHistory = (from: string, to: string) => {
  return useQuery({
    queryKey: nutritionLogKeys.history(from, to),
    queryFn: async () => {
      const response = await apiClient.get<NutritionHistoryDay[]>(
        `${apiRoutes.nutritionLog.history}?from=${from}&to=${to}`,
      );
      return response.data;
    },
    enabled: !!from && !!to,
  });
};

// ─── Log Meals ──────────────────────────────────────

export const useGetLogMealsByDate = (date: string) => {
  return useQuery({
    queryKey: nutritionLogKeys.meals(date),
    queryFn: async () => {
      const response = await apiClient.get<ILogMeal[]>(
        `${apiRoutes.nutritionLog.meals}?date=${date}`,
      );
      return response.data;
    },
    enabled: !!date,
  });
};

interface CreateLogMealData {
  mealTypeId?: number;
  name?: string;
  originalPlanMealId?: number;
}

export const useCreateLogMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLogMealData) => {
      const response = await apiClient.post<ILogMeal>(apiRoutes.nutritionLog.meals, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};

export const useDeleteLogMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiRoutes.nutritionLog.mealById(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};

// ─── Log Meal Items ─────────────────────────────────

interface CreateLogMealItemData {
  foodId: number;
  unitId: number;
  amount: number;
  calculatedWeightG?: number;
}

export const useAddLogMealItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealId, data }: { mealId: string; data: CreateLogMealItemData }) => {
      const response = await apiClient.post(apiRoutes.nutritionLog.mealItems(mealId), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};

export const useDeleteLogMealItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(apiRoutes.nutritionLog.mealItem(itemId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};

// ─── Water Logs ─────────────────────────────────────

export const useGetWaterLogs = (date: string) => {
  return useQuery({
    queryKey: nutritionLogKeys.water(date),
    queryFn: async () => {
      const response = await apiClient.get<IWaterLog[]>(
        `${apiRoutes.nutritionLog.water}?date=${date}`,
      );
      return response.data;
    },
    enabled: !!date,
  });
};

export const useAddWaterLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { amountMl: number }) => {
      const response = await apiClient.post<IWaterLog>(apiRoutes.nutritionLog.water, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};

export const useDeleteWaterLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiRoutes.nutritionLog.waterById(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};
