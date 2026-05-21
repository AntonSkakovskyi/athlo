import { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface MenuItemProps {
  icon: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
}

export function MenuItem({ icon, label, danger, onPress }: MenuItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Text style={styles.menuItemIcon}>{icon}</Text>
      <Text style={[styles.menuItemLabel, danger && styles.menuItemDanger]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      gap: 14,
    },
    menuItemPressed: {
      opacity: 0.6,
    },
    menuItemIcon: {
      fontSize: fontSize.xl,
      width: 24,
      textAlign: 'center',
    },
    menuItemLabel: {
      fontSize: fontSize.md,
      color: c.text,
      fontWeight: fontWeight.medium,
    },
    menuItemDanger: {
      color: c.danger,
    },
  });
}
