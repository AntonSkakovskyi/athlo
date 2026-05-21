import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { spacing, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title}>{title}</Text>
      {rightAction ? rightAction : <View style={styles.placeholder} />}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    backBtn: {
      paddingVertical: spacing.sm,
      minWidth: 60,
    },
    backText: {
      fontSize: 15,
      color: c.primary,
      fontWeight: '600',
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: c.text,
    },
    placeholder: {
      minWidth: 60,
    },
  });
}
