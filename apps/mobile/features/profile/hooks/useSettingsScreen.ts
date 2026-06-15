import { useCallback } from 'react';
import { Alert } from 'react-native';
import { confirmDestructive } from '@/utils/alerts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from '@/hooks/useRouter';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemePreference } from '@/constants/colors';
import { useDeleteAccount } from '@/hooks/api/useUserAPI';

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function useSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { themePreference, setTheme } = useTheme();
  const deleteAccountMutation = useDeleteAccount();

  const handleLogout = useCallback(() => {
    confirmDestructive('Log Out', 'Are you sure you want to log out?', logout, 'Log Out');
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    confirmDestructive(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      async () => {
        try {
          await deleteAccountMutation.mutateAsync();
          await logout();
        } catch (error) {
          console.error('Failed to delete account:', error);
          Alert.alert('Error', 'Failed to delete account. Please try again later.');
        }
      },
      'Delete Account',
    );
  }, [deleteAccountMutation, logout]);

  const handleThemePicker = useCallback(() => {
    Alert.alert('Theme', 'Choose your preferred theme', [
      { text: 'Light',  onPress: () => setTheme('light') },
      { text: 'Dark',   onPress: () => setTheme('dark') },
      { text: 'System', onPress: () => setTheme('system') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [setTheme]);

  return {
    insets,
    router,
    logout,
    handleLogout,
    handleDeleteAccount,
    themeLabel: THEME_LABELS[themePreference],
    handleThemePicker,
  };
}
