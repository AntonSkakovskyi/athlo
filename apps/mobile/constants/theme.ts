export const colors = {
  // Brand
  primary: '#2BDE6A',
  primaryDark: '#24B857',
  primaryLight: '#2BDE6A33',

  // Background
  background: '#0A0906',
  surface: '#1A1A17',
  surfaceLight: '#2A2A26',
  surfaceElevated: '#333330',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  // Semantic
  danger: '#FF4444',
  dangerLight: '#FF444433',
  warning: '#FFB020',
  success: '#2BDE6A',
  info: '#4DA6FF',

  // Border
  border: '#2A2A26',
  borderLight: '#333330',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
