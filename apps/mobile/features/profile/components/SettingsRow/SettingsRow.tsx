import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export interface SettingsRowProps {
  label: string;
  value?: string;
  variant?: 'default' | 'danger';
  onPress?: () => void;
}

export function SettingsRow({ label, value, variant = 'default', onPress }: SettingsRowProps) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <Text style={[styles.settingsLabel, variant === 'danger' && styles.dangerText]}>
        {label}
      </Text>
      {value ? (
        <View style={styles.settingsRight}>
          <Text style={styles.settingsValue}>{value}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      ) : (
        variant !== 'danger' && <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  settingsLabel: {
    fontSize: fontSize.lg,
    color: colors.text,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingsValue: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    fontWeight: fontWeight.light,
  },
  dangerText: {
    color: colors.danger,
  },
});
