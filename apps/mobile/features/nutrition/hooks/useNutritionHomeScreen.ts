import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useGetDailySummary,
  useCreateLogMeal,
  useDeleteLogMeal,
  useAddWaterLog,
  useDeleteWaterLog,
  useGetMealTypes,
  useGetActiveMealPlan,
  useGetMealPlanById,
} from '@/features/nutrition/hooks';

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useNutritionHomeScreen() {
  const router = useRouter();

  const today = getDateString(new Date());
  const [date, setDate] = useState(today);
  const isToday = date === today;

  const { data: summary, isLoading } = useGetDailySummary(date);
  const { data: mealTypes } = useGetMealTypes();
  const { data: activePlan } = useGetActiveMealPlan();
  const { data: activePlanDetails } = useGetMealPlanById(
    activePlan?.mealPlanId ? String(activePlan.mealPlanId) : '',
  );

  const createMeal = useCreateLogMeal();
  const deleteMeal = useDeleteLogMeal();
  const addWater = useAddWaterLog();
  const deleteWater = useDeleteWaterLog();

  const [selectedMealTypeId, setSelectedMealTypeId] = useState<number | null>(null);

  const handlePrevDay = useCallback(() => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setDate(getDateString(d));
  }, [date]);

  const handleNextDay = useCallback(() => {
    if (isToday) return;
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setDate(getDateString(d));
  }, [date, isToday]);

  const handleAddMeal = useCallback(() => {
    if (!selectedMealTypeId) {
      const firstType = mealTypes?.[0];
      if (firstType) {
        createMeal.mutate({ mealTypeId: firstType.id, name: firstType.name });
      }
      return;
    }
    const mealTypeName = mealTypes?.find((t) => t.id === selectedMealTypeId)?.name;
    createMeal.mutate({ mealTypeId: selectedMealTypeId, name: mealTypeName });
  }, [selectedMealTypeId, mealTypes, createMeal]);

  const handleDeleteMeal = useCallback((id: number) => {
    Alert.alert('Delete meal?', 'This will remove the meal and all its items.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMeal.mutate(String(id)) },
    ]);
  }, [deleteMeal]);

  const handleAddWater = useCallback((ml: number) => {
    addWater.mutate({ amountMl: ml });
  }, [addWater]);

  const handleDeleteWater = useCallback((id: number) => {
    deleteWater.mutate(String(id));
  }, [deleteWater]);

  const handleAddFoodToMeal = useCallback((mealId: number) => {
    router.push({
      pathname: '/(app)/(nutrition)/food-picker',
      params: { mealId: String(mealId), mode: 'logMeal' },
    } as never);
  }, [router]);

  const meals = useMemo(() => summary?.meals ?? [], [summary]);
  const waterLogs = useMemo(() => summary?.waterLogs ?? [], [summary]);

  return {
    date,
    isToday,
    summary,
    isLoading,
    mealTypes,
    activePlan,
    activePlanDetails,
    meals,
    waterLogs,
    selectedMealTypeId,
    setSelectedMealTypeId,
    handlePrevDay,
    handleNextDay,
    handleAddMeal,
    handleDeleteMeal,
    handleAddWater,
    handleDeleteWater,
    handleAddFoodToMeal,
    isCreateMealPending: createMeal.isPending,
    router,
  };
}
