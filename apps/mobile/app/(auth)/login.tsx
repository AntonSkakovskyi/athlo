import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLogin } from '../../hooks/api/useAuthMutations';
import { AxiosError } from 'axios';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/theme';

function extractErrorMessages(error: unknown): string[] {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg as string[];
    if (typeof msg === 'string') return [msg];
  }
  return ['Login failed'];
}

export default function LoginScreen() {
  const { setSession } = useAuth();
  const loginMutation = useLogin();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleLogin = async () => {
    setErrors([]);
    try {
      const { user, token } = await loginMutation.mutateAsync({ email, password });
      await setSession(user, token);
      router.replace('/(app)/(workout)');
    } catch (error) {
      setErrors(extractErrorMessages(error));
    }
  };

  const emailError = errors.find((e) => e.toLowerCase().includes('email'));
  const passwordError = errors.find((e) => e.toLowerCase().includes('password'));
  const generalError = !emailError && !passwordError && errors[0];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}

      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={emailError}
      />

      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={passwordError}
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
  generalError: { fontSize: 13, color: colors.danger, marginBottom: 12, textAlign: 'center' },
});
