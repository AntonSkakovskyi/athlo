import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from '@/hooks/useRouter';
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
  ActivationDayPickerModal,
} from '@/features/nutrition/components';
import { VisibilitySelector } from '@/components/ui/VisibilitySelector/VisibilitySelector';
import { calcItemMacrosByUnit } from '@/features/nutrition/utils/macros';
import { useMealPlanDetailScreen } from '@/features/nutrition/hooks/useMealPlanDetailScreen';
import { useAuth } from '@/contexts/AuthContext';
import { ICONS } from '@/utils/icons';

export default function MealPlanDetailScreen() {
  const { id, fromProfileId } = useLocalSearchParams<{ id: string; fromProfileId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (fromProfileId) {
      router.push({ pathname: '/(app)/(profile)/[userId]', params: { userId: fromProfileId } });
    } else {
      router.back();
    }
  };
  const { user } = useAuth();

  const {
    plan, isLoading, mealTypes, days, currentDay, currentDayMeals, dayMacros,
    selectedDayIndex, setSelectedDayIndex, showAddMeal, setShowAddMeal,
    editingMeal, setEditingMeal, editingName, nameValue, setNameValue,
    handleActivate, handleAddDay, handleRemoveDay, handleAddMeal,
    handleRemoveMeal, handleEditMeal, handleConfirmEditMeal, handleRemoveItem,
    handleAddFoodToMeal, handleUpdateItem, handleSwapItem, handleEditMealItem,
    handleSaveName, startEditName, isActive, isActivatePending,
    handleDeactivate, isDeactivatePending,
    isSaved, handleSave, isSavePending,
    editingDesc, descValue, setDescValue, startEditDesc, handleSaveDesc,
    editingMealItem, setEditingMealItem, isUpdateItemPending,
    currentVisibility, handleVisibilityChange,
    showActivationModal, setShowActivationModal,
  } = useMealPlanDetailScreen(id);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isOwner = user?.id === plan?.creatorId;

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
        onBack={handleBack}
        rightAction={
          isActive ? (
            <Button
              title="Deactivate"
              variant="danger"
              onPress={handleDeactivate}
              isLoading={isDeactivatePending}
              style={styles.activateBtn}
            />
          ) : (
            <Button
              title={`${ICONS.activate} Activate`}
              variant="primary"
              onPress={() => setShowActivationModal(true)}
              isLoading={isActivatePending}
              style={styles.activateBtn}
            />
          )
        }
      />

      <View style={styles.nameSection}>
        {editingName && isOwner ? (
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
          <Pressable onPress={isOwner ? startEditName : undefined}>
            <Typography variant="h2">{plan.name}</Typography>
          </Pressable>
        )}
        {editingDesc && isOwner ? (
          <TextInput
            style={styles.descInput}
            value={descValue}
            onChangeText={setDescValue}
            onBlur={handleSaveDesc}
            autoFocus
            multiline
            returnKeyType="done"
            placeholder="Add description..."
          />
        ) : (
          <Pressable onPress={isOwner ? startEditDesc : undefined}>
            <Typography
              variant="body"
              style={plan.description ? styles.planDesc : styles.planDescPlaceholder}
            >
              {plan.description || (isOwner ? 'Tap to add description' : '')}
            </Typography>
          </Pressable>
        )}
        {isOwner && (
          <VisibilitySelector
            value={currentVisibility}
            onChange={handleVisibilityChange}
            label="Visibility"
          />
        )}
      </View>

      <DayTabsRow 
        days={days} 
        selectedIndex={selectedDayIndex} 
        onSelect={setSelectedDayIndex} 
        onAddDay={isOwner ? handleAddDay : undefined} 
        onRemoveDay={isOwner ? handleRemoveDay : undefined} 
      />

      <ScrollView style={styles.dayContent} contentContainerStyle={styles.dayContentInner} showsVerticalScrollIndicator={false}>
        {!currentDay ? (
          <EmptyState 
            title="No days in this plan" 
            description={isOwner ? "Add a day to start planning meals" : "This plan has no days yet"} 
            actionLabel={isOwner ? "Add Day" : undefined} 
            onAction={isOwner ? handleAddDay : undefined} 
          />
        ) : currentDayMeals.length === 0 ? (
          <EmptyState 
            title="No meals for this day" 
            description={isOwner ? "Add a meal to start planning" : "This day has no meals planned"} 
            actionLabel={isOwner ? "+ Add Meal" : undefined} 
            onAction={isOwner ? () => setShowAddMeal(true) : undefined} 
          />
        ) : (
          currentDayMeals.map((meal) => {
            const displayMeal = {
              ...meal,
              name: meal.mealType?.name ?? `Meal #${meal.order}`,
              consumedAt: new Date().toISOString(),
              items: meal.items?.map((item) => {
                const m = calcItemMacrosByUnit(item.food?.units, item.unitId, item.amount);
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
                  onAddItem={isOwner ? handleAddFoodToMeal : undefined}
                  onDelete={isOwner ? handleRemoveMeal : undefined}
                  onEditMeal={isOwner ? handleEditMeal : undefined}
                  onEditItem={isOwner ? (itemId) => {
                    const item = meal.items?.find(i => i.id === itemId);
                    if (item) handleEditMealItem(meal.id, item);
                  } : undefined}
                />
              </View>
            );
          })
        )}
        {currentDay && currentDayMeals.length > 0 && isOwner && (
          <Button title="+ Add Meal" variant="secondary" onPress={() => setShowAddMeal(true)} style={styles.addMealBtn} />
        )}
      </ScrollView>

      {currentDay && currentDayMeals.length > 0 && (
        <DaySummaryFooter calories={dayMacros.calories} proteins={dayMacros.proteins} fats={dayMacros.fats} carbs={dayMacros.carbs} />
      )}

      {!isOwner && (
        <View style={styles.saveFooter}>
          <Button
            title={isSaved ? '✓ Saved' : '+ Save Plan'}
            variant={isSaved ? 'secondary' : 'primary'}
            onPress={handleSave}
            isLoading={isSavePending}
            style={styles.saveFooterBtn}
          />
        </View>
      )}

      {showAddMeal && isOwner && (
        <MealFormSheet
          title="Add Meal to Plan"
          confirmLabel="Add"
          mealTypes={mealTypes ?? []}
          onConfirm={(data) => handleAddMeal(data.mealTypeId, data.timeSuggestion)}
          onClose={() => setShowAddMeal(false)}
          showNameInput={false}
        />
      )}

      {editingMeal && mealTypes && isOwner && (
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
        visible={!!editingMealItem && isOwner}
        onClose={() => setEditingMealItem(null)}
        item={editingMealItem?.item as any}
        onUpdate={handleUpdateItem}
        onDelete={() => editingMealItem && handleRemoveItem(editingMealItem.item.id)}
        onSwap={handleSwapItem}
        isUpdating={isUpdateItemPending}
      />

      <ActivationDayPickerModal
        visible={showActivationModal}
        totalDays={days.length}
        planName={plan.name}
        onClose={() => setShowActivationModal(false)}
        onConfirm={handleActivate}
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
    planDescPlaceholder: { marginTop: spacing.xs, color: c.textMuted },
    descInput: {
      fontSize: fontSize.sm,
      color: c.text,
      borderBottomWidth: 1,
      borderBottomColor: c.primary,
      paddingVertical: spacing.xs,
      marginTop: spacing.xs,
    },
    planMeta: { marginTop: spacing.xs },
    dayContent: { flex: 1 },
    dayContentInner: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    addMealBtn: { marginTop: spacing.md },
    saveFooter: {
      padding: spacing.lg,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    saveFooterBtn: { width: '100%' },
  });
}
