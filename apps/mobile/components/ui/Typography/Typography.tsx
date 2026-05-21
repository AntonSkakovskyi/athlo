import { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import type { TextProps } from 'react-native';
import { fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'label';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function Typography({ variant = 'body', color, align, style, ...rest }: TypographyProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Text
      style={[
        styles[variant],
        color ? { color } : undefined,
        align ? { textAlign: align } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    h1: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: c.text },
    h2: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: c.text },
    h3: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: c.text },
    h4: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: c.text },
    body: { fontSize: fontSize.md, fontWeight: fontWeight.regular, color: c.text },
    bodySmall: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, color: c.textSecondary },
    caption: { fontSize: fontSize.xs, fontWeight: fontWeight.regular, color: c.textMuted },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.textSecondary },
  });
}
