import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';

interface StatBadgeProps {
  icon: string;
  label: string;
}

export function StatBadge({ icon, label }: StatBadgeProps) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
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
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
