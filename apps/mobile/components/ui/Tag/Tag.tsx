import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';

type TagColor = 'default' | 'primary' | 'success' | 'danger';

interface TagProps {
  label: string;
  color?: TagColor;
}

const TAG_COLORS: Record<TagColor, { bg: string; text: string }> = {
  default: { bg: colors.surfaceLight, text: colors.textSecondary },
  primary: { bg: colors.primaryLight, text: colors.primary },
  success: { bg: colors.primaryLight, text: colors.success },
  danger: { bg: colors.dangerLight, text: colors.danger },
};

export function Tag({ label, color = 'default' }: TagProps) {
  const tagColor = TAG_COLORS[color];
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
