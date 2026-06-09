import { useMemo } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Spinner } from '@/components/ui/Spinner/Spinner';

interface MenuItemProps {
  icon: string;
  label: string;
  danger?: boolean;
  loading?: boolean;
  onPress: () => void;
}

export function MenuItem({ icon, label, danger, loading, onPress }: MenuItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && !loading && styles.menuItemPressed]}
      onPress={loading ? undefined : onPress}
      disabled={loading}
    >
      <View style={styles.iconContainer}>
        {loading ? (
          <Spinner size="small" />
        ) : (
          <Text style={styles.menuItemIcon}>{icon}</Text>
        )}
      </View>
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
    iconContainer: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuItemIcon: {
      fontSize: fontSize.xl,
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
