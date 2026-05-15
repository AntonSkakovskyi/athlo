import { View, StyleSheet } from 'react-native';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { colors } from '@/constants/theme';

interface LoadingScreenProps {
  paddingTop?: number;
}

export function LoadingScreen({ paddingTop }: LoadingScreenProps) {
  return (
    <View style={[styles.container, paddingTop != null && { paddingTop }]}>
      <Spinner size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
