import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { ColorPalette } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

export interface SettingsRowProps {
  label: string;
  value?: string;
  variant?: 'default' | 'danger';
  onPress?: () => void;
}

export function SettingsRow({ label, value, variant = 'default', onPress }: SettingsRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    settingsLabel: {
      fontSize: fontSize.lg,
      color: c.text,
    },
    settingsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    settingsValue: {
      fontSize: fontSize.md,
      color: c.textSecondary,
    },
    chevron: {
      fontSize: fontSize.xl,
      color: c.textMuted,
      fontWeight: fontWeight.light,
    },
    dangerText: {
      color: c.danger,
    },
  });
}
