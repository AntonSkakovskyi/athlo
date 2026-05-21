import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Chip } from '@/components/ui/Chip/Chip';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { DateSelector } from '@/features/nutrition/components';
import { DailyMacrosSummary } from '@/features/nutrition/components';
import { MealCard, MealFormSheet, MealItemActionSheet } from '@/features/nutrition/components';
import { WaterTracker } from '@/features/nutrition/components';
import { ActivePlanBanner } from '@/features/nutrition/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useNutritionHomeScreen } from '@/features/nutrition/hooks/useNutritionHomeScreen';

const TAB_LABELS = ['🥘 Meals', '💧 Water'];

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const activeTab = activeTabIndex === 0 ? 'meals' : 'water';
  
  const {
    date, isToday, summary, isLoading, mealTypes, activePlan, activePlanDetails,
    planDayMeals, goals, meals, waterLogs, selectedMealTypeId, setSelectedMealTypeId,
    showAddMealSheet, setShowAddMealSheet, editingMeal, setEditingMeal,
    handlePrevDay, handleNextDay, handleDateSelect, handleAddMeal, handleConfirmAddMeal,
    handleDeleteMeal, handleEditMeal, handleConfirmEditMeal, handleDeleteMealItem,
    handleEditMealItem, handleUpdateMealItem, handleSwapMealItem,
    handleAddWater, handleUpdateWater, handleDeleteWater, handleAddFoodToMeal,
    isCreateMealPending, isUpdateItemPending,
    editingMealItem, setEditingMealItem, router,
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

        <DateSelector 
          date={date} 
          onPrev={handlePrevDay} 
          onNext={handleNextDay} 
          isToday={isToday} 
          onDateSelect={handleDateSelect}
          maximumDate={new Date()}
        />

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
              calorieGoal={goals.calories}
              proteinGoal={goals.proteins}
              fatGoal={goals.fats}
              carbGoal={goals.carbs}
            />

            <SegmentControl
              segments={TAB_LABELS}
              activeIndex={activeTabIndex}
              onSelect={setActiveTabIndex}
              style={styles.tabContainer}
            />

            {activeTab === 'meals' ? (
              <View style={styles.section}>
                <View style={styles.chipRow}>
                  {mealTypes?.map((type) => (
                    <Chip
                      key={type.id}
                      label={type.name}
                      active={selectedMealTypeId === type.id}
                      onPress={() => setSelectedMealTypeId(selectedMealTypeId === type.id ? null : type.id)}
                      borderRadius={borderRadius.md}
                    />
                  ))}
                </View>

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
                      onEditMeal={handleEditMeal}
                      onEditItem={(itemId) => handleEditMealItem(meal.id, itemId)}
                    />
                  ))
                )}
              </View>
            ) : (
              <WaterTracker 
                waterLogs={waterLogs} 
                totalWaterMl={summary?.totalWaterMl ?? 0} 
                waterGoal={summary?.waterGoal ?? undefined}
                date={date} 
                onAddWater={handleAddWater} 
                onUpdateWater={handleUpdateWater} 
                onDeleteWater={handleDeleteWater} 
              />
            )}
          </>
        )}
      </ScrollView>

      {showAddMealSheet && mealTypes && (
        <MealFormSheet
          title="Add Meal"
          confirmLabel="Add"
          mealTypes={mealTypes}
          planDayMeals={planDayMeals}
          defaultHasTime={true}
          onConfirm={(data) => handleConfirmAddMeal(data.mealTypeId, data.items ?? [], data.name, data.consumedAt)}
          onClose={() => setShowAddMealSheet(false)}
        />
      )}

      {editingMeal && mealTypes && (
        <MealFormSheet
          title="Edit Meal"
          confirmLabel="Save Changes"
          mealTypes={mealTypes}
          onConfirm={(data) => handleConfirmEditMeal(editingMeal.id, data)}
          onClose={() => setEditingMeal(null)}
          initialName={editingMeal.name ?? ''}
          initialTypeId={editingMeal.mealTypeId}
          initialDate={editingMeal.consumedAt}
        />
      )}

      <MealItemActionSheet
        visible={!!editingMealItem}
        item={editingMealItem?.item ?? null}
        onClose={() => setEditingMealItem(null)}
        onUpdate={(amount, unitId) => handleUpdateMealItem(editingMealItem!.item.id, amount, unitId)}
        onDelete={() => handleDeleteMealItem(editingMealItem!.item.id)}
        onSwap={() => handleSwapMealItem(editingMealItem!.mealId, editingMealItem!.item.id)}
        isUpdating={isUpdateItemPending}
      />
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
  tabContainer: {
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.xl },
  chipRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: spacing.md,
    justifyContent: 'space-between',
  },
  addMealBtn: { marginBottom: spacing.lg },
});
