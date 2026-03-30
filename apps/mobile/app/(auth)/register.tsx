import { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useRegister } from '../../hooks/api/useAuthMutations';
import { AxiosError } from 'axios';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function RegisterScreen() {
  const { setSession } = useAuth();
  const registerMutation = useRegister();
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const { user, token } = await registerMutation.mutateAsync({ email, password, fullName, nickname });
      await setSession(user, token);
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message ?? 'Registration failed'
        : 'Registration failed';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <Input
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />

      <Input
        placeholder="Nickname"
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize="none"
      />

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
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  link: { marginTop: 16, textAlign: 'center', color: '#007AFF' },
});
