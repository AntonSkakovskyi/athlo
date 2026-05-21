import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface StatBadgeProps {
  icon: string;
  label: string;
}

export function StatBadge({ icon, label }: StatBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.statBadge}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    statBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      gap: spacing.xs,
    },
    statIcon: {
      fontSize: 11,
    },
    statLabel: {
      fontSize: fontSize.xs,
      color: c.textSecondary,
      fontWeight: fontWeight.medium,
    },
  });
}
