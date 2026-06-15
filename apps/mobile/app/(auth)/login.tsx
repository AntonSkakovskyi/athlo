import { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useRouter } from '@/hooks/useRouter';
import { useAuth } from '../../contexts/AuthContext';
import { useLogin } from '@/features/auth/hooks';
import { AxiosError } from 'axios';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { spacing, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useMemo } from 'react';
import { validateFieldsMap, required, minLength, isEmail } from '@/utils/validation';

function extractErrorMessages(error: unknown): string[] {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg as string[];
    if (typeof msg === 'string') return [msg];
  }
  return ['Login failed'];
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { setSession } = useAuth();
  const loginMutation = useLogin();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLogin = async () => {
    setErrors([]);
    setFieldErrors({});

    const validation = validateFieldsMap([
      { key: 'email', value: email, rules: [required('Email'), isEmail()] },
      { key: 'password', value: password, rules: [required('Password'), minLength('Password', 6)] },
    ]);
    if (validation) { setFieldErrors(validation); return; }

    try {
      const { user, token } = await loginMutation.mutateAsync({ email, password });
      await setSession(user, token);
      router.replace('/(app)/(workout)');
    } catch (error) {
      setErrors(extractErrorMessages(error));
    }
  };

  const emailError = fieldErrors.email || errors.find((e) => e.toLowerCase().includes('email'));
  const passwordError = fieldErrors.password || errors.find((e) => e.toLowerCase().includes('password'));
  const generalError = !emailError && !passwordError && errors[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../../assets/icon-with-text.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Welcome back</Text>

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
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
    logo: { width: 200, height: 160, alignSelf: 'center', marginBottom: spacing.md },
    subtitle: { fontSize: fontSize.lg, color: c.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    link: { marginTop: spacing.lg, textAlign: 'center', color: c.link },
    generalError: { fontSize: fontSize.sm, color: c.danger, marginBottom: spacing.md, textAlign: 'center' },
  });
}
