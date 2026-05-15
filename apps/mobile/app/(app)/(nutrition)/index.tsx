import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGetDailySummary, useCreateLogMeal, useDeleteLogMeal, useAddWaterLog, useDeleteWaterLog } from '@/features/nutrition/hooks';
import { useGetMealTypes } from '@/features/nutrition/hooks';
import { useGetActiveMealPlan, useGetMealPlanById } from '@/features/nutrition/hooks';
import type { ILogMeal, IWaterLog } from '@athlo/shared';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { Chip } from '@/components/ui/Chip/Chip';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { DateSelector } from '@/features/nutrition/components';
import { DailyMacrosSummary } from '@/features/nutrition/components';
import { MealCard } from '@/features/nutrition/components';
import { WaterTracker } from '@/features/nutrition/components';
import { ActivePlanBanner } from '@/features/nutrition/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
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

  const handleAddMeal = () => {
    if (!selectedMealTypeId) {
      const firstType = mealTypes?.[0];
      if (firstType) {
        createMeal.mutate({ mealTypeId: firstType.id, name: firstType.name });
      }
      return;
    }
    const mealTypeName = mealTypes?.find((t) => t.id === selectedMealTypeId)?.name;
    createMeal.mutate({ mealTypeId: selectedMealTypeId, name: mealTypeName });
  };

  const handleDeleteMeal = (id: number) => {
    Alert.alert('Delete meal?', 'This will remove the meal and all its items.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMeal.mutate(String(id)) },
    ]);
  };

  const handleAddWater = (ml: number) => {
    addWater.mutate({ amountMl: ml });
  };

  const handleDeleteWater = (id: number) => {
    deleteWater.mutate(String(id));
  };

  const handleAddFoodToMeal = (mealId: number) => {
    router.push({
      pathname: '/(app)/(nutrition)/food-picker',
      params: { mealId: String(mealId), mode: 'logMeal' },
    } as never);
  };

  const meals = useMemo(() => (summary?.meals ?? []) as ILogMeal[], [summary]);
  const waterLogs = useMemo(() => (summary?.waterLogs ?? []) as IWaterLog[], [summary]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Nutrition</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.mealPlansBtn}
            onPress={() => router.push('/(app)/(nutrition)/nutrition-history' as never)}
          >
            <Text style={styles.mealPlansBtnText}>📊 History</Text>
          </Pressable>
          <Pressable
            style={styles.mealPlansBtn}
            onPress={() => router.push('/(app)/(nutrition)/meal-plans')}
          >
            <Text style={styles.mealPlansBtnText}>📋 Meal Plans</Text>
          </Pressable>
        </View>
      </View>

      {/* Date Selector */}
      <DateSelector date={date} onPrev={handlePrevDay} onNext={handleNextDay} isToday={isToday} />

      {/* Active Plan Banner */}
      {activePlan?.isActive && (
        <ActivePlanBanner
          userMealPlan={activePlan}
          planName={activePlanDetails?.name}
          onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${activePlan.mealPlanId}`)}
        />
      )}

      {/* Loading */}
      {isLoading ? (
        <Spinner style={styles.loader} />
      ) : (
        <>
          {/* Daily Macros Summary */}
          <DailyMacrosSummary
            calories={summary?.totalCalories ?? 0}
            proteins={summary?.totalProteins ?? 0}
            fats={summary?.totalFats ?? 0}
            carbs={summary?.totalCarbs ?? 0}
          />

          {/* Meals Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meals</Text>

            {/* Meal Type Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {mealTypes?.map((type) => (
                <Chip
                  key={type.id}
                  label={type.name}
                  active={selectedMealTypeId === type.id}
                  onPress={() =>
                    setSelectedMealTypeId(selectedMealTypeId === type.id ? null : type.id)
                  }
                />
              ))}
            </ScrollView>

            {/* Add Meal Button */}
            <Button
              title="+ Add Meal"
              variant="secondary"
              onPress={handleAddMeal}
              isLoading={createMeal.isPending}
              style={styles.addMealBtn}
            />

            {/* Meal Cards */}
            {meals.length === 0 ? (
              <EmptyState
                title="No meals logged"
                description="Add your first meal to start tracking"
              />
            ) : (
              meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onAddItem={handleAddFoodToMeal}
                  onDelete={handleDeleteMeal}
                />
              ))
            )}
          </View>

          {/* Water Section */}
          <WaterTracker
            waterLogs={waterLogs}
            totalWaterMl={summary?.totalWaterMl ?? 0}
            onAddWater={handleAddWater}
            onDeleteWater={handleDeleteWater}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  mealPlansBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealPlansBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  loader: {
    marginVertical: 40,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chipRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addMealBtn: {
    marginBottom: spacing.lg,
  },
});
