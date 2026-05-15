import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '@/constants/theme';

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
  const caloriePercent = calorieGoal > 0 ? Math.min((calories / calorieGoal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      {/* Calorie Ring */}
      <View style={styles.ringSection}>
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            <Text style={styles.calorieValue}>{Math.round(calories)}</Text>
            <Text style={styles.calorieLabel}>/ {calorieGoal} kcal</Text>
          </View>
          {/* Progress arc indicator */}
          <View style={[styles.ringProgress, { opacity: caloriePercent > 0 ? 1 : 0.3 }]}>
            <Text style={styles.ringPercent}>{Math.round(caloriePercent)}%</Text>
          </View>
        </View>
      </View>

      {/* Macro Bars */}
      <View style={styles.macrosRow}>
        <MacroBar label="Protein" value={proteins} goal={proteinGoal} color="#4DA6FF" unit="g" />
        <MacroBar label="Fats" value={fats} goal={fatGoal} color="#FFB020" unit="g" />
        <MacroBar label="Carbs" value={carbs} goal={carbGoal} color="#2BDE6A" unit="g" />
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
  const percent = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValue, { color }]}>
        {Math.round(value)}{unit}
      </Text>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: `${percent}%`, backgroundColor: color }]} />
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
    borderColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringInner: {
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  calorieLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  ringProgress: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ringPercent: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
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
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
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
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
