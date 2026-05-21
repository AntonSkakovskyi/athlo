import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface LoadingScreenProps {
  paddingTop?: number;
}

export function LoadingScreen({ paddingTop }: LoadingScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, paddingTop != null && { paddingTop }]}>
      <Spinner size="large" />
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },
  });
}
