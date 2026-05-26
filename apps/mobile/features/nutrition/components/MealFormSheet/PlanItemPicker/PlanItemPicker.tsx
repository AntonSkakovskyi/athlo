import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import type { PlanMealWithItems } from '@/features/nutrition/hooks/useNutritionHomeScreen';
import { calcItemMacrosByUnit } from '@/features/nutrition/utils/macros';

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
                  {Math.round(calcItemMacrosByUnit(item.food.units, item.unitId, item.amount).calories)} kcal
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: c.textSecondary,
      marginBottom: spacing.sm,
    },
    selectAll: {
      fontSize: fontSize.sm,
      color: c.primary,
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
      borderBottomColor: c.border,
      gap: spacing.sm,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    checkmark: {
      fontSize: 12,
      color: c.black,
      fontWeight: fontWeight.bold,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: fontSize.sm,
      color: c.text,
      fontWeight: fontWeight.medium,
    },
    itemDetail: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginTop: 1,
    },
    itemCal: {
      fontSize: fontSize.xs,
      color: c.textSecondary,
    },
    emptyPlan: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
  });
}
