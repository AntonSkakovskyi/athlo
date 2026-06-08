import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { BottomSheet } from '@/components/ui';
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

  const footer = (
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
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      title="Finish Workout"
      footer={footer}
      maxHeight="85%"
      scrollable={false}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
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
    </BottomSheet>
  );
}

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
    },
    // Summary
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
    // Actions
    actions: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    actionBtn: {
      width: '100%',
    },
  });
}
