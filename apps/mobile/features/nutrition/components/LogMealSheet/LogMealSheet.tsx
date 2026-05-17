import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import type { IMealType } from '@athlo/shared';
import type { PlanMealWithItems, SelectedPlanItem } from '@/features/nutrition/hooks/useNutritionHomeScreen';

interface LogMealSheetProps {
  mealTypes: IMealType[];
  planDayMeals: PlanMealWithItems[];
  onConfirm: (mealTypeId: number, items: SelectedPlanItem[]) => Promise<void>;
  onClose: () => void;
}

export function LogMealSheet({ mealTypes, planDayMeals, onConfirm, onClose }: LogMealSheetProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);

  const planMeal = useMemo(
    () => planDayMeals.find((m) => m.mealTypeId === selectedTypeId) ?? null,
    [planDayMeals, selectedTypeId],
  );

  const handleSelectType = (id: number) => {
    setSelectedTypeId((prev) => (prev === id ? null : id));
    setSelectedItemIds(new Set());
  };

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!planMeal?.items) return;
    setSelectedItemIds(new Set(planMeal.items.map((i) => i.id)));
  };

  const handleConfirm = async () => {
    if (!selectedTypeId) return;
    const items: SelectedPlanItem[] = (planMeal?.items ?? [])
      .filter((i) => selectedItemIds.has(i.id))
      .map((i) => ({
        foodId: i.foodId,
        unitId: i.unitId,
        amount: i.amount,
        foodName: i.food?.name ?? '',
      }));
    setIsConfirming(true);
    try {
      await onConfirm(selectedTypeId, items);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Meal</Text>

          <Text style={styles.label}>Meal Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
            {mealTypes.map((type) => (
              <Pressable
                key={type.id}
                style={[styles.typeChip, selectedTypeId === type.id && styles.typeChipActive]}
                onPress={() => handleSelectType(type.id)}
              >
                <Text style={[styles.typeChipText, selectedTypeId === type.id && styles.typeChipTextActive]}>
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {planMeal && (
            <>
              <View style={styles.planHeader}>
                <Text style={styles.label}>From your plan</Text>
                {(planMeal.items?.length ?? 0) > 0 && (
                  <Pressable onPress={selectAll}>
                    <Text style={styles.selectAll}>Select all</Text>
                  </Pressable>
                )}
              </View>

              {planMeal.timeSuggestion && (
                <Text style={styles.timeSuggestion}>Suggested time: {planMeal.timeSuggestion}</Text>
              )}

              <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
                {(planMeal.items ?? []).map((item) => {
                  const checked = selectedItemIds.has(item.id);
                  return (
                    <Pressable key={item.id} style={styles.itemRow} onPress={() => toggleItem(item.id)}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.food?.name ?? 'Unknown food'}</Text>
                        <Text style={styles.itemDetail}>
                          {item.amount} {item.unit?.name ?? 'g'}
                        </Text>
                      </View>
                      {item.food && (
                        <Text style={styles.itemCal}>
                          {Math.round((item.food.calories * item.amount) / 100)} kcal
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
                {(planMeal.items?.length ?? 0) === 0 && (
                  <Text style={styles.emptyPlan}>No items in this plan meal</Text>
                )}
              </ScrollView>
            </>
          )}

          {selectedTypeId && !planMeal && planDayMeals.length > 0 && (
            <Text style={styles.noPlanMeal}>No plan suggestion for this meal type today</Text>
          )}

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.actionBtn} />
            <Button
              title="Add Meal"
              variant="primary"
              onPress={handleConfirm}
              disabled={!selectedTypeId}
              isLoading={isConfirming}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing['2xl'],
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  typeRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  selectAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  timeSuggestion: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  itemList: {
    maxHeight: 220,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 12,
    color: colors.black,
    fontWeight: fontWeight.bold,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  itemDetail: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemCal: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  emptyPlan: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  noPlanMeal: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
