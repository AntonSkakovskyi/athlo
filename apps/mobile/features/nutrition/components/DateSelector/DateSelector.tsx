import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing } from '@/constants/theme';

interface DateSelectorProps {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  isToday: boolean;
}

export function DateSelector({ date, onPrev, onNext, isToday }: DateSelectorProps) {
  const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={onPrev} hitSlop={12} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{isToday ? 'Today' : formatted}</Text>
        {!isToday && <Text style={styles.dateSubtext}>{formatted}</Text>}
      </View>
      <Pressable onPress={onNext} hitSlop={12} style={[styles.arrow, isToday && styles.arrowDisabled]} disabled={isToday}>
        <Text style={[styles.arrowText, isToday && styles.arrowTextDisabled]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  arrowTextDisabled: {
    color: colors.textMuted,
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dateSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
