import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { ILogMeal } from '@athlo/shared';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';

interface MealCardProps {
  meal: ILogMeal & { items?: MealItemDisplay[] };
  onAddItem: (mealId: number) => void;
  onDelete: (mealId: number) => void;
}

export interface MealItemDisplay {
  id: number;
  foodName: string;
  amount: number;
  unitName: string;
  calories: number;
}

export function MealCard({ meal, onAddItem, onDelete }: MealCardProps) {
  const mealTime = new Date(meal.consumedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalCalories = (meal.items ?? []).reduce((sum, item) => sum + item.calories, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.mealIcon}>{getMealIcon(meal.name)}</Text>
          <View>
            <Text style={styles.mealName}>{meal.name ?? 'Meal'}</Text>
            <Text style={styles.mealTime}>{mealTime}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalCal}>{Math.round(totalCalories)} kcal</Text>
          <Pressable onPress={() => onDelete(meal.id)} hitSlop={8}>
            <Text style={styles.deleteBtn}>✕</Text>
          </Pressable>
        </View>
      </View>

      {/* Food Items */}
      {(meal.items ?? []).map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={styles.itemName} numberOfLines={1}>{item.foodName}</Text>
          <Text style={styles.itemAmount}>
            {item.amount} {item.unitName}
          </Text>
          <Text style={styles.itemCal}>{Math.round(item.calories)}</Text>
        </View>
      ))}

      {/* Add food button */}
      <Button
        title="+ Add Food"
        variant="secondary"
        onPress={() => onAddItem(meal.id)}
        style={styles.addItemBtn}
      />
    </View>
  );
}

function getMealIcon(name: string | null): string {
  const lower = (name ?? '').toLowerCase();
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  mealTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  totalCal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  deleteBtn: {
    fontSize: 16,
    color: colors.danger,
    padding: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  itemAmount: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  itemCal: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  addItemBtn: {
    marginTop: spacing.md,
  },
});
