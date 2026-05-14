import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';

interface FinishWorkoutModalProps {
  visible: boolean;
  duration: string;
  volume: number;
  completedSets: number;
  totalSets: number;
  onFinish: (data: FinishWorkoutData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface FinishWorkoutData {
  rpe?: number;
  feelingScore?: number;
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
}

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FEELING_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Terrible' },
  { value: 2, emoji: '😐', label: 'Bad' },
  { value: 3, emoji: '😊', label: 'OK' },
  { value: 4, emoji: '😄', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
];

export function FinishWorkoutModal({
  visible,
  duration,
  volume,
  completedSets,
  totalSets,
  onFinish,
  onCancel,
  isLoading,
}: FinishWorkoutModalProps) {
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [feeling, setFeeling] = useState<number | undefined>(undefined);
  const [calories, setCalories] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [maxHr, setMaxHr] = useState('');

  const handleFinish = () => {
    onFinish({
      rpe,
      feelingScore: feeling,
      calories: calories ? Number(calories) : undefined,
      avgHeartRate: avgHr ? Number(avgHr) : undefined,
      maxHeartRate: maxHr ? Number(maxHr) : undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text style={styles.title}>Finish Workout</Text>

            {/* Summary Preview */}
            <View style={styles.summaryRow}>
              <SummaryItem icon="⏱️" value={duration} label="Duration" />
              <SummaryItem icon="🏋️" value={`${volume.toLocaleString()} kg`} label="Volume" />
              <SummaryItem icon="✅" value={`${completedSets}/${totalSets}`} label="Sets" />
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
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Finish Workout"
              variant="primary"
              onPress={handleFinish}
              isLoading={isLoading}
              style={styles.actionBtn}
            />
            <Button
              title="Go Back"
              variant="ghost"
              onPress={onCancel}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SummaryItem({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing['3xl'],
    paddingBottom: 48,
    maxHeight: '85%',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Summary
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
  // Sections
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  // RPE
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
  // Feeling
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
  // Inputs
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
  // Actions
  actions: {
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    width: '100%',
  },
});
