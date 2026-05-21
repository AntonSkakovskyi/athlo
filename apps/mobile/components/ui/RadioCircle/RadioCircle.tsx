import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface RadioCircleProps {
  selected: boolean;
  size?: number;
}

export function RadioCircle({ selected, size = 22 }: RadioCircleProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }, selected && styles.outerSelected]}>
      {selected && (
        <View style={[styles.inner, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]} />
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    outer: {
      borderWidth: 2,
      borderColor: c.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outerSelected: {
      borderColor: c.primary,
    },
    inner: {
      backgroundColor: c.primary,
    },
  });
}
