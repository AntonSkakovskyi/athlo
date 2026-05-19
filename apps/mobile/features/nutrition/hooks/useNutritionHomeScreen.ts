import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useGetDailySummary,
  useCreateLogMeal,
  useDeleteLogMeal,
  useUpdateLogMeal,
  useAddLogMealItem,
  useDeleteLogMealItem,
  useAddWaterLog,
  useDeleteWaterLog,
  useGetMealTypes,
  useGetActiveMealPlan,
  useGetMealPlanById,
  useUpdateWaterLog,
  useUpdateLogMealItem,
  type LogMealWithItems,
  type LogMealItemApi,
} from '@/features/nutrition/hooks';
import type { MealItemDisplay } from '@/features/nutrition/components/MealCard/MealCard';

export interface SelectedPlanItem {
  foodId: number;
  unitId: number;
  amount: number;
  foodName: string;
}

interface PlanMealItemWithRelations {
  id: number;
  planMealId: number;
  foodId: number;
  unitId: number;
  amount: number;
  food?: { id: number; name: string; calories: number; proteins: number; fats: number; carbs: number; brand: string | null };
  unit?: { id: number; name: string };
}

export interface PlanMealWithItems {
  id: number;
  planDayId: number;
  mealTypeId: number;
  order: number;
  timeSuggestion: string | null;
  mealType?: { id: number; name: string };
  items?: PlanMealItemWithRelations[];
}

export function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  const updateMeal = useUpdateLogMeal();
  const updateMealItem = useUpdateLogMealItem();
  const addMealItem = useAddLogMealItem();
  const deleteMealItem = useDeleteLogMealItem();
  const addWater = useAddWaterLog();
  const updateWater = useUpdateWaterLog();
  const deleteWater = useDeleteWaterLog();

  const [selectedMealTypeId, setSelectedMealTypeId] = useState<number | null>(null);
  const [showAddMealSheet, setShowAddMealSheet] = useState(false);
  const [editingMeal, setEditingMeal] = useState<LogMealWithItems | null>(null);
  const [editingMealItem, setEditingMealItem] = useState<{ mealId: number; item: LogMealItemApi } | null>(null);

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

  const handleDateSelect = useCallback((d: Date) => {
    setDate(getDateString(d));
  }, []);

  const handleAddMeal = useCallback(() => {
    setShowAddMealSheet(true);
  }, []);

  const handleConfirmAddMeal = useCallback(
    async (mealTypeId: number, items: SelectedPlanItem[], name?: string, consumedAt?: string) => {
      const mealTypeName = mealTypes?.find((t) => t.id === mealTypeId)?.name;
      const meal = await createMeal.mutateAsync({ 
        mealTypeId, 
        name: name || mealTypeName,
        consumedAt,
        dayLogDate: date
      });
      if (items.length > 0) {
        await Promise.all(
          items.map((item) =>
            addMealItem.mutateAsync({
              mealId: String(meal.id),
              data: { foodId: item.foodId, unitId: item.unitId, amount: item.amount },
            }),
          ),
        );
      }
      setShowAddMealSheet(false);
    },
    [mealTypes, createMeal, addMealItem],
  );

  const handleDeleteMeal = useCallback(
    (id: number) => {
      Alert.alert('Delete meal?', 'This will remove the meal and all its items.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMeal.mutate(String(id)) },
      ]);
    },
    [deleteMeal],
  );

  const handleEditMeal = useCallback(
    (meal: LogMealWithItems) => {
      setEditingMeal(meal);
    },
    [],
  );

  const handleConfirmEditMeal = useCallback(
    async (mealId: number, data: { mealTypeId?: number; name?: string; consumedAt?: string }) => {
      await updateMeal.mutateAsync({ id: String(mealId), data });
      setEditingMeal(null);
    },
    [updateMeal],
  );

  const handleDeleteMealItem = useCallback(
    (itemId: number) => {
      deleteMealItem.mutate(String(itemId));
      setEditingMealItem(null);
    },
    [deleteMealItem],
  );

  const handleEditMealItem = useCallback(
    (mealId: number, itemId: number) => {
      const meal = (summary?.meals as LogMealWithItems[] | undefined)?.find((m) => m.id === mealId);
      const item = meal?.items?.find((i) => i.id === itemId);
      if (item) {
        setEditingMealItem({ mealId, item });
      }
    },
    [summary],
  );

  const handleUpdateMealItem = useCallback(
    async (itemId: number, amount: number, unitId: number) => {
      await updateMealItem.mutateAsync({
        itemId: String(itemId),
        data: { amount, unitId },
      });
      setEditingMealItem(null);
    },
    [updateMealItem],
  );

  const handleSwapMealItem = useCallback(
    (mealId: number, itemId: number) => {
      setEditingMealItem(null);
      router.push({
        pathname: '/(app)/(nutrition)/food-picker',
        params: { mealId: String(mealId), swapItemId: String(itemId), mode: 'logMeal' },
      } as never);
    },
    [router],
  );

  const handleAddWater = useCallback(
    (ml: number, consumedAt?: string) => {
      addWater.mutate({ amountMl: ml, consumedAt });
    },
    [addWater],
  );

  const handleUpdateWater = useCallback(
    (id: number, amountMl: number, consumedAt?: string) => {
      updateWater.mutate({ id: String(id), amountMl, consumedAt });
    },
    [updateWater],
  );

  const handleDeleteWater = useCallback(
    (id: number) => {
      deleteWater.mutate(String(id));
    },
    [deleteWater],
  );

  const handleAddFoodToMeal = useCallback(
    (mealId: number) => {
      router.push({
        pathname: '/(app)/(nutrition)/food-picker',
        params: { mealId: String(mealId), mode: 'logMeal' },
      } as never);
    },
    [router],
  );

  const handleApplyPlanDay = useCallback(async () => {
    if (!planDayMeals.length) return;
    
    Alert.alert(
      'Apply Today\'s Plan?',
      'This will log all meals from your active plan for this date.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            for (const planMeal of planDayMeals) {
              const mealTypeName = mealTypes?.find(t => t.id === planMeal.mealTypeId)?.name;
              
              let consumedAt = new Date(date + 'T00:00:00');
              if (planMeal.timeSuggestion) {
                const [h, m] = planMeal.timeSuggestion.split(':').map(Number);
                consumedAt.setHours(h, m, 0, 0);
              } else {
                const defaultHours: Record<number, number> = { 1: 8, 2: 13, 3: 19, 4: 16 }; 
                consumedAt.setHours(defaultHours[planMeal.mealTypeId] || 12, 0, 0, 0);
              }

              const meal = await createMeal.mutateAsync({
                mealTypeId: planMeal.mealTypeId,
                name: mealTypeName,
                consumedAt: consumedAt.toISOString(),
              });

              if (planMeal.items?.length) {
                await Promise.all(
                  planMeal.items.map(item =>
                    addMealItem.mutateAsync({
                      mealId: String(meal.id),
                      data: {
                        foodId: item.foodId,
                        unitId: item.unitId,
                        amount: item.amount,
                      }
                    })
                  )
                );
              }
            }
          }
        }
      ]
    );
  }, [planDayMeals, mealTypes, date, createMeal, addMealItem]);

  // Which plan day matches the currently viewed date
  const activePlanCurrentDay = useMemo(() => {
    if (!activePlan?.startedAt || !activePlanDetails) return null;
    const days = (activePlanDetails as unknown as { days?: Array<{ id: number; dayNumber: number; meals?: PlanMealWithItems[] }> }).days;
    if (!days?.length) return null;
    const startDate = new Date(activePlan.startedAt);
    startDate.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date + 'T00:00:00');
    const daysSince = Math.floor((selectedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 0) return null;
    const totalDays = activePlanDetails.totalDays || days.length;
    const planDayNumber = (daysSince % totalDays) + 1;
    return days.find((d) => d.dayNumber === planDayNumber) ?? null;
  }, [activePlan, activePlanDetails, date]);

  const planDayMeals = useMemo((): PlanMealWithItems[] => {
    return (activePlanCurrentDay?.meals as PlanMealWithItems[] | undefined) ?? [];
  }, [activePlanCurrentDay]);

  const meals = useMemo(() => {
    const raw = (summary?.meals ?? []) as LogMealWithItems[];
    const filtered = selectedMealTypeId
      ? raw.filter((m) => m.mealTypeId === selectedMealTypeId)
      : raw;
    return filtered.map((meal) => ({
      ...meal,
      items: (meal.items ?? []).map(
        (item): MealItemDisplay & { proteins: number; fats: number; carbs: number } => {
          const multiplier = Number(item.calculatedWeightG ?? item.amount) / 100;
          return {
            id: item.id,
            foodName: item.food?.name ?? 'Unknown food',
            amount: item.amount,
            unitName: item.unit?.name ?? '',
            calories: item.food ? item.food.calories * multiplier : 0,
            proteins: item.food ? item.food.proteins * multiplier : 0,
            fats: item.food ? item.food.fats * multiplier : 0,
            carbs: item.food ? item.food.carbs * multiplier : 0,
          };
        },
      ),
    }));
  }, [summary, selectedMealTypeId]);

  const waterLogs = useMemo(() => summary?.waterLogs ?? [], [summary]);

  return {
    date,
    isToday,
    summary,
    isLoading,
    mealTypes,
    activePlan,
    activePlanDetails,
    planDayMeals,
    meals,
    waterLogs,
    selectedMealTypeId,
    setSelectedMealTypeId,
    showAddMealSheet,
    setShowAddMealSheet,
    editingMeal,
    setEditingMeal,
    handlePrevDay,
    handleNextDay,
    handleDateSelect,
    handleAddMeal,
    handleConfirmAddMeal,
    handleDeleteMeal,
    handleEditMeal,
    handleConfirmEditMeal,
    handleDeleteMealItem,
    handleEditMealItem,
    handleUpdateMealItem,
    handleSwapMealItem,
    handleAddWater,
    handleUpdateWater,
    handleDeleteWater,
    handleAddFoodToMeal,
    handleApplyPlanDay,
    isCreateMealPending: createMeal.isPending,
    isUpdateItemPending: updateMealItem.isPending,
    editingMealItem,
    setEditingMealItem,
    router,
  };
}
