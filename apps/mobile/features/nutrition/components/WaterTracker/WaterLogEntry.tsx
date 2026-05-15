import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IWaterLog } from '@athlo/shared';
import { colors, spacing, fontSize } from '@/constants/theme';

interface WaterLogEntryProps {
  log: IWaterLog;
  onDelete: (id: number) => void;
}

export function WaterLogEntry({ log, onDelete }: WaterLogEntryProps) {
  return (
    <View style={styles.logRow}>
      <Text style={styles.logAmount}>{log.amountMl} ml</Text>
      <Text style={styles.logTime}>
        {new Date(log.consumedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
      <Pressable onPress={() => onDelete(log.id)} hitSlop={8}>
        <Text style={styles.logDelete}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  logAmount: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  logTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  logDelete: {
    fontSize: fontSize.md,
    color: colors.danger,
    padding: spacing.xs,
  },
});
