export type ThemePreference = 'light' | 'dark' | 'system';

export const darkColors = {
  primary: '#2BDE6A',
  primaryDark: '#24B857',
  primaryLight: '#2BDE6A33',

  background: '#0A0906',
  surface: '#1A1A17',
  surfaceLight: '#2A2A26',
  surfaceElevated: '#333330',

  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  danger: '#FF4444',
  dangerLight: '#FF444433',
  warning: '#FFB020',
  success: '#2BDE6A',
  info: '#4DA6FF',

  border: '#2A2A26',
  borderLight: '#333330',

  overlay: 'rgba(0, 0, 0, 0.6)',

  gold: '#FFD700',

  black: '#000000',
  white: '#FFFFFF',
  link: '#007AFF',
} as const;

export const lightColors = {
  primary: '#2BDE6A',
  primaryDark: '#24B857',
  primaryLight: '#2BDE6A33',

  background: '#F8F6F2',
  surface: '#FFFFFF',
  surfaceLight: '#F0EDE8',
  surfaceElevated: '#E8E5DF',

  text: '#1A1A17',
  textSecondary: '#5A5A55',
  textMuted: '#8A8A84',

  danger: '#FF4444',
  dangerLight: '#FF444420',
  warning: '#FFB020',
  success: '#2BDE6A',
  info: '#4DA6FF',

  border: '#E0DDD7',
  borderLight: '#EAE7E1',

  overlay: 'rgba(0, 0, 0, 0.4)',

  gold: '#D4A017',

  black: '#000000',
  white: '#FFFFFF',
  link: '#007AFF',
} as const;

export type ColorPalette = typeof darkColors;
