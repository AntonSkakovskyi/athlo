import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useMemo } from 'react';
import { borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { VisibilitySelector } from '@/components/ui/VisibilitySelector/VisibilitySelector';
import { useFinishWorkoutScreen } from '@/features/workout/hooks/useFinishWorkoutScreen';
import { FEELING_OPTIONS } from '@/utils/icons';

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function SummaryItem({ icon, value, label }: { icon: string; value: string; label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function FinishWorkoutScreen() {
  const {
    duration,
    volume,
    completedSets,
    totalSets,
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
    visibility,
    setVisibility,
    description,
    setDescription,
    handleFinish,
    handleDiscard,
    completeWorkoutPending,
    insets,
    router,
  } = useFinishWorkoutScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader title="Finish Workout" onBack={() => router.back()} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <SummaryItem icon="⏱️" value={duration ?? '—'} label="Duration" />
          <SummaryItem icon="🏋️" value={`${Number(volume ?? 0).toLocaleString()} kg`} label="Volume" />
          <SummaryItem icon="✅" value={`${completedSets ?? 0}/${totalSets ?? 0}`} label="Sets" />
        </View>

        <Text style={styles.sectionLabel}>Workout Notes</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="How did it go? (optional)"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <View style={styles.visibilityWrap}>
          <VisibilitySelector value={visibility} onChange={setVisibility} />
        </View>

        <Text style={styles.sectionLabel}>Rate of Perceived Exertion (RPE)</Text>
        <View style={styles.rpeRow}>
          {RPE_VALUES.map((val) => (
            <Pressable
              key={val}
              style={[styles.rpeBtn, rpe === val && styles.rpeBtnActive]}
              onPress={() => setRpe(rpe === val ? undefined : val)}
            >
              <Text style={[styles.rpeText, rpe === val && styles.rpeTextActive]}>{val}</Text>
            </Pressable>
          ))}
        </View>

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
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Finish Workout"
          variant="primary"
          onPress={handleFinish}
          isLoading={completeWorkoutPending}
          style={styles.footerBtn}
        />
        <Button
          title="Discard Workout"
          variant="danger"
          onPress={handleDiscard}
          style={styles.footerBtn}
        />
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing['2xl'],
    },
    summaryRow: {
      flexDirection: 'row',
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing['2xl'],
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryIcon: {
      fontSize: fontSize.xl,
      marginBottom: spacing.xs,
    },
    summaryValue: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    summaryLabel: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginTop: 2,
    },
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      marginBottom: spacing.sm,
    },
    descriptionInput: {
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.sm,
      color: c.text,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
    },
    visibilityWrap: {
      marginBottom: spacing.xl,
    },
    rpeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    rpeBtn: {
      width: 32,
      height: 32,
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
    input: {
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: fontSize.sm,
      color: c.text,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    footer: {
      padding: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    footerBtn: {
      width: '100%',
    },
  });
}
