import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { ILogMeal } from '@athlo/shared';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';

export interface MealItemDisplay {
  id: number;
  foodName: string;
  amount: number;
  unitName: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

interface MealCardProps {
  meal: ILogMeal & { items?: MealItemDisplay[] };
  onAddItem: (mealId: number) => void;
  onDelete: (mealId: number) => void;
  onDeleteItem?: (itemId: number) => void;
}

export function MealCard({ meal, onAddItem, onDelete, onDeleteItem }: MealCardProps) {
  const mealTime = new Date(meal.consumedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const items = meal.items ?? [];
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProteins = items.reduce((sum, item) => sum + item.proteins, 0);
  const totalFats = items.reduce((sum, item) => sum + item.fats, 0);
  const totalCarbs = items.reduce((sum, item) => sum + item.carbs, 0);

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

      {items.length > 0 && (
        <View style={styles.macroRow}>
          <MacroChip label="P" value={totalProteins} color={colors.primary} />
          <MacroChip label="F" value={totalFats} color={colors.warning} />
          <MacroChip label="C" value={totalCarbs} color={colors.success} />
        </View>
      )}

      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={styles.itemName} numberOfLines={1}>{item.foodName}</Text>
          <Text style={styles.itemAmount}>
            {item.amount} {item.unitName}
          </Text>
          <Text style={styles.itemCal}>{Math.round(item.calories)}</Text>
          {onDeleteItem && (
            <Pressable onPress={() => onDeleteItem(item.id)} hitSlop={8} style={styles.itemDelete}>
              <Text style={styles.itemDeleteText}>✕</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Button
        title="+ Add Food"
        variant="secondary"
        onPress={() => onAddItem(meal.id)}
        style={styles.addItemBtn}
      />
    </View>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macroChip}>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
      <Text style={styles.macroValue}>{Math.round(value)}g</Text>
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
    marginBottom: spacing.sm,
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
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  macroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroValue: {
    fontSize: 11,
    color: colors.textSecondary,
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
    marginRight: spacing.sm,
  },
  itemCal: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  itemDelete: {
    marginLeft: spacing.sm,
  },
  itemDeleteText: {
    fontSize: 12,
    color: colors.danger,
  },
  addItemBtn: {
    marginTop: spacing.md,
  },
});
