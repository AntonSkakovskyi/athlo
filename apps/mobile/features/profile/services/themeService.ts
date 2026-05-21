import * as SecureStore from 'expo-secure-store';
import { ThemePreference } from '@/constants/colors';

const THEME_KEY = 'athlo_theme_preference';

export const themeService = {
  async getPreference(): Promise<ThemePreference | null> {
    const value = await SecureStore.getItemAsync(THEME_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
    return null;
  },

  async savePreference(pref: ThemePreference): Promise<void> {
    await SecureStore.setItemAsync(THEME_KEY, pref);
  },
};
