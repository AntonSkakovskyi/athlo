import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { Chip } from '@/components/ui/Chip/Chip';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { DateSelector } from '@/features/nutrition/components';
import { DailyMacrosSummary } from '@/features/nutrition/components';
import { MealCard } from '@/features/nutrition/components';
import { WaterTracker } from '@/features/nutrition/components';
import { ActivePlanBanner } from '@/features/nutrition/components';
import { LogMealSheet } from '@/features/nutrition/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useNutritionHomeScreen } from '@/features/nutrition/hooks/useNutritionHomeScreen';

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const {
    date, isToday, summary, isLoading, mealTypes, activePlan, activePlanDetails,
    planDayMeals, meals, waterLogs, selectedMealTypeId, setSelectedMealTypeId,
    showAddMealSheet, setShowAddMealSheet,
    handlePrevDay, handleNextDay, handleAddMeal, handleConfirmAddMeal,
    handleDeleteMeal, handleDeleteMealItem,
    handleAddWater, handleUpdateWater, handleDeleteWater, handleAddFoodToMeal,
    isCreateMealPending, router,
  } = useNutritionHomeScreen();

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Nutrition</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.mealPlansBtn} onPress={() => router.push('/(app)/(nutrition)/nutrition-history' as never)}>
              <Text style={styles.mealPlansBtnText}>📊 History</Text>
            </Pressable>
            <Pressable style={styles.mealPlansBtn} onPress={() => router.push('/(app)/(nutrition)/meal-plans')}>
              <Text style={styles.mealPlansBtnText}>📋 Meal Plans</Text>
            </Pressable>
          </View>
        </View>

        <DateSelector date={date} onPrev={handlePrevDay} onNext={handleNextDay} isToday={isToday} />

        {activePlan?.isActive && (
          <ActivePlanBanner
            userMealPlan={activePlan}
            planName={activePlanDetails?.name}
            onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${activePlan.mealPlanId}`)}
          />
        )}

        {isLoading ? (
          <Spinner style={styles.loader} />
        ) : (
          <>
            <DailyMacrosSummary
              calories={summary?.totalCalories ?? 0}
              proteins={summary?.totalProteins ?? 0}
              fats={summary?.totalFats ?? 0}
              carbs={summary?.totalCarbs ?? 0}
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meals</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {mealTypes?.map((type) => (
                  <Chip
                    key={type.id}
                    label={type.name}
                    active={selectedMealTypeId === type.id}
                    onPress={() => setSelectedMealTypeId(selectedMealTypeId === type.id ? null : type.id)}
                  />
                ))}
              </ScrollView>

              <Button title="+ Add Meal" variant="secondary" onPress={handleAddMeal} isLoading={isCreateMealPending} style={styles.addMealBtn} />

              {meals.length === 0 ? (
                <EmptyState title="No meals logged" description="Add your first meal to start tracking" />
              ) : (
                meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onAddItem={handleAddFoodToMeal}
                    onDelete={handleDeleteMeal}
                    onDeleteItem={handleDeleteMealItem}
                  />
                ))
              )}
            </View>

            <WaterTracker waterLogs={waterLogs} totalWaterMl={summary?.totalWaterMl ?? 0} date={date} onAddWater={handleAddWater} onUpdateWater={handleUpdateWater} onDeleteWater={handleDeleteWater} />
          </>
        )}
      </ScrollView>

      {showAddMealSheet && mealTypes && (
        <LogMealSheet
          mealTypes={mealTypes}
          planDayMeals={planDayMeals}
          onConfirm={handleConfirmAddMeal}
          onClose={() => setShowAddMealSheet(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  mealPlansBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  mealPlansBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  loader: { marginVertical: 40 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  chipRow: { gap: spacing.sm, marginBottom: spacing.md },
  addMealBtn: { marginBottom: spacing.lg },
});
