import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { MealItemRow } from './MealItemRow';

interface PlanMealItemDisplay {
  id: number;
  amount: number;
  food?: { id: number; name: string; calories: number; proteins: number; fats: number; carbs: number };
  unit?: { id: number; name: string };
}

interface PlanMealDisplay {
  id: number;
  mealTypeId: number;
  order: number;
  timeSuggestion: string | null;
  mealType?: { id: number; name: string };
  items?: PlanMealItemDisplay[];
}

interface PlanMealCardProps {
  meal: PlanMealDisplay;
  onAddFood: () => void;
  onRemoveMeal: () => void;
  onRemoveItem: (itemId: number) => void;
  onUpdateTime?: (mealId: number, timeSuggestion: string) => void;
}

export function PlanMealCard({ meal, onAddFood, onRemoveMeal, onRemoveItem, onUpdateTime }: PlanMealCardProps) {
  const mealName = meal.mealType?.name ?? `Meal #${meal.order}`;
  const items = meal.items ?? [];

  const [editingTime, setEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState(meal.timeSuggestion ?? '');

  const totals = items.reduce(
    (acc, item) => {
      if (item.food) {
        const factor = item.amount / 100;
        acc.calories += item.food.calories * factor;
        acc.proteins += item.food.proteins * factor;
        acc.fats += item.food.fats * factor;
        acc.carbs += item.food.carbs * factor;
      }
      return acc;
    },
    { calories: 0, proteins: 0, fats: 0, carbs: 0 },
  );

  const handleSaveTime = () => {
    onUpdateTime?.(meal.id, timeValue.trim());
    setEditingTime(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.mealIcon}>{getMealIcon(mealName)}</Text>
          <View>
            <Text style={styles.mealName}>{mealName}</Text>
            {editingTime ? (
              <View style={styles.timeEditRow}>
                <TextInput
                  style={styles.timeInput}
                  value={timeValue}
                  onChangeText={setTimeValue}
                  placeholder="e.g. 08:00"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveTime}
                />
                <Pressable onPress={handleSaveTime} hitSlop={8}>
                  <Text style={styles.saveTime}>✓</Text>
                </Pressable>
                <Pressable onPress={() => { setTimeValue(meal.timeSuggestion ?? ''); setEditingTime(false); }} hitSlop={8}>
                  <Text style={styles.cancelTime}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => onUpdateTime && setEditingTime(true)} disabled={!onUpdateTime}>
                <Text style={styles.timeSuggestion}>
                  {meal.timeSuggestion ? meal.timeSuggestion : onUpdateTime ? '+ Set time' : ''}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        <Pressable onPress={onRemoveMeal} hitSlop={8}>
          <Text style={styles.deleteBtn}>✕</Text>
        </Pressable>
      </View>

      {/* Food Items */}
      {items.map((item) => (
        <MealItemRow key={item.id} item={item} onRemove={onRemoveItem} />
      ))}

      {/* Meal Totals */}
      {items.length > 0 && (
        <View style={styles.totals}>
          <Text style={styles.totalText}>{Math.round(totals.calories)} kcal</Text>
          <Text style={styles.totalMacros}>
            P: {Math.round(totals.proteins)}g · F: {Math.round(totals.fats)}g · C: {Math.round(totals.carbs)}g
          </Text>
        </View>
      )}

      {/* Add Food */}
      <Button title="+ Add Food" variant="secondary" onPress={onAddFood} style={styles.addFoodBtn} />
    </View>
  );
}

function getMealIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('breakfast')) return '🌅';
  if (lower.includes('lunch')) return '☀️';
  if (lower.includes('dinner')) return '🌙';
  if (lower.includes('snack')) return '🍿';
  return '🍽️';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealIcon: {
    fontSize: 24,
  },
  mealName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  timeSuggestion: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  timeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  timeInput: {
    fontSize: fontSize.xs,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
    minWidth: 60,
  },
  saveTime: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  cancelTime: {
    fontSize: 12,
    color: colors.danger,
  },
  deleteBtn: {
    fontSize: 16,
    color: colors.textMuted,
  },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  totalText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  totalMacros: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  addFoodBtn: {
    marginTop: spacing.md,
  },
});
