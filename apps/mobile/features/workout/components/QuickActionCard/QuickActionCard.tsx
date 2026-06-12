import { useMemo } from 'react';
import { Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  isLoading?: boolean;
}

export function QuickActionCard({ icon, title, description, onPress, isLoading }: QuickActionCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable style={[styles.card, isLoading && styles.cardDisabled]} onPress={onPress} disabled={isLoading}>
      {isLoading
        ? <ActivityIndicator style={styles.icon} color={colors.primary} />
        : <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardDisabled: {
      opacity: 0.6,
    },
    icon: {
      fontSize: 28,
      marginBottom: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
    description: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
    },
  });
}
