import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../../constants/theme';

interface DaySummaryFooterProps {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export function DaySummaryFooter({ calories, proteins, fats, carbs }: DaySummaryFooterProps) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.value}>{Math.round(calories)}</Text>
        <Text style={styles.label}>kcal</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.item}>
        <Text style={[styles.value, styles.proteinColor]}>{Math.round(proteins)}g</Text>
        <Text style={styles.label}>Protein</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.item}>
        <Text style={[styles.value, styles.fatColor]}>{Math.round(fats)}g</Text>
        <Text style={styles.label}>Fats</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.item}>
        <Text style={[styles.value, styles.carbColor]}>{Math.round(carbs)}g</Text>
        <Text style={styles.label}>Carbs</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  item: {
    alignItems: 'center',
  },
  value: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  separator: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  proteinColor: {
    color: colors.info,
  },
  fatColor: {
    color: colors.warning,
  },
  carbColor: {
    color: colors.primary,
  },
});
