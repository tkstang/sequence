import { palette } from '@sequence/design-tokens';
import { createContext, useContext } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeScheme = 'light' | 'dark';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  scheme: ThemeScheme;
  colors: (typeof palette)[ThemeScheme];
}

export const THEME_STORAGE_KEY = 'sequence-theme';

export const fallbackTheme: ThemeContextValue = {
  mode: 'system',
  setMode: () => {},
  scheme: 'light',
  colors: palette.light,
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? fallbackTheme;
}
