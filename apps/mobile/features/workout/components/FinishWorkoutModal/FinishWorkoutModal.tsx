import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { MetricsForm } from './MetricsForm';

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

            <MetricsForm
              rpe={rpe}
              setRpe={setRpe}
              feeling={feeling}
              setFeeling={setFeeling}
              calories={calories}
              setCalories={setCalories}
              avgHr={avgHr}
              setAvgHr={setAvgHr}
              maxHr={maxHr}
              setMaxHr={setMaxHr}
            />
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
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  // Summary
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
  // Actions
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
});
