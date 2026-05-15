import { useState, useMemo, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { IFood } from '@athlo/shared';
import { useInfiniteSearchFoods, useCreateFood, useAddLogMealItem, useAddPlanMealItem } from '@/features/nutrition/hooks';

type PickerMode = 'logMeal' | 'planMeal';

interface UseFoodPickerScreenParams {
  insets: EdgeInsets;
  router: ReturnType<typeof useRouter>;
}

export function useFoodPickerScreen({ insets, router }: UseFoodPickerScreenParams) {
  const params = useLocalSearchParams<{
    mealId?: string;
    planId?: string;
    planMealId?: string;
    mode?: PickerMode;
  }>();

  const mode: PickerMode = (params.mode as PickerMode) ?? 'logMeal';

  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<IFood | null>(null);
  const [amount, setAmount] = useState('100');
  const [unitId, setUnitId] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodBrand, setNewFoodBrand] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [newFoodProteins, setNewFoodProteins] = useState('');
  const [newFoodFats, setNewFoodFats] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');

  const foodsQuery = useInfiniteSearchFoods(search.trim() || undefined);
  const createFood = useCreateFood();
  const addLogMealItem = useAddLogMealItem();
  const addPlanMealItem = useAddPlanMealItem();

  const foodList = useMemo(
    () => (foodsQuery.data?.pages ?? []).flatMap((p) => p.data),
    [foodsQuery.data],
  );

  const calculatedMacros = useMemo(() => {
    if (!selectedFood) return null;
    const factor = (parseFloat(amount) || 0) / 100;
    return {
      calories: Math.round(selectedFood.calories * factor),
      proteins: Math.round(selectedFood.proteins * factor * 10) / 10,
      fats: Math.round(selectedFood.fats * factor * 10) / 10,
      carbs: Math.round(selectedFood.carbs * factor * 10) / 10,
    };
  }, [selectedFood, amount]);

  const handleSelectFood = useCallback((food: IFood) => {
    setSelectedFood(food);
    setAmount('100');
    setUnitId(1);
  }, []);

  const handleAddFood = useCallback(() => {
    const parsedAmount = parseFloat(amount);
    if (!selectedFood || !parsedAmount || parsedAmount <= 0) return;

    if (mode === 'logMeal' && params.mealId) {
      addLogMealItem.mutate(
        {
          mealId: params.mealId,
          data: { foodId: selectedFood.id, unitId, amount: parsedAmount },
        },
        { onSuccess: () => router.back() },
      );
    } else if (mode === 'planMeal' && params.planId && params.planMealId) {
      addPlanMealItem.mutate(
        {
          planId: params.planId,
          mealId: params.planMealId,
          data: { foodId: selectedFood.id, unitId, amount: parsedAmount },
        },
        { onSuccess: () => router.back() },
      );
    }
  }, [selectedFood, amount, unitId, mode, params, addLogMealItem, addPlanMealItem, router]);

  const resetCreateForm = useCallback(() => {
    setNewFoodName('');
    setNewFoodBrand('');
    setNewFoodCalories('');
    setNewFoodProteins('');
    setNewFoodFats('');
    setNewFoodCarbs('');
  }, []);

  const handleCreateFood = useCallback(() => {
    const cal = parseFloat(newFoodCalories);
    const prot = parseFloat(newFoodProteins);
    const fat = parseFloat(newFoodFats);
    const carb = parseFloat(newFoodCarbs);

    if (!newFoodName.trim() || isNaN(cal) || isNaN(prot) || isNaN(fat) || isNaN(carb)) return;

    createFood.mutate(
      {
        name: newFoodName.trim(),
        brand: newFoodBrand.trim() || undefined,
        calories: cal,
        proteins: prot,
        fats: fat,
        carbs: carb,
      },
      {
        onSuccess: (food) => {
          setShowCreateForm(false);
          setSelectedFood(food);
          setAmount('100');
          resetCreateForm();
        },
      },
    );
  }, [newFoodName, newFoodBrand, newFoodCalories, newFoodProteins, newFoodFats, newFoodCarbs, createFood, resetCreateForm]);

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
    foodsQuery,
    createFood,
    addLogMealItem,
    addPlanMealItem,
    foodList,
    calculatedMacros,
    handleSelectFood,
    handleAddFood,
    handleCreateFood,
    resetCreateForm,
    insets,
    router,
    mode,
    params,
  };
}
