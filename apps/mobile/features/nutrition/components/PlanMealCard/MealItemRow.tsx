import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, fontSize } from '@/constants/theme';

interface MealItemDisplay {
  id: number;
  amount: number;
  food?: { id: number; name: string; calories: number; proteins: number; fats: number; carbs: number };
  unit?: { id: number; name: string };
}

interface MealItemRowProps {
  item: MealItemDisplay;
  onRemove: (itemId: number) => void;
}

export function MealItemRow({ item, onRemove }: MealItemRowProps) {
  const calories = item.food ? Math.round((item.food.calories * item.amount) / 100) : 0;

  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemName} numberOfLines={1}>
        {item.food?.name ?? 'Unknown'}
      </Text>
      <Text style={styles.itemAmount}>
        {item.amount} {item.unit?.name ?? 'g'}
      </Text>
      <Text style={styles.itemCal}>{calories}</Text>
      <Pressable onPress={() => onRemove(item.id)} hitSlop={8}>
        <Text style={styles.itemDelete}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
