const palette = {
  // Slate
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  // Indigo
  indigo50: '#ede9fe',
  indigo200: '#c7d2fe',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  // Red
  red300: '#fca5a5',
  red500: '#ef4444',
  red900: '#7f1d1d',
  // Macro
  emerald300: '#6ee7b7',
  blue300: '#93c5fd',
  // Other
  white: '#ffffff',
  teal600: '#0a7ea4',
} as const;

export const Colors = {
  // Backgrounds
  background: palette.slate50,
  surface: palette.white,
  surfaceSubtle: palette.slate100,

  // Text
  textPrimary: palette.slate900,
  textSecondary: palette.slate500,
  textMuted: palette.slate400,
  textLabel: palette.slate600,
  textStrong: palette.slate700,
  textInverse: palette.slate800,
  textLink: palette.teal600,

  // Brand
  brand: palette.indigo600,
  brandSecondary: palette.indigo500,
  brandDisabled: palette.indigo200,
  brandSubtle: palette.indigo50,
  brandPillText: palette.indigo700,

  // Borders
  border: palette.slate200,

  // Danger
  danger: palette.red500,
  dangerLight: palette.red300,
  dangerDark: palette.red900,

  // Macro ring & stats
  macroProtein: palette.emerald300,
  macroCarbs: palette.blue300,
  macroFat: palette.red300,

  // Toast variants
  toastSuccess: palette.indigo600,
  toastError: palette.red500,
  toastInfo: palette.slate800,
} as const;

export type ColorKey = keyof typeof Colors;
