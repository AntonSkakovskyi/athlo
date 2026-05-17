import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IWaterLog } from '@athlo/shared';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface WaterLogEntryProps {
  log: IWaterLog;
  onEdit: () => void;
  onDelete: (id: number) => void;
  isEditing?: boolean;
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function WaterLogEntry({ log, onEdit, onDelete, isEditing }: WaterLogEntryProps) {
  return (
    <View style={[styles.logRow, isEditing && styles.editingRow]}>
      <Text style={styles.logAmount}>{log.amountMl} ml</Text>
      <Text style={styles.logTime}>{formatTime(log.consumedAt)}</Text>
      
      {!isEditing && (
        <>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.iconBtn}>
            <Text style={styles.editIcon}>✏️</Text>
          </Pressable>
          <Pressable onPress={() => onDelete(log.id)} hitSlop={8} style={styles.iconBtn}>
            <Text style={styles.deleteIcon}>✕</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  editingRow: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  logAmount: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  logTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  iconBtn: {
    padding: spacing.xs,
    minWidth: 28,
    alignItems: 'center',
  },
  editIcon: {
    fontSize: fontSize.sm,
  },
  deleteIcon: {
    fontSize: fontSize.md,
    color: colors.danger,
    fontWeight: fontWeight.bold,
  },
});
