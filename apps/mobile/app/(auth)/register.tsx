import { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useRegister } from '@/features/auth/hooks';
import { AxiosError } from 'axios';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { spacing, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useMemo } from 'react';

function extractErrorMessages(error: unknown): string[] {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg as string[];
    if (typeof msg === 'string') return [msg];
  }
  return ['Registration failed'];
}

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../../assets/icon-with-text.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Create your account</Text>

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
