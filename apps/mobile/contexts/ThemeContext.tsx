import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ColorPalette, darkColors, lightColors, ThemePreference } from '@/constants/colors';
import { themeService } from '@/features/profile/services/themeService';

interface ThemeContextType {
  colors: ColorPalette;
  themePreference: ThemePreference;
  resolvedScheme: 'light' | 'dark';
  setTheme: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme() ?? 'dark';
  const [themePreference, setThemePreference] = useState<ThemePreference>('dark');

  useEffect(() => {
    themeService.getPreference().then(saved => {
      if (saved) setThemePreference(saved);
    });
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    themePreference === 'system' ? deviceScheme : themePreference;

  const colors: ColorPalette = resolvedScheme === 'light' ? lightColors : darkColors;

  const setTheme = useCallback(async (pref: ThemePreference) => {
    setThemePreference(pref);
    await themeService.savePreference(pref);
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, themePreference, resolvedScheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
