import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { colors, borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
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
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="kcal"
            placeholderTextColor={colors.textMuted}
            value={calories}
            onChangeText={setCalories}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Avg HR</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="bpm"
            placeholderTextColor={colors.textMuted}
            value={avgHr}
            onChangeText={setAvgHr}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Max HR</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="bpm"
            placeholderTextColor={colors.textMuted}
            value={maxHr}
            onChangeText={setMaxHr}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rpeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rpeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  rpeTextActive: {
    color: colors.black,
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
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  feelingEmoji: {
    fontSize: fontSize['3xl'],
    marginBottom: spacing.xs,
  },
  feelingLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  feelingLabelActive: {
    color: colors.primary,
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
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
