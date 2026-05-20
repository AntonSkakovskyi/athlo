import { useCallback } from 'react';
import { confirmDestructive } from '@/utils/alerts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export function useSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = useCallback(() => {
    confirmDestructive('Log Out', 'Are you sure you want to log out?', logout, 'Log Out');
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    confirmDestructive('Delete Account', 'This action cannot be undone. All your data will be permanently deleted.', () => {});
  }, []);

  return {
    insets,
    router,
    logout,
    handleLogout,
    handleDeleteAccount,
  };
}
