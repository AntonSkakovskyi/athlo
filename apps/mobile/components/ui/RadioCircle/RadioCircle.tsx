import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

interface RadioCircleProps {
  selected: boolean;
  size?: number;
}

export function RadioCircle({ selected, size = 22 }: RadioCircleProps) {
  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }, selected && styles.outerSelected]}>
      {selected && (
        <View style={[styles.inner, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerSelected: {
    borderColor: colors.primary,
  },
  inner: {
    backgroundColor: colors.primary,
  },
});
