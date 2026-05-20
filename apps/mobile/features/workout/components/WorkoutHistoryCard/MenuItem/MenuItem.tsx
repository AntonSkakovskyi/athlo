import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, fontWeight } from '@/constants/theme';

interface MenuItemProps {
  icon: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
}

export function MenuItem({ icon, label, danger, onPress }: MenuItemProps) {
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

const styles = StyleSheet.create({
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
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  menuItemDanger: {
    color: colors.danger,
  },
});
