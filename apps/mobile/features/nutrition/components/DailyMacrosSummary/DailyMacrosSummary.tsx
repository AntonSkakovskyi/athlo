import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

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

function getProgressColor(percent: number, c: ColorPalette): string {
  if (percent > 150) return c.danger;
  if (percent > 100) return c.warning;
  return c.success;
}

export function DailyMacrosSummary({
  calories,
  proteins,
  fats,
  carbs,
  calorieGoal,
  proteinGoal,
  fatGoal,
  carbGoal,
}: DailyMacrosSummaryProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // If calorieGoal is not passed but macros are, calculate it.
  const finalCalorieGoal = calorieGoal ?? (
    (proteinGoal || fatGoal || carbGoal)
      ? Math.round((proteinGoal ?? 0) * 4 + (fatGoal ?? 0) * 9 + (carbGoal ?? 0) * 4)
      : undefined
  );

  const hasGoals = finalCalorieGoal !== undefined;
  const caloriePercent = finalCalorieGoal && finalCalorieGoal > 0 ? (calories / finalCalorieGoal) * 100 : 0;
  const ringColor = hasGoals ? getProgressColor(caloriePercent, colors) : colors.surfaceLight;

  return (
    <View style={styles.container}>
      {/* Calorie Ring */}
      <View style={styles.ringSection}>
        <View style={[styles.ringOuter, { borderColor: caloriePercent > 0 || !hasGoals ? ringColor : colors.surfaceLight }]}>
          <View style={styles.ringInner}>
            <Text style={[styles.calorieValue, caloriePercent > 100 && hasGoals && { color: ringColor }]}>
              {Math.round(calories)}
            </Text>
            <Text style={styles.calorieLabel}>
              {hasGoals ? `/ ${finalCalorieGoal} kcal` : 'kcal consumed'}
            </Text>
          </View>
          {hasGoals && (
            <View style={[styles.ringProgress, { backgroundColor: ringColor }]}>
              <Text style={styles.ringPercent}>{Math.round(caloriePercent)}%</Text>
            </View>
          )}
        </View>
      </View>

      {/* Macro Bars */}
      <View style={styles.macrosRow}>
        <MacroBar label="Protein" value={proteins} goal={proteinGoal} unit="g" />
        <MacroBar label="Fats" value={fats} goal={fatGoal} unit="g" />
        <MacroBar label="Carbs" value={carbs} goal={carbGoal} unit="g" />
      </View>
    </View>
  );
}

interface MacroBarProps {
  label: string;
  value: number;
  goal?: number;
  unit: string;
}

function MacroBar({ label, value, goal, unit }: MacroBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const hasGoal = goal !== undefined && goal > 0;
  const percent = hasGoal ? (value / goal) * 100 : 0;
  const displayPercent = Math.min(percent, 100);
  const activeColor = hasGoal ? getProgressColor(percent, colors) : colors.text;

  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValue, { color: activeColor }]}>
        {Math.round(value)}{unit}
      </Text>
      {hasGoal ? (
        <>
          <View style={styles.macroBarBg}>
            <View style={[styles.macroBarFill, { width: `${displayPercent}%`, backgroundColor: activeColor }]} />
          </View>
          <Text style={styles.macroGoal}>{Math.round(value)} / {goal}{unit}</Text>
        </>
      ) : (
        <>
          <View style={styles.macroBarBg}>
            <View style={[styles.macroBarFill, { width: '100%', backgroundColor: colors.surfaceLight }]} />
          </View>
          <Text style={styles.macroGoal}>{Math.round(value)}{unit}</Text>
        </>
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.text,
    },
    calorieLabel: {
      fontSize: fontSize.xs,
      color: c.textMuted,
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
      color: c.black,
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
      color: c.textMuted,
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
      backgroundColor: c.surfaceLight,
      borderRadius: 2,
      overflow: 'hidden',
    },
    macroBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    macroGoal: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginTop: spacing.xs,
    },
  });
}
