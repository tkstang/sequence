'use client';

import * as stylex from '@stylexjs/stylex';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { darkTheme, lightTheme } from '@/styles/themes.stylex.ts';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'sequence-theme';

const lightClass = stylex.props(lightTheme).className ?? '';
const darkClass = stylex.props(darkTheme).className ?? '';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Resolved 'light' | 'dark' after applying system preference. */
  resolved: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function classList(value: string): string[] {
  return value.split(' ').filter(Boolean);
}

/**
 * Applies the user's explicit theme choice on top of the automatic
 * `prefers-color-scheme` tokens. "System" mode applies no override class, so the
 * base token media queries decide. Light/Dark pin the theme via a StyleX
 * `createTheme` class on `<html>`. The choice persists to localStorage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setModeState(stored);
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemDark(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove(...classList(lightClass), ...classList(darkClass));
    if (mode === 'light') {
      el.classList.add(...classList(lightClass));
    } else if (mode === 'dark') {
      el.classList.add(...classList(darkClass));
    }
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const resolved: 'light' | 'dark' =
    mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, resolved }),
    [mode, setMode, resolved],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Safe default when no provider is mounted (e.g. a header rendered in isolation
// in tests). The real app always wraps the tree in <ThemeProvider> via the root
// layout, so this only affects out-of-tree renders, where the toggle is inert.
const FALLBACK_THEME: ThemeContextValue = {
  mode: 'system',
  setMode: () => {},
  resolved: 'light',
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? FALLBACK_THEME;
}
