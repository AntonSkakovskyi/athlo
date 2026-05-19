import { useState, useMemo, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { IFood } from '@athlo/shared';
import {
  useInfiniteSearchFoods,
  useCreateFood,
  useAddLogMealItem,
  useAddPlanMealItem,
  useDeleteLogMealItem,
  useRemovePlanMealItem,
  useGetUnits,
  useAddFoodUnit,
  useDeleteFood,
} from '@/features/nutrition/hooks';

type PickerMode = 'logMeal' | 'planMeal';

// Explicitly define extended interface to fix potential shared package sync issues
interface IFoodExtended extends IFood {
  creatorId: number | null;
}

interface UseFoodPickerScreenParams {
  insets: EdgeInsets;
  router: ReturnType<typeof useRouter>;
}

export function useFoodPickerScreen({ insets, router }: UseFoodPickerScreenParams) {
  const params = useLocalSearchParams<{
    mealId?: string;
    planId?: string;
    planMealId?: string;
    swapItemId?: string;
    mode?: PickerMode;
  }>();

  const mode: PickerMode = (params.mode as PickerMode) ?? 'logMeal';

  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<IFoodExtended | null>(null);
  const [amount, setAmount] = useState('100');
  const [unitId, setUnitId] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodBrand, setNewFoodBrand] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [newFoodProteins, setNewFoodProteins] = useState('');
  const [newFoodFats, setNewFoodFats] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');
  const [newFoodServingAmount, setNewFoodServingAmount] = useState('100');
  const [newFoodServingUnitId, setNewFoodServingUnitId] = useState(1);
  const { user } = useAuth();

  const isCreator = useMemo(() => {
    if (!selectedFood || !user) return false;
    return selectedFood.creatorId === user.id;
  }, [selectedFood, user]);

  const foodsQuery = useInfiniteSearchFoods(search.trim() || undefined);
  const { data: allUnits } = useGetUnits();
  
  const units = useMemo(() => {
    if (!allUnits) return [];
    return allUnits.filter(u => !['cm', 'sm', 'kg'].includes(u.name.toLowerCase()));
  }, [allUnits]);

  const createFood = useCreateFood();
  const deleteFood = useDeleteFood();
  const addFoodUnit = useAddFoodUnit();
  const addLogMealItem = useAddLogMealItem();
  const addPlanMealItem = useAddPlanMealItem();
  const deleteLogMealItem = useDeleteLogMealItem();
  const removePlanMealItem = useRemovePlanMealItem();

  const foodList = useMemo(
    () => (foodsQuery.data?.pages ?? []).flatMap((p) => p.data as IFoodExtended[]),
    [foodsQuery.data],
  );

  const calculatedMacros = useMemo(() => {
    if (!selectedFood) return null;
    
    // Find the selected unit's conversion factor
    let factor = 1; // default 1g = 1g
    if (selectedFood.units) {
      const selectedUnit = selectedFood.units.find(u => u.unitId === unitId);
      if (selectedUnit) {
        factor = Number(selectedUnit.conversionFactor);
      }
    }

    const amountNum = parseFloat(amount) || 0;
    // Calculate total grams, then divide by 100
    const totalGrams = amountNum * factor;
    const macroFactor = totalGrams / 100;

    return {
      calories: Math.round(selectedFood.calories * macroFactor),
      proteins: Math.round(selectedFood.proteins * macroFactor * 10) / 10,
      fats: Math.round(selectedFood.fats * macroFactor * 10) / 10,
      carbs: Math.round(selectedFood.carbs * macroFactor * 10) / 10,
    };
  }, [selectedFood, amount, unitId]);

  const handleSelectFood = useCallback((food: IFood) => {
    setSelectedFood(food as IFoodExtended);
    
    // Check first unit or default to g (1)
    const firstUnitId = food.units?.[0]?.unitId ?? 1;
    const unitName = food.units?.[0]?.unit?.name?.toLowerCase() || 'g';
    
    setUnitId(firstUnitId);
    // If unit is pieces/cups/etc, set amount to 1, otherwise 100
    if (['g', 'ml'].includes(unitName)) {
      setAmount('100');
    } else {
      setAmount('1');
    }
  }, []);

  const handleAddFood = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (!selectedFood || !parsedAmount || parsedAmount <= 0) return;

    let factor = 1;
    if (selectedFood.units) {
      const selectedUnit = selectedFood.units.find(u => u.unitId === unitId);
      if (selectedUnit) factor = Number(selectedUnit.conversionFactor);
    }
    const calculatedWeightG = parsedAmount * factor;

    if (mode === 'logMeal' && params.mealId) {
      if (params.swapItemId) {
        // Handle swap: add new, then delete old
        await addLogMealItem.mutateAsync({
          mealId: params.mealId,
          data: { foodId: selectedFood.id, unitId, amount: parsedAmount, calculatedWeightG },
        });
        await deleteLogMealItem.mutateAsync(params.swapItemId);
        router.back();
      } else {
        addLogMealItem.mutate(
          {
            mealId: params.mealId,
            data: { foodId: selectedFood.id, unitId, amount: parsedAmount, calculatedWeightG },
          },
          { onSuccess: () => router.back() },
        );
      }
    } else if (mode === 'planMeal' && params.planId && params.planMealId) {
      // Plan meals don't support calculatedWeightG in DB/API yet
      const planData = { foodId: selectedFood.id, unitId, amount: parsedAmount };
      
      if (params.swapItemId) {
        await addPlanMealItem.mutateAsync({
          planId: params.planId,
          mealId: params.planMealId,
          data: planData,
        });
        await removePlanMealItem.mutateAsync({ planId: params.planId, itemId: params.swapItemId });
        router.back();
      } else {
        addPlanMealItem.mutate(
          {
            planId: params.planId,
            mealId: params.planMealId,
            data: planData,
          },
          { onSuccess: () => router.back() },
        );
      }
    }
  }, [selectedFood, amount, unitId, mode, params, addLogMealItem, addPlanMealItem, deleteLogMealItem, removePlanMealItem, router]);

  const resetCreateForm = useCallback(() => {
    setNewFoodName('');
    setNewFoodBrand('');
    setNewFoodCalories('');
    setNewFoodProteins('');
    setNewFoodFats('');
    setNewFoodCarbs('');
    setNewFoodServingAmount('100');
    setNewFoodServingUnitId(1);
  }, []);

  const handleCreateFood = useCallback(async () => {
    const cal = parseFloat(newFoodCalories);
    const prot = parseFloat(newFoodProteins);
    const fat = parseFloat(newFoodFats);
    const carb = parseFloat(newFoodCarbs);
    const servingAmount = parseFloat(newFoodServingAmount);

    if (!newFoodName.trim() || isNaN(cal) || isNaN(prot) || isNaN(fat) || isNaN(carb) || isNaN(servingAmount) || servingAmount <= 0) return;

    // Normalize to 100g/ml
    const factor = 100 / servingAmount;
    
    const food = await createFood.mutateAsync({
      name: newFoodName.trim(),
      brand: newFoodBrand.trim() || undefined,
      calories: cal * factor,
      proteins: prot * factor,
      fats: fat * factor,
      carbs: carb * factor,
    });

    // If unit is not grams (1), add it as a food unit
    if (newFoodServingUnitId !== 1) {
      await addFoodUnit.mutateAsync({
        foodId: String(food.id),
        data: {
          unitId: newFoodServingUnitId,
          conversionFactor: servingAmount,
        }
      });
    }

    setShowCreateForm(false);
    
    // Refresh food list or navigate back
    // For now, select it with proper default amount
    const unitName = units.find(u => u.id === newFoodServingUnitId)?.name?.toLowerCase() || 'g';
    setSelectedFood(food as IFoodExtended);
    setAmount(String(servingAmount));
    setUnitId(newFoodServingUnitId);
    
    resetCreateForm();
  }, [newFoodName, newFoodBrand, newFoodCalories, newFoodProteins, newFoodFats, newFoodCarbs, newFoodServingAmount, newFoodServingUnitId, createFood, addFoodUnit, resetCreateForm, units]);

  const handleDeleteFood = useCallback(async () => {
    if (!selectedFood) return;
    await deleteFood.mutateAsync(String(selectedFood.id));
    setSelectedFood(null);
  }, [selectedFood, deleteFood]);

  return {
    search,
    setSearch,
    selectedFood,
    setSelectedFood,
    amount,
    setAmount,
    unitId,
    setUnitId,
    showCreateForm,
    setShowCreateForm,
    newFoodName,
    setNewFoodName,
    newFoodBrand,
    setNewFoodBrand,
    newFoodCalories,
    setNewFoodCalories,
    newFoodProteins,
    setNewFoodProteins,
    newFoodFats,
    setNewFoodFats,
    newFoodCarbs,
    setNewFoodCarbs,
    newFoodServingAmount,
    setNewFoodServingAmount,
    newFoodServingUnitId,
    setNewFoodServingUnitId,
    units,
    foodsQuery,
    createFood,
    addLogMealItem,
    addPlanMealItem,
    foodList,
    calculatedMacros,
    handleSelectFood,
    handleAddFood,
    handleCreateFood,
    handleDeleteFood,
    resetCreateForm,
    isCreator,
    insets,
    router,
    mode,
    params,
    deleteFood,
  };
}
