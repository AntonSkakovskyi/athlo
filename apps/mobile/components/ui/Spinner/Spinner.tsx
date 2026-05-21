import { ActivityIndicator } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Spinner({ size = 'large', color, style }: SpinnerProps) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={color ?? colors.primary} style={style} />;
}
