import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette } from '@sequence/design-tokens';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Appearance } from 'react-native';
import type { ColorSchemeName } from 'react-native';

import {
  THEME_STORAGE_KEY,
  ThemeContext,
  type ThemeMode,
  type ThemeScheme,
} from './use-theme.ts';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function resolveSystemScheme(
  colorScheme: ColorSchemeName | null | undefined,
): ThemeScheme {
  return colorScheme === 'dark' ? 'dark' : 'light';
}

function resolveScheme(
  mode: ThemeMode,
  systemScheme: ThemeScheme,
): ThemeScheme {
  return mode === 'system' ? systemScheme : mode;
}

function applyNativeOverride(mode: ThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ThemeScheme>(() =>
    resolveSystemScheme(Appearance.getColorScheme()),
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(resolveSystemScheme(colorScheme));
    });

    let mounted = true;
    void AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (!mounted || !isThemeMode(stored)) {
        return;
      }
      setModeState(stored);
      applyNativeOverride(stored);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    applyNativeOverride(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const scheme = resolveScheme(mode, systemScheme);
  const value = useMemo(
    () => ({
      mode,
      setMode,
      scheme,
      colors: palette[scheme],
    }),
    [mode, setMode, scheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
