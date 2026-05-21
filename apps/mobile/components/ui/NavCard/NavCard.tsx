import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface NavCardProps {
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'compact';
}

export function NavCard({ icon, title, description, onPress, variant = 'default' }: NavCardProps) {
  const { colors } = useTheme();
  const { styles, compactStyles } = useMemo(() => makeStyles(colors), [colors]);

  if (variant === 'compact') {
    return (
      <Pressable style={compactStyles.card} onPress={onPress}>
        <Text style={compactStyles.icon}>{icon}</Text>
        <Text style={compactStyles.title}>{title}</Text>
        {description && <Text style={compactStyles.description}>{description}</Text>}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  const compactStyles = StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
    },
    icon: {
      fontSize: 28,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
    },
    description: {
      fontSize: 11,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.xxs,
    },
  });

  const styles = StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.sm,
    },
    icon: {
      fontSize: 24,
      marginRight: 14,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    description: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: spacing.xxs,
    },
    chevron: {
      fontSize: 22,
      color: c.textMuted,
      fontWeight: '300',
    },
  });

  return { styles, compactStyles };
}
