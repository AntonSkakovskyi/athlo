import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import type { PlanMealWithItems } from '@/features/nutrition/hooks/useNutritionHomeScreen';

interface PlanItemPickerProps {
  planMeal: PlanMealWithItems;
  selectedItemIds: Set<number>;
  onToggleItem: (id: number) => void;
  onSelectAll: () => void;
}

export function PlanItemPicker({
  planMeal,
  selectedItemIds,
  onToggleItem,
  onSelectAll,
}: PlanItemPickerProps) {
  return (
    <>
      <View style={styles.planHeader}>
        <Text style={styles.label}>From your plan</Text>
        {(planMeal.items?.length ?? 0) > 0 && (
          <Pressable onPress={onSelectAll}>
            <Text style={styles.selectAll}>Select all</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
        {(planMeal.items ?? []).map((item) => {
          const checked = selectedItemIds.has(item.id);
          return (
            <Pressable key={item.id} style={styles.itemRow} onPress={() => onToggleItem(item.id)}>
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
  );
}

const styles = StyleSheet.create({
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  selectAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  itemList: {
    maxHeight: 200,
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
});
