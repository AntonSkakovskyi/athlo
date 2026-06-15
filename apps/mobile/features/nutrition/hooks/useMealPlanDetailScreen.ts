import { useState, useMemo } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { confirmDestructive } from '@/utils/alerts';
import type { IMealPlan } from '@athlo/shared';
import { VisibilityType } from '@athlo/shared';
import { VISIBILITY_ENUM_TO_ID } from '@/utils/visibility';
import { useToast } from '@/contexts/ToastContext';
import { ICONS } from '@/utils/icons';
import {
  useGetMealPlanById,
  useUpdateMealPlan,
  useActivateMealPlan,
  useDeactivateMealPlan,
  useAddPlanDay,
  useRemovePlanDay,
  useAddPlanMeal,
  useRemovePlanMeal,
  useUpdatePlanMeal,
  useRemovePlanMealItem,
  useUpdatePlanMealItem,
  useGetMealTypes,
  useGetActiveMealPlan,
  useGetSavedMealPlans,
  useSaveMealPlan,
  useUnsaveMealPlan,
} from '@/features/nutrition/hooks';
import { calcItemMacrosByUnit, sumMacros } from '@/features/nutrition/utils/macros';
import type { NutritionFactLike } from '@/features/nutrition/utils/macros';

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
  food?: { id: number; name: string; brand: string | null; units?: NutritionFactLike[] };
  unit?: { id: number; name: string };
}

export function useMealPlanDetailScreen(id: string) {
  const router = useRouter();

  const { data: plan, isLoading: isPlanLoading } = useGetMealPlanById(id);
  const { data: mealTypes } = useGetMealTypes();
  const { data: activePlan, isLoading: isActivePlanLoading } = useGetActiveMealPlan();
  const { data: savedPlans } = useGetSavedMealPlans();
  const savePlan = useSaveMealPlan();
  const unsavePlan = useUnsaveMealPlan();
  const updatePlan = useUpdateMealPlan();
  const activatePlan = useActivateMealPlan();
  const deactivatePlan = useDeactivateMealPlan();
  const addDay = useAddPlanDay();
  const removeDay = useRemovePlanDay();
  const addMeal = useAddPlanMeal();
  const removeMeal = useRemovePlanMeal();
  const updateMeal = useUpdatePlanMeal();
  const removeItem = useRemovePlanMealItem();
  const updateItem = useUpdatePlanMealItem();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<PlanMealWithItems | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');

  const [editingMealItem, setEditingMealItem] = useState<{ mealId: number; item: PlanMealItemWithRelations } | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);

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
    const all = currentDayMeals.flatMap(
      (meal) => meal.items?.map((item) => calcItemMacrosByUnit(item.food?.units, item.unitId, item.amount)) ?? [],
    );
    return sumMacros(all);
  }, [currentDayMeals]);

  const handleActivate = (startDay?: number) => {
    activatePlan.mutate({ id, startDay });
  };

  const handleDeactivate = () => {
    deactivatePlan.mutate();
  };

  const handleAddDay = () => {
    const nextDayNumber = days.length > 0 ? Math.max(...days.map((d) => d.dayNumber)) + 1 : 1;
    addDay.mutate({ planId: id, data: { dayNumber: nextDayNumber } });
  };

  const handleRemoveDay = (dayId: number) => {
    confirmDestructive('Delete Day?', 'All meals in this day will be removed.', () => {
      removeDay.mutate({ planId: id, dayId: String(dayId) });
      if (selectedDayIndex > 0 && selectedDayIndex >= days.length - 1) {
        setSelectedDayIndex(selectedDayIndex - 1);
      }
    });
  };

  const handleAddMeal = (mealTypeId: number, timeSuggestion?: string) => {
    if (!currentDay) return;
    const order = currentDayMeals.length + 1;
    addMeal.mutate({
      planId: id,
      dayId: String(currentDay.id),
      data: { mealTypeId, order, timeSuggestion: timeSuggestion || undefined },
    });
    setShowAddMeal(false);
  };

  const handleRemoveMeal = (mealId: number) => {
    confirmDestructive('Delete Meal?', 'All items in this meal will be removed.', () => removeMeal.mutate({ planId: id, mealId: String(mealId) }));
  };

  const handleEditMeal = (meal: PlanMealWithItems) => {
    setEditingMeal(meal);
  };

  const handleConfirmEditMeal = async (mealId: number, data: { timeSuggestion?: string; mealTypeId?: number }) => {
    await updateMeal.mutateAsync({ 
      planId: id, 
      mealId: String(mealId), 
      data: { ...data, timeSuggestion: data.timeSuggestion || undefined }
    });
    setEditingMeal(null);
  };

  const handleRemoveItem = (itemId: number) => {
    removeItem.mutate({ planId: id, itemId: String(itemId) });
    setEditingMealItem(null);
  };

  const handleUpdateItem = async (amount: number, unitId: number) => {
    if (!editingMealItem) return;
    await updateItem.mutateAsync({
      planId: id,
      itemId: String(editingMealItem.item.id),
      data: { amount, unitId },
    });
    setEditingMealItem(null);
  };

  const handleSwapItem = () => {
    if (!editingMealItem) return;
    const mealId = editingMealItem.mealId;
    setEditingMealItem(null);
    router.push({
      pathname: '/(app)/(nutrition)/food-picker',
      params: { 
        planMealId: String(mealId), 
        planId: id, 
        mode: 'planMeal', 
        swapItemId: String(editingMealItem.item.id) 
      },
    } as never);
  };

  const handleEditMealItem = (mealId: number, item: PlanMealItemWithRelations) => {
    setEditingMealItem({ mealId, item });
  };

  const handleAddFoodToMeal = (mealId: number) => {
    router.push({
      pathname: '/(app)/(nutrition)/food-picker',
      params: { planMealId: String(mealId), planId: id, mode: 'planMeal' },
    } as never);
  };

  const currentVisibility = useMemo((): VisibilityType => {
    const vid = (plan as IMealPlan | undefined)?.visibilityTypeId;
    if (vid === 2) return VisibilityType.PUBLIC;
    if (vid === 3) return VisibilityType.FRIENDS_ONLY;
    return VisibilityType.PRIVATE;
  }, [(plan as IMealPlan | undefined)?.visibilityTypeId]);

  const handleVisibilityChange = (value: VisibilityType) => {
    updatePlan.mutate({ id, data: { visibilityTypeId: VISIBILITY_ENUM_TO_ID[value] } });
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

  const startEditDesc = () => {
    setDescValue(plan?.description ?? '');
    setEditingDesc(true);
  };

  const handleSaveDesc = () => {
    const trimmed = descValue.trim();
    if (trimmed !== (plan?.description ?? '')) {
      updatePlan.mutate({ id, data: { description: trimmed } });
    }
    setEditingDesc(false);
  };

  const { showToast } = useToast();
  const isActive = activePlan?.mealPlanId === Number(id);
  const isSaved = savedPlans?.some((p) => p.id === Number(id)) ?? false;

  const handleSave = () => {
    if (isSaved) {
      unsavePlan.mutate(id);
    } else {
      savePlan.mutate(id, {
        onSuccess: () => {
          showToast({
            title: 'Plan Saved!',
            description: 'The meal plan has been added to your library. Go to the "My" tab to use it.',
            icon: ICONS.folder,
          });
        },
      });
    }
  };

  return {
    plan,
    isLoading: isPlanLoading || isActivePlanLoading,
    mealTypes,
    days,
    currentDay,
    currentDayMeals,
    dayMacros,
    selectedDayIndex,
    setSelectedDayIndex,
    showAddMeal,
    setShowAddMeal,
    editingMeal,
    setEditingMeal,
    editingName,
    nameValue,
    setNameValue,
    handleActivate,
    handleAddDay,
    handleRemoveDay,
    handleAddMeal,
    handleRemoveMeal,
    handleEditMeal,
    handleConfirmEditMeal,
    handleRemoveItem,
    handleUpdateItem,
    handleSwapItem,
    handleEditMealItem,
    handleAddFoodToMeal,
    handleSaveName,
    startEditName,
    editingDesc,
    descValue,
    setDescValue,
    startEditDesc,
    handleSaveDesc,
    isActive,
    isActivatePending: activatePlan.isPending,
    handleDeactivate,
    isDeactivatePending: deactivatePlan.isPending,
    isSaved,
    handleSave,
    isSavePending: savePlan.isPending || unsavePlan.isPending,
    editingMealItem,
    setEditingMealItem,
    isUpdateItemPending: updateItem.isPending,
    currentVisibility,
    handleVisibilityChange,
    showActivationModal,
    setShowActivationModal,
  };
}
