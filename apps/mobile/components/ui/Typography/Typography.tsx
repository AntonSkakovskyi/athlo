import { Text, StyleSheet } from 'react-native';
import type { TextProps } from 'react-native';
import { colors, fontSize, fontWeight } from '@/constants/theme';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'label';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function Typography({ variant = 'body', color, align, style, ...rest }: TypographyProps) {
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

const styles = StyleSheet.create({
  h1: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.text },
  h2: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text },
  h3: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.text },
  h4: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  body: { fontSize: fontSize.md, fontWeight: fontWeight.regular, color: colors.text },
  bodySmall: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, color: colors.textSecondary },
  caption: { fontSize: fontSize.xs, fontWeight: fontWeight.regular, color: colors.textMuted },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary },
});
