import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

interface LoadingScreenProps {
  paddingTop?: number;
}

export function LoadingScreen({ paddingTop }: LoadingScreenProps) {
  return (
    <View style={[styles.container, paddingTop != null && { paddingTop }]}>
      <ActivityIndicator size="large" color={colors.primary} />
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
