import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

interface MacroBreakdownProps {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export function MacroBreakdown({ calories, proteins, fats, carbs }: MacroBreakdownProps) {
  return (
    <View style={styles.macroPreview}>
      <View style={styles.macroPreviewItem}>
        <Text style={styles.macroPreviewValue}>{calories}</Text>
        <Text style={styles.macroPreviewLabel}>kcal</Text>
      </View>
      <View style={styles.macroPreviewItem}>
        <Text style={[styles.macroPreviewValue, { color: colors.info }]}>{proteins}g</Text>
        <Text style={styles.macroPreviewLabel}>Protein</Text>
      </View>
      <View style={styles.macroPreviewItem}>
        <Text style={[styles.macroPreviewValue, { color: colors.warning }]}>{fats}g</Text>
        <Text style={styles.macroPreviewLabel}>Fats</Text>
      </View>
      <View style={styles.macroPreviewItem}>
        <Text style={[styles.macroPreviewValue, { color: colors.success }]}>{carbs}g</Text>
        <Text style={styles.macroPreviewLabel}>Carbs</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  macroPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  macroPreviewItem: {
    alignItems: 'center',
  },
  macroPreviewValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  macroPreviewLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
});
