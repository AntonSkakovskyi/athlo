import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { IMealPlan } from '@athlo/shared';
import {
  useGetMealPlanById,
  useUpdateMealPlan,
  useActivateMealPlan,
  useAddPlanDay,
  useRemovePlanDay,
  useAddPlanMeal,
  useRemovePlanMeal,
  useUpdatePlanMeal,
  useRemovePlanMealItem,
  useGetMealTypes,
} from '@/features/nutrition/hooks';

export interface MealPlanWithRelations extends IMealPlan {
  days?: PlanDayWithMeals[];
}

export interface PlanDayWithMeals {
  id: number;
  dayNumber: number;
  notes: string | null;
  meals?: PlanMealWithItems[];
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

export interface PlanMealItemWithRelations {
  id: number;
  planMealId: number;
  foodId: number;
  unitId: number;
  amount: number;
  food?: { id: number; name: string; calories: number; proteins: number; fats: number; carbs: number };
  unit?: { id: number; name: string };
}

export function getVisibilityLabel(id: number): string {
  switch (id) {
    case 1: return '🔒 Private';
    case 2: return '🌐 Public';
    case 3: return '👥 Friends Only';
    default: return '🔒 Private';
  }
}

export function useMealPlanDetailScreen(id: string) {
  const router = useRouter();

  const { data: plan, isLoading } = useGetMealPlanById(id);
  const { data: mealTypes } = useGetMealTypes();
  const updatePlan = useUpdateMealPlan();
  const activatePlan = useActivateMealPlan();
  const addDay = useAddPlanDay();
  const removeDay = useRemovePlanDay();
  const addMeal = useAddPlanMeal();
  const removeMeal = useRemovePlanMeal();
  const updateMeal = useUpdatePlanMeal();
  const removeItem = useRemovePlanMealItem();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const days = useMemo(() => {
    const rawDays = (plan as MealPlanWithRelations | undefined)?.days;
    if (!rawDays) return [];
    return [...rawDays].sort((a, b) => a.dayNumber - b.dayNumber);
  }, [plan]);

  const currentDay = days[selectedDayIndex] ?? null;

  const currentDayMeals = useMemo(() => {
    if (!currentDay?.meals) return [];
    return [...currentDay.meals].sort((a, b) => a.order - b.order);
  }, [currentDay]);

  const dayMacros = useMemo(() => {
    let calories = 0;
    let proteins = 0;
    let fats = 0;
    let carbs = 0;
    for (const meal of currentDayMeals) {
      for (const item of meal.items ?? []) {
        if (item.food) {
          const factor = item.amount / 100;
          calories += item.food.calories * factor;
          proteins += item.food.proteins * factor;
          fats += item.food.fats * factor;
          carbs += item.food.carbs * factor;
        }
      }
    }
    return { calories, proteins, fats, carbs };
  }, [currentDayMeals]);

  const handleActivate = () => {
    activatePlan.mutate(id);
  };

  const handleAddDay = () => {
    const nextDayNumber = days.length > 0 ? Math.max(...days.map((d) => d.dayNumber)) + 1 : 1;
    addDay.mutate({ planId: id, data: { dayNumber: nextDayNumber } });
  };

  const handleRemoveDay = (dayId: number) => {
    Alert.alert('Delete Day?', 'All meals in this day will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeDay.mutate({ planId: id, dayId: String(dayId) });
          if (selectedDayIndex > 0 && selectedDayIndex >= days.length - 1) {
            setSelectedDayIndex(selectedDayIndex - 1);
          }
        },
      },
    ]);
  };

  const handleAddMeal = (mealTypeId: number, timeSuggestion?: string) => {
    if (!currentDay) return;
    const order = currentDayMeals.length + 1;
    addMeal.mutate({
      planId: id,
      dayId: String(currentDay.id),
      data: { mealTypeId, order, timeSuggestion },
    });
    setShowAddMeal(false);
  };

  const handleRemoveMeal = (mealId: number) => {
    Alert.alert('Delete Meal?', 'All items in this meal will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeMeal.mutate({ planId: id, mealId: String(mealId) }),
      },
    ]);
  };

  const handleUpdatePlanMeal = (mealId: number, data: { timeSuggestion?: string; mealTypeId?: number; order?: number }) => {
    updateMeal.mutate({ planId: id, mealId: String(mealId), data });
  };

  const handleRemoveItem = (itemId: number) => {
    removeItem.mutate({ planId: id, itemId: String(itemId) });
  };

  const handleAddFoodToMeal = (mealId: number) => {
    router.push({
      pathname: '/(app)/(nutrition)/food-picker',
      params: { planMealId: String(mealId), planId: id, mode: 'planMeal' },
    } as never);
  };

  const handleSaveName = () => {
    if (nameValue.trim() && nameValue.trim() !== plan?.name) {
      updatePlan.mutate({ id, data: { name: nameValue.trim() } });
    }
    setEditingName(false);
  };

  const startEditName = () => {
    setNameValue(plan?.name ?? '');
    setEditingName(true);
  };

  return {
    plan,
    isLoading,
    mealTypes,
    days,
    currentDay,
    currentDayMeals,
    dayMacros,
    selectedDayIndex,
    setSelectedDayIndex,
    showAddMeal,
    setShowAddMeal,
    editingName,
    nameValue,
    setNameValue,
    handleActivate,
    handleAddDay,
    handleRemoveDay,
    handleAddMeal,
    handleRemoveMeal,
    handleUpdatePlanMeal,
    handleRemoveItem,
    handleAddFoodToMeal,
    handleSaveName,
    startEditName,
    isActivatePending: activatePlan.isPending,
  };
}
