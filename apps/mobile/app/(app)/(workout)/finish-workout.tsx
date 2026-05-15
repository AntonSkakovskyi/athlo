import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { useActiveWorkout } from '../../../contexts/ActiveWorkoutContext';
import { useCompleteWorkout, useDeleteWorkout } from '@/features/workout/hooks';

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FEELING_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Terrible' },
  { value: 2, emoji: '😐', label: 'Bad' },
  { value: 3, emoji: '😊', label: 'OK' },
  { value: 4, emoji: '😄', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
];

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { duration, volume, completedSets, totalSets } = useLocalSearchParams<{
    duration: string;
    volume: string;
    completedSets: string;
    totalSets: string;
  }>();

  const { workout, endWorkout } = useActiveWorkout();
  const completeWorkout = useCompleteWorkout();
  const deleteWorkout = useDeleteWorkout();

  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [feeling, setFeeling] = useState<number | undefined>(undefined);
  const [calories, setCalories] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [maxHr, setMaxHr] = useState('');

  const handleFinish = () => {
    if (!workout) return;
    completeWorkout.mutate(
      {
        id: String(workout.id),
        data: {
          rpe,
          feelingScore: feeling,
          calories: calories ? Number(calories) : undefined,
          avgHeartRate: avgHr ? Number(avgHr) : undefined,
          maxHeartRate: maxHr ? Number(maxHr) : undefined,
        },
      },
      {
        onSuccess: () => {
          endWorkout();
          router.replace({
            pathname: '/(app)/(workout)/workout-summary',
            params: { workoutId: String(workout.id) },
          });
        },
      },
    );
  };

  const handleDiscard = () => {
    if (!workout) return;
    Alert.alert(
      'Discard Workout',
      'All progress will be lost. This cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            deleteWorkout.mutate(String(workout.id), {
              onSuccess: () => {
                endWorkout();
                router.replace('/(app)/(workout)');
              },
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader title="Finish Workout" onBack={() => router.back()} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Preview */}
        <View style={styles.summaryRow}>
          <SummaryItem icon="⏱️" value={duration ?? '—'} label="Duration" />
          <SummaryItem icon="🏋️" value={`${Number(volume ?? 0).toLocaleString()} kg`} label="Volume" />
          <SummaryItem icon="✅" value={`${completedSets ?? 0}/${totalSets ?? 0}`} label="Sets" />
        </View>

        {/* RPE Selector */}
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
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Finish Workout"
          variant="primary"
          onPress={handleFinish}
          isLoading={completeWorkout.isPending}
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
    paddingBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  rpeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
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
    fontWeight: '600',
    color: colors.text,
  },
  rpeTextActive: {
    color: '#000',
  },
  feelingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  feelingBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  feelingBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  feelingEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  feelingLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  feelingLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: {
    width: '100%',
  },
});
