import { View, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import type { IWaterLog } from '@athlo/shared';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { WaterLogEntry } from './WaterLogEntry';

interface WaterTrackerProps {
  waterLogs: IWaterLog[];
  totalWaterMl: number;
  waterGoal?: number;
  onAddWater: (ml: number) => void;
  onDeleteWater: (id: number) => void;
}

const QUICK_ADD_OPTIONS = [150, 250, 500];

export function WaterTracker({
  waterLogs,
  totalWaterMl,
  waterGoal = 2500,
  onAddWater,
  onDeleteWater,
}: WaterTrackerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const percent = waterGoal > 0 ? Math.min((totalWaterMl / waterGoal) * 100, 100) : 0;

  const handleCustomAdd = () => {
    const ml = parseInt(customAmount, 10);
    if (ml > 0) {
      onAddWater(ml);
      setCustomAmount('');
      setShowCustom(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💧 Water</Text>
        <Text style={styles.summary}>
          {totalWaterMl} / {waterGoal} ml
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddRow}>
        {QUICK_ADD_OPTIONS.map((ml) => (
          <Button
            key={ml}
            title={`+${ml} ml`}
            variant="secondary"
            onPress={() => onAddWater(ml)}
            style={styles.quickAddBtn}
          />
        ))}
        <Button
          title="Custom"
          variant="ghost"
          onPress={() => setShowCustom(!showCustom)}
          style={styles.quickAddBtn}
        />
      </View>

      {/* Custom Input */}
      {showCustom && (
        <View style={styles.customRow}>
          <Input
            value={customAmount}
            onChangeText={setCustomAmount}
            keyboardType="number-pad"
            placeholder="ml"
            style={styles.customInput}
          />
          <Button
            title="Add"
            variant="primary"
            onPress={handleCustomAdd}
            style={styles.customAddBtn}
          />
        </View>
      )}

      {/* Water Log List */}
      {waterLogs.length > 0 && (
        <View style={styles.logList}>
          {waterLogs.map((log) => (
            <WaterLogEntry key={log.id} log={log} onDelete={onDeleteWater} />
          ))}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  summary: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.info,
    borderRadius: borderRadius.xs,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAddBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  customRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
  },
  customAddBtn: {
    flexShrink: 0,
  },
  logList: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});
