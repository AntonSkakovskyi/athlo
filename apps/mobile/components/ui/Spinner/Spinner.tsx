import { ActivityIndicator } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Spinner({ size = 'large', color = colors.primary, style }: SpinnerProps) {
  return <ActivityIndicator size={size} color={color} style={style} />;
}
