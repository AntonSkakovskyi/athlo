import { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 36, md: 56, lg: 80 };
const FONT_SIZES = { sm: 14, md: 20, lg: 28 };

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, uri, size = 'md' }: AvatarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dimension = SIZES[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}>
      <Text style={[styles.initials, { fontSize: FONT_SIZES[size] }]}>{getInitials(name)}</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    image: {
      resizeMode: 'cover',
    },
    fallback: {
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      color: c.primary,
      fontWeight: '700',
    },
  });
}
