import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette } from '@sequence/design-tokens';
import { act, cleanup, render, waitFor } from '@testing-library/react-native';
import { Appearance, Text } from 'react-native';

import { ThemeProvider } from './theme-provider.tsx';
import {
  THEME_STORAGE_KEY,
  useTheme,
  type ThemeContextValue,
} from './use-theme.ts';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const asyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

let latestTheme: ThemeContextValue | null = null;
let appearanceListener:
  | Parameters<typeof Appearance.addChangeListener>[0]
  | null = null;
let removeAppearanceListener: jest.Mock;

function ThemeProbe() {
  latestTheme = useTheme();
  return (
    <Text testID="theme.probe">
      {latestTheme.mode}:{latestTheme.scheme}:{latestTheme.colors.bg}
    </Text>
  );
}

function currentTheme(): ThemeContextValue {
  if (!latestTheme) {
    throw new Error('ThemeProbe has not rendered');
  }
  return latestTheme;
}

beforeEach(() => {
  latestTheme = null;
  appearanceListener = null;
  removeAppearanceListener = jest.fn();
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light');
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(jest.fn());
  jest.spyOn(Appearance, 'addChangeListener').mockImplementation((listener) => {
    appearanceListener = listener;
    return { remove: removeAppearanceListener };
  });
  asyncStorage.getItem.mockResolvedValue(null);
  asyncStorage.setItem.mockResolvedValue();
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('ThemeProvider', () => {
  it('returns a safe light fallback without a provider', async () => {
    render(<ThemeProbe />);

    await waitFor(() => expect(latestTheme).not.toBeNull());
    expect(currentTheme()).toMatchObject({
      mode: 'system',
      scheme: 'light',
      colors: palette.light,
    });
  });

  it('loads a persisted mode and applies the native override', async () => {
    asyncStorage.getItem.mockResolvedValue('dark');

    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
      await Promise.resolve();
    });

    await waitFor(() => expect(currentTheme().mode).toBe('dark'));

    expect(asyncStorage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('dark');
    expect(currentTheme()).toMatchObject({
      scheme: 'dark',
      colors: palette.dark,
    });
  });

  it('persists manual mode changes and updates native appearance', async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(asyncStorage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY),
    );

    await act(async () => {
      currentTheme().setMode('dark');
    });

    expect(asyncStorage.setItem).toHaveBeenCalledWith(
      THEME_STORAGE_KEY,
      'dark',
    );
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('dark');
    expect(currentTheme()).toMatchObject({
      mode: 'dark',
      scheme: 'dark',
      colors: palette.dark,
    });
  });

  it('system mode follows Appearance changes', async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(appearanceListener).not.toBeNull());

    await act(async () => {
      appearanceListener?.({ colorScheme: 'dark' });
    });

    await waitFor(() => expect(currentTheme().scheme).toBe('dark'));
    expect(currentTheme()).toMatchObject({
      mode: 'system',
      colors: palette.dark,
    });

    await act(async () => {
      currentTheme().setMode('system');
    });

    expect(Appearance.setColorScheme).toHaveBeenCalledWith('unspecified');
    expect(asyncStorage.setItem).toHaveBeenCalledWith(
      THEME_STORAGE_KEY,
      'system',
    );
  });
});
