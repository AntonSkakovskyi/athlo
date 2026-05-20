import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { BottomSheet, TimePicker } from '@/components/ui';

interface TimePickerSectionProps {
  hasTime: boolean;
  selectedSeconds: number;
  timePickerVisible: boolean;
  onAddTime: () => void;
  onClearTime: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onTimeChange: (seconds: number) => void;
}

export function TimePickerSection({
  hasTime,
  selectedSeconds,
  timePickerVisible,
  onAddTime,
  onClearTime,
  onOpenPicker,
  onClosePicker,
  onTimeChange,
}: TimePickerSectionProps) {
  const formatTimeLabel = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return (
    <>
      <View style={styles.timeControls}>
        {hasTime ? (
          <View style={styles.timePickerContainer}>
            <Pressable style={styles.timePickerTrigger} onPress={onOpenPicker}>
              <Text style={styles.timePickerText}>{formatTimeLabel(selectedSeconds)}</Text>
            </Pressable>
            <Pressable hitSlop={12} onPress={onClearTime} style={styles.clearTimeBtn}>
              <Text style={styles.clearTimeText}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addTimeBtn} onPress={onAddTime}>
            <Text style={styles.addTimeText}>+ Time</Text>
          </Pressable>
        )}
      </View>

      <BottomSheet
        visible={timePickerVisible}
        onClose={onClosePicker}
        title="Select Meal Time"
        scrollable={false}
      >
        <TimePicker
          value={selectedSeconds}
          onChange={onTimeChange}
          hideSeconds={true}
        />
        <Button
          title="Done"
          onPress={onClosePicker}
          style={styles.doneBtn}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: spacing.xs,
  },
  timePickerTrigger: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  timePickerText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  clearTimeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xxs,
  },
  clearTimeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.bold,
  },
  addTimeBtn: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addTimeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  doneBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
