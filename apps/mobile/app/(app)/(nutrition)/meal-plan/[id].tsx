import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { Typography } from '@/components/ui/Typography/Typography';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useMemo } from 'react';
import {
  DayTabsRow,
  MealCard,
  MealFormSheet,
  MealItemActionSheet,
  DaySummaryFooter,
} from '@/features/nutrition/components';
import { calcItemMacros } from '@/features/nutrition/utils/macros';
import { getVisibilityLabel } from '@/utils/visibility';
import { useMealPlanDetailScreen } from '@/features/nutrition/hooks/useMealPlanDetailScreen';

export default function MealPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    plan, isLoading, mealTypes, days, currentDay, currentDayMeals, dayMacros,
    selectedDayIndex, setSelectedDayIndex, showAddMeal, setShowAddMeal,
    editingMeal, setEditingMeal, editingName, nameValue, setNameValue,
    handleActivate, handleAddDay, handleRemoveDay, handleAddMeal,
    handleRemoveMeal, handleEditMeal, handleConfirmEditMeal, handleRemoveItem,
    handleAddFoodToMeal, handleUpdateItem, handleSwapItem, handleEditMealItem,
    handleSaveName, startEditName, isActive, isActivatePending,
    editingMealItem, setEditingMealItem, isUpdateItemPending,
  } = useMealPlanDetailScreen(id);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
        <Typography variant="body" color={colors.textSecondary}>Plan not found</Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title=""
        onBack={() => router.back()}
        rightAction={
          !isActive ? (
            <Button
              title="▶ Activate"
              variant="primary"
              onPress={handleActivate}
              isLoading={isActivatePending}
              style={styles.activateBtn}
            />
          ) : undefined
        }
      />

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
            <Typography variant="h2">{plan.name}</Typography>
          </Pressable>
        )}
        {plan.description ? (
          <Typography variant="bodySmall" style={styles.planDesc}>{plan.description}</Typography>
        ) : null}
        <Typography variant="caption" style={styles.planMeta}>
          {plan.totalDays} days · {getVisibilityLabel(plan.visibilityTypeId)}
        </Typography>
      </View>

      <DayTabsRow days={days} selectedIndex={selectedDayIndex} onSelect={setSelectedDayIndex} onAddDay={handleAddDay} onRemoveDay={handleRemoveDay} />

      <ScrollView style={styles.dayContent} contentContainerStyle={styles.dayContentInner} showsVerticalScrollIndicator={false}>
        {!currentDay ? (
          <EmptyState title="No days in this plan" description="Add a day to start planning meals" actionLabel="Add Day" onAction={handleAddDay} />
        ) : currentDayMeals.length === 0 ? (
          <EmptyState title="No meals for this day" description="Add a meal to start planning" actionLabel="+ Add Meal" onAction={() => setShowAddMeal(true)} />
        ) : (
          currentDayMeals.map((meal) => {
            const displayMeal = {
              ...meal,
              name: meal.mealType?.name ?? `Meal #${meal.order}`,
              consumedAt: new Date().toISOString(),
              items: meal.items?.map((item) => {
                const m = calcItemMacros(item.food, item.amount);
                return {
                  id: item.id,
                  foodName: item.food?.name ?? 'Unknown',
                  amount: item.amount,
                  unitName: item.unit?.name ?? 'g',
                  ...m,
                };
              }) ?? [],
            };
            return (
              <View key={meal.id}>
                <MealCard
                  meal={displayMeal as any}
                  onAddItem={() => handleAddFoodToMeal(meal.id)}
                  onDelete={() => handleRemoveMeal(meal.id)}
                  onEditMeal={() => handleEditMeal(meal)}
                  onEditItem={(itemId) => {
                    const item = meal.items?.find(i => i.id === itemId);
                    if (item) handleEditMealItem(meal.id, item);
                  }}
                />
              </View>
            );
          })
        )}
        {currentDay && currentDayMeals.length > 0 && (
          <Button title="+ Add Meal" variant="secondary" onPress={() => setShowAddMeal(true)} style={styles.addMealBtn} />
        )}
      </ScrollView>

      {currentDay && currentDayMeals.length > 0 && (
        <DaySummaryFooter calories={dayMacros.calories} proteins={dayMacros.proteins} fats={dayMacros.fats} carbs={dayMacros.carbs} />
      )}

      {showAddMeal && (
        <MealFormSheet
          title="Add Meal to Plan"
          confirmLabel="Add"
          mealTypes={mealTypes ?? []}
          onConfirm={(data) => handleAddMeal(data.mealTypeId, data.timeSuggestion)}
          onClose={() => setShowAddMeal(false)}
          showNameInput={false}
        />
      )}

      {editingMeal && mealTypes && (
        <MealFormSheet
          title="Edit Meal"
          confirmLabel="Save Changes"
          mealTypes={mealTypes}
          onConfirm={(data) => handleConfirmEditMeal(editingMeal.id, data)}
          onClose={() => setEditingMeal(null)}
          initialTypeId={editingMeal.mealTypeId}
          initialTimeSuggestion={editingMeal.timeSuggestion ?? ''}
          showNameInput={false}
        />
      )}

      <MealItemActionSheet
        visible={!!editingMealItem}
        onClose={() => setEditingMealItem(null)}
        item={editingMealItem?.item as any}
        onUpdate={handleUpdateItem}
        onDelete={() => editingMealItem && handleRemoveItem(editingMealItem.item.id)}
        onSwap={handleSwapItem}
        isUpdating={isUpdateItemPending}
      />
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    activateBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    nameSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    nameInput: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: c.text,
      borderBottomWidth: 1,
      borderBottomColor: c.primary,
      paddingVertical: spacing.xs,
    },
    planDesc: { marginTop: spacing.xs },
    planMeta: { marginTop: spacing.xs },
    dayContent: { flex: 1 },
    dayContentInner: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    addMealBtn: { marginTop: spacing.md },
  });
}
