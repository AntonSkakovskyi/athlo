import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';

interface DailyMacrosSummaryProps {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  calorieGoal?: number;
  proteinGoal?: number;
  fatGoal?: number;
  carbGoal?: number;
}

function getMacroColor(percent: number, baseColor: string): string {
  if (percent > 150) return colors.danger;
  if (percent > 100) return colors.warning;
  return baseColor;
}

function getCalorieRingColor(percent: number): string {
  if (percent > 150) return colors.danger;
  if (percent > 100) return colors.warning;
  return colors.primary;
}

export function DailyMacrosSummary({
  calories,
  proteins,
  fats,
  carbs,
  calorieGoal = 2200,
  proteinGoal = 150,
  fatGoal = 70,
  carbGoal = 250,
}: DailyMacrosSummaryProps) {
  const caloriePercent = calorieGoal > 0 ? (calories / calorieGoal) * 100 : 0;
  const ringColor = getCalorieRingColor(caloriePercent);

  return (
    <View style={styles.container}>
      {/* Calorie Ring */}
      <View style={styles.ringSection}>
        <View style={[styles.ringOuter, { borderColor: caloriePercent > 0 ? ringColor : colors.surfaceLight }]}>
          <View style={styles.ringInner}>
            <Text style={[styles.calorieValue, caloriePercent > 100 && { color: ringColor }]}>
              {Math.round(calories)}
            </Text>
            <Text style={styles.calorieLabel}>/ {calorieGoal} kcal</Text>
          </View>
          <View style={[styles.ringProgress, { backgroundColor: ringColor }]}>
            <Text style={styles.ringPercent}>{Math.round(caloriePercent)}%</Text>
          </View>
        </View>
      </View>

      {/* Macro Bars */}
      <View style={styles.macrosRow}>
        <MacroBar label="Protein" value={proteins} goal={proteinGoal} color={colors.info} unit="g" />
        <MacroBar label="Fats" value={fats} goal={fatGoal} color={colors.warning} unit="g" />
        <MacroBar label="Carbs" value={carbs} goal={carbGoal} color={colors.success} unit="g" />
      </View>
    </View>
  );
}

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit: string;
}

function MacroBar({ label, value, goal, color, unit }: MacroBarProps) {
  const percent = goal > 0 ? (value / goal) * 100 : 0;
  const displayPercent = Math.min(percent, 100);
  const activeColor = getMacroColor(percent, color);

  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValue, { color: activeColor }]}>
        {Math.round(value)}{unit}
      </Text>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: `${displayPercent}%`, backgroundColor: activeColor }]} />
      </View>
      <Text style={styles.macroGoal}>{Math.round(value)} / {goal}{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  ringSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringInner: {
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  calorieLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  ringProgress: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ringPercent: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.black,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  macroValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  macroBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  macroGoal: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
