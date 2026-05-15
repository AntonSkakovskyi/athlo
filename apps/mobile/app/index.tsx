import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { StyleSheet, View } from 'react-native';
import { Spinner } from '@/components/ui/Spinner/Spinner';

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(app)/(workout)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
