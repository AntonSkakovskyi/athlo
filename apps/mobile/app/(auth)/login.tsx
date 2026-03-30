import { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLogin } from '../../hooks/api/useAuthMutations';
import { AxiosError } from 'axios';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const { setSession } = useAuth();
  const loginMutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const { user, token } = await loginMutation.mutateAsync({ email, password });
      await setSession(user, token);
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message ?? 'Login failed'
        : 'Login failed';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title="Login"
        onPress={handleLogin}
        isLoading={loginMutation.isPending}
      />

      <Link href="/(auth)/register" style={styles.link}>
        Don't have an account? Register
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  link: { marginTop: 16, textAlign: 'center', color: '#007AFF' },
});
