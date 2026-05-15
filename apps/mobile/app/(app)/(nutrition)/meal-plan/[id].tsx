import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { DayTabsRow } from '@/features/nutrition/components';
import { PlanMealCard } from '@/features/nutrition/components';
import { AddMealSheet } from '@/features/nutrition/components';
import { DaySummaryFooter } from '@/features/nutrition/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { getVisibilityLabel, useMealPlanDetailScreen } from '@/features/nutrition/hooks/useMealPlanDetailScreen';

export default function MealPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    plan, isLoading, mealTypes, days, currentDay, currentDayMeals, dayMacros,
    selectedDayIndex, setSelectedDayIndex, showAddMeal, setShowAddMeal,
    editingName, nameValue, setNameValue,
    handleActivate, handleAddDay, handleRemoveDay, handleAddMeal,
    handleRemoveMeal, handleRemoveItem, handleAddFoodToMeal,
    handleSaveName, startEditName, isActivatePending,
  } = useMealPlanDetailScreen(id);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Spinner size="large" />
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Button title="▶ Activate" variant="primary" onPress={handleActivate} isLoading={isActivatePending} style={styles.activateBtn} />
      </View>

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
        {plan.description ? <Text style={styles.planDesc}>{plan.description}</Text> : null}
        <Text style={styles.planMeta}>{plan.totalDays} days · {getVisibilityLabel(plan.visibilityTypeId)}</Text>
      </View>

      <DayTabsRow days={days} selectedIndex={selectedDayIndex} onSelect={setSelectedDayIndex} onAddDay={handleAddDay} onRemoveDay={handleRemoveDay} />

      <ScrollView style={styles.dayContent} contentContainerStyle={styles.dayContentInner} showsVerticalScrollIndicator={false}>
        {!currentDay ? (
          <EmptyState title="No days in this plan" description="Add a day to start planning meals" actionLabel="Add Day" onAction={handleAddDay} />
        ) : currentDayMeals.length === 0 ? (
          <EmptyState title="No meals for this day" description="Add a meal to start planning" actionLabel="+ Add Meal" onAction={() => setShowAddMeal(true)} />
        ) : (
          currentDayMeals.map((meal) => (
            <PlanMealCard key={meal.id} meal={meal} onAddFood={() => handleAddFoodToMeal(meal.id)} onRemoveMeal={() => handleRemoveMeal(meal.id)} onRemoveItem={handleRemoveItem} />
          ))
        )}
        {currentDay && currentDayMeals.length > 0 && (
          <Button title="+ Add Meal" variant="secondary" onPress={() => setShowAddMeal(true)} style={styles.addMealBtn} />
        )}
      </ScrollView>

      {currentDay && currentDayMeals.length > 0 && (
        <DaySummaryFooter calories={dayMacros.calories} proteins={dayMacros.proteins} fats={dayMacros.fats} carbs={dayMacros.carbs} />
      )}

      {showAddMeal && (
        <AddMealSheet mealTypes={mealTypes ?? []} onAdd={handleAddMeal} onClose={() => setShowAddMeal(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { color: colors.textSecondary, fontSize: fontSize.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  activateBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  nameSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  planName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text },
  nameInput: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.primary, paddingVertical: spacing.xs },
  planDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  planMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  dayContent: { flex: 1 },
  dayContentInner: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  addMealBtn: { marginTop: spacing.md },
});
