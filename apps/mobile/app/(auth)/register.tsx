import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useRegister } from '@/features/auth/hooks';
import { AxiosError } from 'axios';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

function extractErrorMessages(error: unknown): string[] {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg as string[];
    if (typeof msg === 'string') return [msg];
  }
  return ['Registration failed'];
}

export default function RegisterScreen() {
  const { setSession } = useAuth();
  const router = useRouter();
  const registerMutation = useRegister();
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleRegister = async () => {
    setErrors([]);
    try {
      const { user, token } = await registerMutation.mutateAsync({ email, password, fullName, nickname });
      await setSession(user, token);
      router.replace('/(app)/(workout)');
    } catch (error) {
      setErrors(extractErrorMessages(error));
    }
  };

  const emailError = errors.find((e) => e.toLowerCase().includes('email'));
  const passwordError = errors.find((e) => e.toLowerCase().includes('password'));
  const nicknameError = errors.find((e) => e.toLowerCase().includes('nickname'));
  const nameError = errors.find((e) => e.toLowerCase().includes('name') && !e.toLowerCase().includes('nickname'));
  const generalErrors = errors.filter(
    (e) =>
      !e.toLowerCase().includes('email') &&
      !e.toLowerCase().includes('password') &&
      !e.toLowerCase().includes('nickname') &&
      !(e.toLowerCase().includes('name') && !e.toLowerCase().includes('nickname')),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {generalErrors.length > 0 && (
        <Text style={styles.generalError}>{generalErrors.join('. ')}</Text>
      )}

      <Input
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        error={nameError}
      />

      <Input
        placeholder="Nickname"
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize="none"
        error={nicknameError}
      />

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
        title="Register"
        onPress={handleRegister}
        isLoading={registerMutation.isPending}
      />

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Login
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, marginBottom: spacing.xl, textAlign: 'center' },
  link: { marginTop: spacing.lg, textAlign: 'center', color: colors.link },
  generalError: { fontSize: fontSize.sm, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
});
