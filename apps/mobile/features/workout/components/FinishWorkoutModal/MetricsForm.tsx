import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { NumericInput } from '@/components/ui';
import { FEELING_OPTIONS } from '@/utils/icons';

interface MetricsFormProps {
  rpe: number | undefined;
  setRpe: (v: number | undefined) => void;
  feeling: number | undefined;
  setFeeling: (v: number | undefined) => void;
  calories: string;
  setCalories: (v: string) => void;
  avgHr: string;
  setAvgHr: (v: string) => void;
  maxHr: string;
  setMaxHr: (v: string) => void;
}

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function MetricsForm({
  rpe,
  setRpe,
  feeling,
  setFeeling,
  calories,
  setCalories,
  avgHr,
  setAvgHr,
  maxHr,
  setMaxHr,
}: MetricsFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      {/* RPE Selector */}
      <Text style={styles.sectionLabel}>Rate of Perceived Exertion (RPE)</Text>
      <View style={styles.rpeRow}>
        {RPE_VALUES.map((val) => (
          <Pressable
            key={val}
            style={[styles.rpeBtn, rpe === val && styles.rpeBtnActive]}
            onPress={() => setRpe(rpe === val ? undefined : val)}
          >
            <Text style={[styles.rpeText, rpe === val && styles.rpeTextActive]}>
              {val}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Feeling Selector */}
      <Text style={styles.sectionLabel}>How do you feel?</Text>
      <View style={styles.feelingRow}>
        {FEELING_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.feelingBtn, feeling === opt.value && styles.feelingBtnActive]}
            onPress={() => setFeeling(feeling === opt.value ? undefined : opt.value)}
          >
            <Text style={styles.feelingEmoji}>{opt.emoji}</Text>
            <Text style={[styles.feelingLabel, feeling === opt.value && styles.feelingLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Optional Numeric Inputs */}
      <Text style={styles.sectionLabel}>Additional Metrics (optional)</Text>
      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Calories</Text>
          <NumericInput placeholder="kcal" value={calories} onChangeText={setCalories} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Avg HR</Text>
          <NumericInput placeholder="bpm" value={avgHr} onChangeText={setAvgHr} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Max HR</Text>
          <NumericInput placeholder="bpm" value={maxHr} onChangeText={setMaxHr} />
        </View>
      </View>
    </>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      marginBottom: spacing.sm,
    },
    rpeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    rpeBtn: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.sm,
      backgroundColor: c.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    rpeBtnActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    rpeText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.text,
    },
    rpeTextActive: {
      color: c.black,
    },
    feelingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xl,
    },
    feelingBtn: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    feelingBtnActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    feelingEmoji: {
      fontSize: fontSize['3xl'],
      marginBottom: spacing.xs,
    },
    feelingLabel: {
      fontSize: fontSize.xs,
      color: c.textMuted,
    },
    feelingLabelActive: {
      color: c.primary,
      fontWeight: fontWeight.semibold,
    },
    inputsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing['2xl'],
    },
    inputGroup: {
      flex: 1,
    },
    inputLabel: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginBottom: spacing.xs,
    },
  });
}
