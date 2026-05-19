import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/constants/theme';

interface PeriodSelectorProps {
  period: string;
  periods: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (period: string) => void;
}

export function PeriodSelector({
  period,
  periods,
  open,
  onToggle,
  onSelect,
}: PeriodSelectorProps) {
  return (
    <View>
      <Pressable style={styles.periodDropdown} onPress={onToggle}>
        <Text style={styles.periodText}>{period} ▼</Text>
      </Pressable>
      {open && (
        <View style={styles.periodMenu}>
          {periods.map((p) => (
            <Pressable
              key={p}
              style={[styles.periodItem, p === period && styles.periodItemActive]}
              onPress={() => onSelect(p)}
            >
              <Text
                style={[
                  styles.periodItemText,
                  p === period && styles.periodItemTextActive,
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  periodDropdown: {
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  periodText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  periodMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
    minWidth: 120,
  },
  periodItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  periodItemActive: {
    backgroundColor: colors.primaryLight,
  },
  periodItemText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  periodItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
