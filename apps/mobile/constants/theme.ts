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

  // Base palette
  black: '#000000',
  white: '#FFFFFF',
  link: '#007AFF',
} as const;

// Spacing scale (4pt base grid).
// Off-scale values: 2–3 → xxs, 5–6 → xs, 9–10 → sm, 14 → md, 18 → xl, 28–30 → 3xl, 60+ = screen-specific.
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// Border-radius scale.
// Off-scale values: 2–3 → xs, 5 → xs, 17 → lg, 24 → 2xl, 28–90 → full.
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// Font-size scale.
// Off-scale values: 10 → xs, 12 → sm, 14 → md, 16 → lg, 18 → xl, 22/26 → 2xl, 28 → 3xl.
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
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
} as const;
