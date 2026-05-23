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
  useUpdateFood,
  useAddLogMealItem,
  useAddPlanMealItem,
  useDeleteLogMealItem,
  useRemovePlanMealItem,
  useGetUnits,
  useAddFoodUnit,
  useDeleteFood,
  useDeleteFoodUnit,
} from '@/features/nutrition/hooks';
import type { NutritionFactData } from '@/hooks/api/useFoodAPI';

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
  const [showEditForm, setShowEditForm] = useState(false);

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
    return allUnits.filter(u => !['cm', 'sm', 'kg', 'kcal'].includes(u.name.toLowerCase()));
  }, [allUnits]);

  const createFood = useCreateFood();
  const updateFood = useUpdateFood();
  const deleteFood = useDeleteFood();
  const deleteFoodUnit = useDeleteFoodUnit();
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
    
    const selectedFact = selectedFood.units?.find(u => u.unitId === unitId);
    if (!selectedFact) return { calories: 0, proteins: 0, fats: 0, carbs: 0 };

    const amountNum = parseFloat(amount) || 0;
    const multiplier = amountNum / (Number(selectedFact.amount) || 1);

    return {
      calories: Math.round((selectedFact.calories || 0) * multiplier),
      proteins: Math.round((selectedFact.proteins || 0) * multiplier * 10) / 10,
      fats: Math.round((selectedFact.fats || 0) * multiplier * 10) / 10,
      carbs: Math.round((selectedFact.carbs || 0) * multiplier * 10) / 10,
    };
  }, [selectedFood, amount, unitId]);

  const getDefaultAmount = useCallback((unitName: string) =>
    ['g', 'ml'].includes(unitName.toLowerCase()) ? '100' : '1',
  []);

  const handleSelectFood = useCallback((food: IFood) => {
    setSelectedFood(food as IFoodExtended);
    const firstFact = food.units?.[0];
    const firstFactUnitId = firstFact?.unitId ?? 1;
    const unitName = firstFact?.unit?.name?.toLowerCase() || 'g';
    setUnitId(firstFactUnitId);
    setAmount(getDefaultAmount(unitName));
  }, [getDefaultAmount]);

  const handleUnitChange = useCallback((newUnitId: number) => {
    setUnitId(newUnitId);
    const unit = units.find(u => u.id === newUnitId);
    setAmount(getDefaultAmount(unit?.name ?? ''));
  }, [units, getDefaultAmount]);

  const handleNewFoodServingUnitChange = useCallback((newUnitId: number) => {
    setNewFoodServingUnitId(newUnitId);
    const unit = units.find(u => u.id === newUnitId);
    setNewFoodServingAmount(getDefaultAmount(unit?.name ?? ''));
  }, [units, getDefaultAmount]);

  const handleAddFood = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (!selectedFood || !parsedAmount || parsedAmount <= 0) return;

    if (mode === 'logMeal' && params.mealId) {
      if (params.swapItemId) {
        // Handle swap: add new, then delete old
        await addLogMealItem.mutateAsync({
          mealId: params.mealId,
          data: { foodId: selectedFood.id, unitId, amount: parsedAmount },
        });
        await deleteLogMealItem.mutateAsync(params.swapItemId);
        router.back();
      } else {
        addLogMealItem.mutate(
          {
            mealId: params.mealId,
            data: { foodId: selectedFood.id, unitId, amount: parsedAmount },
          },
          { onSuccess: () => router.back() },
        );
      }
    } else if (mode === 'planMeal' && params.planId && params.planMealId) {
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
    const cal = parseFloat(newFoodCalories) || 0;
    const prot = parseFloat(newFoodProteins) || 0;
    const fat = parseFloat(newFoodFats) || 0;
    const carb = parseFloat(newFoodCarbs) || 0;
    const servingAmount = parseFloat(newFoodServingAmount);

    if (!newFoodName.trim() || isNaN(servingAmount) || servingAmount <= 0) return;

    const food = await createFood.mutateAsync({
      name: newFoodName.trim(),
      brand: newFoodBrand.trim() || undefined,
      units: [
        {
          unitId: newFoodServingUnitId,
          amount: servingAmount,
          calories: cal,
          proteins: prot,
          fats: fat,
          carbs: carb,
        }
      ]
    });

    setShowCreateForm(false);
    
    // Refresh food list or navigate back
    // For now, select it with proper default amount
    setSelectedFood(food as IFoodExtended);
    setAmount(String(servingAmount));
    setUnitId(newFoodServingUnitId);
    
    resetCreateForm();
  }, [newFoodName, newFoodBrand, newFoodCalories, newFoodProteins, newFoodFats, newFoodCarbs, newFoodServingAmount, newFoodServingUnitId, createFood, resetCreateForm, units]);

  const handleDeleteFood = useCallback(async () => {
    if (!selectedFood) return;
    await deleteFood.mutateAsync(String(selectedFood.id));
    setSelectedFood(null);
  }, [selectedFood, deleteFood]);

  const handleEditFood = useCallback(async (name: string, brand: string, newUnit: NutritionFactData | null) => {
    if (!selectedFood) return;
    const updated = await updateFood.mutateAsync({
      id: String(selectedFood.id),
      data: {
        name: name || undefined,
        brand: brand || undefined,
        ...(newUnit ? { units: [newUnit] } : {}),
      },
    });
    setSelectedFood(updated as IFoodExtended);
    setShowEditForm(false);
  }, [selectedFood, updateFood]);

  const handleDeleteFoodUnit = useCallback(async (unitId: number) => {
    if (!selectedFood) return;
    const updated = await deleteFoodUnit.mutateAsync({
      foodId: String(selectedFood.id),
      unitId: String(unitId),
    });
    setSelectedFood(updated as IFoodExtended);
  }, [selectedFood, deleteFoodUnit]);

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
    showEditForm,
    setShowEditForm,
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
    updateFood,
    addLogMealItem,
    addPlanMealItem,
    foodList,
    calculatedMacros,
    handleSelectFood,
    handleUnitChange,
    handleNewFoodServingUnitChange,
    handleAddFood,
    handleCreateFood,
    handleDeleteFood,
    handleEditFood,
    handleDeleteFoodUnit,
    resetCreateForm,
    isCreator,
    insets,
    router,
    mode,
    params,
    deleteFood,
    deleteFoodUnit,
  };
}
