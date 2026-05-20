import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { BottomSheet, TimePicker } from '@/components/ui';

const noMargin = { marginBottom: 0 };

interface WaterFormSectionProps {
  customAmount: string;
  setCustomAmount: (v: string) => void;
  editingLogId: number | null;
  timeLabel: string;
  timePickerVisible: boolean;
  setTimePickerVisible: (v: boolean) => void;
  onTimeChange: (seconds: number) => void;
  selectedSeconds: number;
  onAdd: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function WaterFormSection({
  customAmount,
  setCustomAmount,
  editingLogId,
  timeLabel,
  timePickerVisible,
  setTimePickerVisible,
  onTimeChange,
  selectedSeconds,
  onAdd,
  onDelete,
  onCancel,
}: WaterFormSectionProps) {
  return (
    <>
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
            <Text style={styles.timePickerText}>{timeLabel}</Text>
            <Text style={styles.timeIcon}>⏱️</Text>
          </Pressable>

          <Button
            title={editingLogId !== null ? 'Save' : 'Add'}
            variant="primary"
            onPress={onAdd}
            style={styles.customAddBtn}
          />
        </View>
      </View>

      <BottomSheet
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        title="Select Time"
        scrollable={false}
      >
        <TimePicker
          value={selectedSeconds}
          onChange={onTimeChange}
          hideSeconds={true}
        />
        <Button
          title="Done"
          onPress={() => setTimePickerVisible(false)}
          style={styles.doneBtn}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
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
  customAddBtn: {
    flexShrink: 0,
  },
  doneBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
