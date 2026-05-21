import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

type BadgeVariant = 'default' | 'accent' | 'success' | 'danger' | 'gold';

interface BadgeProps {
  label: string | number;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

function makeBadgeColors(c: ColorPalette): Record<BadgeVariant, { bg: string; text: string }> {
  return {
    default: { bg: c.surfaceLight, text: c.textSecondary },
    accent: { bg: c.primary + '20', text: c.primary },
    success: { bg: c.primaryLight, text: c.success },
    danger: { bg: c.dangerLight, text: c.danger },
    gold: { bg: c.gold + '20', text: c.gold },
  };
}

export function Badge({ label, variant = 'default', size = 'md', style }: BadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const variantColors = makeBadgeColors(colors)[variant];

  return (
    <View style={[styles.badge, size === 'sm' && styles.badgeSm, { backgroundColor: variantColors.bg }, style]}>
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: variantColors.text }]}>{label}</Text>
    </View>
  );
}

function makeStyles(_c: ColorPalette) {
  return StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start',
    },
    badgeSm: {
      paddingHorizontal: spacing.xs,
    },
    label: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
    labelSm: {
      fontSize: 11,
    },
  });
}
