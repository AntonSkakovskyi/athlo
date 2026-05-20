import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { VisibilitySelector } from '@/components/ui/VisibilitySelector/VisibilitySelector';
import { useFinishWorkoutScreen } from '@/features/workout/hooks/useFinishWorkoutScreen';
import { FEELING_OPTIONS } from '@/utils/icons';

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function SummaryItem({ icon, value, label }: { icon: string; value: string; label: string }) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surfaceLight,
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
    color: colors.text,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  descriptionInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
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
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: {
    width: '100%',
  },
});
