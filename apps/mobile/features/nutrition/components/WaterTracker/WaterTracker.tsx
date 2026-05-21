import { View, Text, StyleSheet } from 'react-native';
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import type { IWaterLog } from '@athlo/shared';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { ProgressBar } from '@/components/ui';
import { WaterLogEntry } from './WaterLogEntry';
import { WaterQuickAdd } from './WaterQuickAdd/WaterQuickAdd';
import { WaterFormSection } from './WaterFormSection/WaterFormSection';

interface WaterTrackerProps {
  waterLogs: IWaterLog[];
  totalWaterMl: number;
  date: string;
  waterGoal?: number;
  onAddWater: (ml: number, consumedAt?: string) => void;
  onUpdateWater: (id: number, amountMl: number, consumedAt?: string) => void;
  onDeleteWater: (id: number) => void;
}

function buildConsumedAt(date: string, hour?: string, minute?: string): string {
  const base = new Date(date + 'T00:00:00');
  const now = new Date();
  const h = hour !== undefined ? parseInt(hour, 10) : now.getHours();
  const m = minute !== undefined ? parseInt(minute, 10) : now.getMinutes();
  base.setHours(isNaN(h) || h > 23 ? now.getHours() : h, isNaN(m) || m > 59 ? now.getMinutes() : m, 0, 0);
  return base.toISOString();
}

export function WaterTracker({
  waterLogs,
  totalWaterMl,
  date,
  waterGoal = 2500,
  onAddWater,
  onUpdateWater,
  onDeleteWater,
}: WaterTrackerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  // Time Picker State
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timeModified, setTimeModified] = useState(false);
  const [selectedSeconds, setSelectedSeconds] = useState(() => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60;
  });

  const hasGoal = Boolean(waterGoal && waterGoal > 0);
  const percent = hasGoal ? Math.min((totalWaterMl / waterGoal!) * 100, 100) : 0;

  const handleCustomAdd = () => {
    if (!hasGoal) return;
    const ml = parseInt(customAmount, 10);
    if (ml > 0) {
      let isoTime: string | undefined;
      
      if (timeModified) {
        const h = Math.floor(selectedSeconds / 3600);
        const m = Math.floor((selectedSeconds % 3600) / 60);
        isoTime = buildConsumedAt(date, String(h), String(m));
      } else if (!editingLogId) {
        isoTime = buildConsumedAt(date);
      }

      if (editingLogId !== null) {
        onUpdateWater(editingLogId, ml, isoTime);
      } else {
        onAddWater(ml, isoTime);
      }
      
      resetForm();
    }
  };

  const resetForm = () => {
    setCustomAmount('');
    setEditingLogId(null);
    setShowCustom(false);
    setTimeModified(false);
    const now = new Date();
    setSelectedSeconds(now.getHours() * 3600 + now.getMinutes() * 60);
  };

  const handleEditPress = (log: IWaterLog) => {
    if (!hasGoal) return;
    setEditingLogId(log.id);
    setCustomAmount(String(log.amountMl));
    const d = new Date(log.consumedAt);
    setSelectedSeconds(d.getHours() * 3600 + d.getMinutes() * 60);
    setTimeModified(true);
    setShowCustom(true);
  };

  const handleQuickAdd = (ml: number) => {
    if (!hasGoal) return;
    setCustomAmount(String(ml));
    setEditingLogId(null);
    setTimeModified(false);
    const now = new Date();
    setSelectedSeconds(now.getHours() * 3600 + now.getMinutes() * 60);
    setShowCustom(true);
  };

  const formatTimeLabel = (seconds: number) => {
    if (!timeModified && !editingLogId) return 'Now';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleTimeChange = (seconds: number) => {
    setSelectedSeconds(seconds);
    setTimeModified(true);
  };

  const handleDelete = () => {
    if (editingLogId !== null) {
      onDeleteWater(editingLogId);
      resetForm();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💧 Water</Text>
        <Text style={styles.summary}>
          {totalWaterMl} / {hasGoal ? waterGoal : '?'} ml
        </Text>
      </View>

      <View style={styles.progressBarWrapper}>
        <ProgressBar progress={percent} color={colors.info} height={8} />
      </View>

      {!hasGoal ? (
        <View style={styles.noGoalContainer}>
          <Text style={styles.noGoalText}>Please set your water goal or update your body weight in settings to start tracking water.</Text>
          <Button
            title="Update Metrics"
            onPress={() => router.push('/(app)/(profile)/statistics?tab=body_metrics')}
            style={styles.updateMetricsBtn}
          />
        </View>
      ) : (
        <>
          <WaterQuickAdd
            showCustom={showCustom}
            onQuickAdd={handleQuickAdd}
            onToggleCustom={() => (showCustom ? resetForm() : setShowCustom(true))}
          />

          {showCustom && (
            <WaterFormSection
              customAmount={customAmount}
              setCustomAmount={setCustomAmount}
              editingLogId={editingLogId}
              timeLabel={formatTimeLabel(selectedSeconds)}
              timePickerVisible={timePickerVisible}
              setTimePickerVisible={setTimePickerVisible}
              onTimeChange={handleTimeChange}
              selectedSeconds={selectedSeconds}
              onAdd={handleCustomAdd}
              onDelete={handleDelete}
              onCancel={resetForm}
            />
          )}
        </>
      )}

      {/* Water Log List */}
      {waterLogs.length > 0 && (
        <View style={styles.logList}>
          {waterLogs.map((log) => (
            <WaterLogEntry
              key={log.id}
              log={log}
              onEdit={() => handleEditPress(log)}
              onDelete={onDeleteWater}
              isEditing={editingLogId === log.id}
            />
          ))}
        </View>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    summary: {
      fontSize: fontSize.md,
      color: c.textSecondary,
      fontWeight: fontWeight.medium,
    },
    progressBarWrapper: {
      marginBottom: spacing.lg,
    },
    logList: {
      marginTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: spacing.md,
    },
    noGoalContainer: {
      padding: spacing.md,
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    noGoalText: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
    },
    updateMetricsBtn: {
      marginTop: spacing.md,
    },
  });
}
