import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { router, useRouter } from 'expo-router';
import type { IWaterLog } from '@athlo/shared';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { BottomSheet, TimePicker } from '@/components/ui';
import { WaterLogEntry } from './WaterLogEntry';

interface WaterTrackerProps {
  waterLogs: IWaterLog[];
  totalWaterMl: number;
  date: string;
  waterGoal?: number;
  onAddWater: (ml: number, consumedAt?: string) => void;
  onUpdateWater: (id: number, amountMl: number, consumedAt?: string) => void;
  onDeleteWater: (id: number) => void;
}

const QUICK_ADD_OPTIONS = [150, 250, 500];

function buildConsumedAt(date: string, hour?: string, minute?: string): string {
  const base = new Date(date + 'T00:00:00');
  const now = new Date();
  const h = hour !== undefined ? parseInt(hour, 10) : now.getHours();
  const m = minute !== undefined ? parseInt(minute, 10) : now.getMinutes();
  base.setHours(isNaN(h) || h > 23 ? now.getHours() : h, isNaN(m) || m > 59 ? now.getMinutes() : m, 0, 0);
  return base.toISOString();
}

const noMargin = { marginBottom: 0 };

export function WaterTracker({
  waterLogs,
  totalWaterMl,
  date,
  waterGoal = 2500,
  onAddWater,
  onUpdateWater,
  onDeleteWater,
}: WaterTrackerProps) {
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

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
      </View>

      {!hasGoal ? (
        <View style={styles.noGoalContainer}>
          <Text style={styles.noGoalText}>Please set your water goal or update your body weight in settings to start tracking water.</Text>
          <Button 
            title="Update Metrics" 
            onPress={() => router.push('/(app)/(profile)/statistics?tab=body_metrics')}
            style={{ marginTop: spacing.md }}
          />
        </View>
      ) : (
        <>
          {/* Quick Add Buttons */}
          <View style={styles.quickAddRow}>
            {QUICK_ADD_OPTIONS.map((ml) => (
              <Button
                key={ml}
                title={`+${ml} ml`}
                variant="secondary"
                onPress={() => handleQuickAdd(ml)}
                style={styles.quickAddBtn}
              />
            ))}
            <Button
              title={showCustom ? "Close" : "Custom"}
              variant="ghost"
              onPress={() => showCustom ? resetForm() : setShowCustom(true)}
              style={styles.quickAddBtn}
            />
          </View>

          {/* Custom Input */}
          {showCustom && (
            <View style={styles.customSection}>
              <View style={styles.customRow}>
                <Input
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="number-pad"
                  placeholder="ml"
                  containerStyle={[styles.customInputContainer, noMargin]}
                  style={styles.customInputText}
                  autoFocus={!customAmount}
                />
                
                <Pressable 
                  onPress={() => setTimePickerVisible(true)} 
                  style={styles.timePickerTrigger}
                >
                  <Text style={styles.timePickerText}>{formatTimeLabel(selectedSeconds)}</Text>
                  <Text style={styles.timeIcon}>⏱️</Text>
                </Pressable>

                <Button
                  title={editingLogId !== null ? "Save" : "Add"}
                  variant="primary"
                  onPress={handleCustomAdd}
                  style={styles.customAddBtn}
                />
              </View>
            </View>
          )}

          <BottomSheet
            visible={timePickerVisible}
            onClose={() => setTimePickerVisible(false)}
            title="Select Time"
            scrollable={false}
          >
            <TimePicker 
              value={selectedSeconds} 
              onChange={handleTimeChange}
              hideSeconds={true}
            />
            <Button 
              title="Done" 
              onPress={() => setTimePickerVisible(false)} 
              style={styles.doneBtn}
            />
          </BottomSheet>
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
  customSection: {
    marginTop: spacing.md,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  customInputContainer: {
    flex: 1,
  },
  customInputText: {
    padding: spacing.sm,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePickerText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  timeIcon: {
    fontSize: fontSize.md,
  },
  customTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  customTimePartContainer: {
    width: 44,
  },
  timeSeparator: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  customAddBtn: {
    flexShrink: 0,
  },
  deleteBtn: {
    flexShrink: 0,
    paddingHorizontal: spacing.sm,
  },
  timeHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  logList: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  doneBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  noGoalContainer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  noGoalText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
