import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useGetMealPlanById,
  useUpdateMealPlan,
  useActivateMealPlan,
  useAddPlanDay,
  useRemovePlanDay,
  useAddPlanMeal,
  useRemovePlanMeal,
  useRemovePlanMealItem,
} from '../../../../hooks/api/useMealPlanHooks';
import { useGetMealTypes } from '../../../../hooks/api/useMealTypeQueries';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../../../../constants/theme';
import { DayTabsRow } from '../../../../components/nutrition/DayTabsRow';
import { PlanMealCard } from '../../../../components/nutrition/PlanMealCard';
import { AddMealSheet } from '../../../../components/nutrition/AddMealSheet';
import { DaySummaryFooter } from '../../../../components/nutrition/DaySummaryFooter';

interface PlanDayWithMeals {
  id: number;
  dayNumber: number;
  notes: string | null;
  meals?: PlanMealWithItems[];
}

interface PlanMealWithItems {
  id: number;
  planDayId: number;
  mealTypeId: number;
  order: number;
  timeSuggestion: string | null;
  mealType?: { id: number; name: string };
  items?: PlanMealItemWithRelations[];
}

interface PlanMealItemWithRelations {
  id: number;
  planMealId: number;
  foodId: number;
  unitId: number;
  amount: number;
  food?: { id: number; name: string; calories: number; proteins: number; fats: number; carbs: number };
  unit?: { id: number; name: string };
}

export default function MealPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: plan, isLoading } = useGetMealPlanById(id);
  const { data: mealTypes } = useGetMealTypes();
  const updatePlan = useUpdateMealPlan();
  const activatePlan = useActivateMealPlan();
  const addDay = useAddPlanDay();
  const removeDay = useRemovePlanDay();
  const addMeal = useAddPlanMeal();
  const removeMeal = useRemovePlanMeal();
  const removeItem = useRemovePlanMealItem();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const days = useMemo(() => {
    const rawDays = (plan as any)?.days as PlanDayWithMeals[] | undefined;
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

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Button
          title="▶ Activate"
          variant="primary"
          onPress={handleActivate}
          isLoading={activatePlan.isPending}
          style={styles.activateBtn}
        />
      </View>

      {/* Plan Name */}
      <View style={styles.nameSection}>
        {editingName ? (
          <TextInput
            style={styles.nameInput}
            value={nameValue}
            onChangeText={setNameValue}
            onBlur={handleSaveName}
            onSubmitEditing={handleSaveName}
            autoFocus
            returnKeyType="done"
          />
        ) : (
          <Pressable onPress={startEditName}>
            <Text style={styles.planName}>{plan.name}</Text>
          </Pressable>
        )}
        {plan.description ? (
          <Text style={styles.planDesc}>{plan.description}</Text>
        ) : null}
        <Text style={styles.planMeta}>
          {plan.totalDays} days · {getVisibilityLabel(plan.visibilityTypeId)}
        </Text>
      </View>

      {/* Day Tabs */}
      <DayTabsRow
        days={days}
        selectedIndex={selectedDayIndex}
        onSelect={setSelectedDayIndex}
        onAddDay={handleAddDay}
        onRemoveDay={handleRemoveDay}
      />

      {/* Day Content */}
      <ScrollView
        style={styles.dayContent}
        contentContainerStyle={styles.dayContentInner}
        showsVerticalScrollIndicator={false}
      >
        {!currentDay ? (
          <EmptyState
            title="No days in this plan"
            description="Add a day to start planning meals"
            actionLabel="Add Day"
            onAction={handleAddDay}
          />
        ) : currentDayMeals.length === 0 ? (
          <EmptyState
            title="No meals for this day"
            description="Add a meal to start planning"
            actionLabel="+ Add Meal"
            onAction={() => setShowAddMeal(true)}
          />
        ) : (
          currentDayMeals.map((meal) => (
            <PlanMealCard
              key={meal.id}
              meal={meal}
              onAddFood={() => handleAddFoodToMeal(meal.id)}
              onRemoveMeal={() => handleRemoveMeal(meal.id)}
              onRemoveItem={handleRemoveItem}
            />
          ))
        )}

        {currentDay && currentDayMeals.length > 0 && (
          <Button
            title="+ Add Meal"
            variant="secondary"
            onPress={() => setShowAddMeal(true)}
            style={styles.addMealBtn}
          />
        )}
      </ScrollView>

      {/* Day Summary Footer */}
      {currentDay && currentDayMeals.length > 0 && (
        <DaySummaryFooter
          calories={dayMacros.calories}
          proteins={dayMacros.proteins}
          fats={dayMacros.fats}
          carbs={dayMacros.carbs}
        />
      )}

      {/* Add Meal Bottom Sheet */}
      {showAddMeal && (
        <AddMealSheet
          mealTypes={mealTypes ?? []}
          onAdd={handleAddMeal}
          onClose={() => setShowAddMeal(false)}
        />
      )}
    </View>
  );
}

function getVisibilityLabel(id: number): string {
  switch (id) {
    case 1: return '🔒 Private';
    case 2: return '🌐 Public';
    case 3: return '👥 Friends Only';
    default: return '🔒 Private';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  activateBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  nameSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  planName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  nameInput: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  planDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  planMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  dayContent: {
    flex: 1,
  },
  dayContentInner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  addMealBtn: {
    marginTop: spacing.md,
  },
});
