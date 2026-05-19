import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { ILogMeal } from '@athlo/shared';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
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
  meal: ILogMeal & { items?: MealItemDisplay[]; timeSuggestion?: string | null };
  onAddItem: (mealId: number) => void;
  onDelete: (mealId: number) => void;
  onDeleteItem?: (itemId: number) => void;
  onEditMeal?: (meal: ILogMeal) => void;
  onEditItem?: (itemId: number) => void;
  onEditTime?: (mealId: number) => void;
}

export function MealCard({ meal, onAddItem, onDelete, onEditMeal, onEditItem, onEditTime, onDeleteItem }: MealCardProps) {
  const mealTime = meal.timeSuggestion 
    ? meal.timeSuggestion 
    : new Date(meal.consumedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
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
          <View style={styles.iconContainer}>
            <Text style={styles.mealIcon}>{getMealIcon(meal.name)}</Text>
          </View>
          <View>
            <Text style={styles.mealName}>{meal.name ?? 'Meal'}</Text>
            <Pressable onPress={() => onEditTime?.(meal.id)} disabled={!onEditTime}>
              <Text style={styles.mealTime}>
                {meal.timeSuggestion ? meal.timeSuggestion : onEditTime ? '+ Set time' : mealTime}
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => onEditMeal?.(meal as any)} hitSlop={12} style={styles.actionBtn}>
            <Text style={styles.editBtnIcon}>✏️</Text>
          </Pressable>
          <Pressable onPress={() => onDelete(meal.id)} hitSlop={12} style={styles.actionBtn}>
            <Text style={styles.deleteBtnIcon}>✕</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.itemsList}>
        {items.map((item) => (
          <Pressable 
            key={item.id} 
            style={({ pressed }) => [
              styles.itemRow,
              pressed && styles.itemRowPressed,
            ]} 
            onPress={() => onEditItem?.(item.id)}
            disabled={!onEditItem}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.foodName}</Text>
              <Text style={styles.itemAmount}>
                {item.amount} {item.unitName}
              </Text>
            </View>
            <Text style={styles.itemCal}>{Math.round(item.calories)} kcal</Text>
          </Pressable>
        ))}
      </View>

      {items.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.totalCalContainer}>
            <Text style={styles.totalCalLabel}>Total:</Text>
            <Text style={styles.totalCalValue}>{Math.round(totalCalories)} kcal</Text>
          </View>
          <View style={styles.macroSummary}>
            <MacroSummaryItem label="P" value={totalProteins} color={colors.info} />
            <MacroSummaryItem label="F" value={totalFats} color={colors.warning} />
            <MacroSummaryItem label="C" value={totalCarbs} color={colors.success} />
          </View>
        </View>
      )}

      <Button
        title="+ Add Food"
        variant="secondary"
        onPress={() => onAddItem(meal.id)}
        style={styles.addItemBtn}
      />
    </View>
  );
}

function MacroSummaryItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macroItem}>
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
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIcon: {
    fontSize: 24,
  },
  mealName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  mealTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: 4,
  },
  editBtnIcon: {
    fontSize: 16,
    opacity: 0.8,
  },
  deleteBtnIcon: {
    fontSize: 16,
    color: colors.danger,
    opacity: 0.8,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  itemRowPressed: {
    backgroundColor: colors.surfaceLight,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  itemAmount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  itemCal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  totalCalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalCalLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  totalCalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  macroSummary: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  macroValue: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  addItemBtn: {
    marginTop: spacing.lg,
  },
});

