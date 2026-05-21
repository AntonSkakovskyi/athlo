import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    periodDropdown: {
      marginTop: spacing.sm,
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      backgroundColor: c.surfaceLight,
    },
    periodText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    periodMenu: {
      position: 'absolute',
      top: 52,
      right: 0,
      backgroundColor: c.surfaceElevated,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: c.border,
      zIndex: 10,
      minWidth: 120,
    },
    periodItem: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    periodItemActive: {
      backgroundColor: c.primaryLight,
    },
    periodItemText: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    periodItemTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
  });
}
