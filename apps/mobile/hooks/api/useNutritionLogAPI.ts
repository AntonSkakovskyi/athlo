import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ILogMeal, IWaterLog } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { nutritionLogKeys } from '@/api/queries/query-keys';

// ─── Extended meal types (API returns relations) ────

export interface LogMealItemApi {
  id: number;
  logMealId: number;
  foodId: number;
  unitId: number;
  amount: number;
  calculatedWeightG: number | null;
  food?: { id: number; name: string; calories: number; proteins: number; fats: number; carbs: number; brand: string | null };
  unit?: { id: number; name: string };
}

export interface LogMealWithItems extends ILogMeal {
  mealType?: { id: number; name: string };
  items?: LogMealItemApi[];
}

// ─── Daily Summary ──────────────────────────────────

interface DailySummary {
  date: string;
  totalCalories: number;
  totalProteins: number;
  totalFats: number;
  totalCarbs: number;
  totalWaterMl: number;
  mealsCount: number;
  meals: LogMealWithItems[];
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
      const response = await apiClient.get<LogMealWithItems[]>(
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
      const response = await apiClient.post<LogMealWithItems>(apiRoutes.nutritionLog.meals, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};

interface UpdateLogMealData {
  mealTypeId?: number;
  name?: string;
  consumedAt?: string;
}

export const useUpdateLogMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLogMealData }) => {
      const response = await apiClient.patch<LogMealWithItems>(apiRoutes.nutritionLog.mealById(id), data);
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
    mutationFn: async (data: { amountMl: number; consumedAt?: string }) => {
      const response = await apiClient.post<IWaterLog>(apiRoutes.nutritionLog.water, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
    },
  });
};

export const useUpdateWaterLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; amountMl?: number; consumedAt?: string }) => {
      const { id, ...body } = data;
      const response = await apiClient.patch<IWaterLog>(apiRoutes.nutritionLog.waterById(id), body);
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
