import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

type TagColor = 'default' | 'primary' | 'success' | 'danger';

interface TagProps {
  label: string;
  color?: TagColor;
}

function makeTagColors(c: ColorPalette): Record<TagColor, { bg: string; text: string }> {
  return {
    default: { bg: c.surfaceLight, text: c.textSecondary },
    primary: { bg: c.primaryLight, text: c.primary },
    success: { bg: c.primaryLight, text: c.success },
    danger: { bg: c.dangerLight, text: c.danger },
  };
}

export function Tag({ label, color = 'default' }: TagProps) {
  const { colors } = useTheme();
  const tagColor = makeTagColors(colors)[color];
  return (
    <View style={[styles.tag, { backgroundColor: tagColor.bg }]}>
      <Text style={[styles.label, { color: tagColor.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
