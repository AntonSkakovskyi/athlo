import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';

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
}

export function PlanMealCard({ meal, onAddFood, onRemoveMeal, onRemoveItem }: PlanMealCardProps) {
  const mealName = meal.mealType?.name ?? `Meal #${meal.order}`;
  const items = meal.items ?? [];

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.mealIcon}>{getMealIcon(mealName)}</Text>
          <View>
            <Text style={styles.mealName}>{mealName}</Text>
            {meal.timeSuggestion ? (
              <Text style={styles.timeSuggestion}>{meal.timeSuggestion}</Text>
            ) : null}
          </View>
        </View>
        <Pressable onPress={onRemoveMeal} hitSlop={8}>
          <Text style={styles.deleteBtn}>✕</Text>
        </Pressable>
      </View>

      {/* Food Items */}
      {items.map((item) => {
        const calories = item.food ? Math.round((item.food.calories * item.amount) / 100) : 0;
        return (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.food?.name ?? 'Unknown'}
            </Text>
            <Text style={styles.itemAmount}>
              {item.amount} {item.unit?.name ?? 'g'}
            </Text>
            <Text style={styles.itemCal}>{calories}</Text>
            <Pressable onPress={() => onRemoveItem(item.id)} hitSlop={8}>
              <Text style={styles.itemDelete}>✕</Text>
            </Pressable>
          </View>
        );
      })}

      {/* Meal Totals */}
      {items.length > 0 && (
        <View style={styles.totals}>
          <Text style={styles.totalText}>
            {Math.round(totals.calories)} kcal
          </Text>
          <Text style={styles.totalMacros}>
            P: {Math.round(totals.proteins)}g · F: {Math.round(totals.fats)}g · C: {Math.round(totals.carbs)}g
          </Text>
        </View>
      )}

      {/* Add Food */}
      <Button
        title="+ Add Food"
        variant="secondary"
        onPress={onAddFood}
        style={styles.addFoodBtn}
      />
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
  deleteBtn: {
    fontSize: 16,
    color: colors.textMuted,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  itemAmount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  itemCal: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    width: 40,
    textAlign: 'right',
  },
  itemDelete: {
    fontSize: 12,
    color: colors.danger,
    marginLeft: spacing.xs,
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
