import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import { ThemeProvider } from '../../theme/theme-provider.tsx';
import { THEME_STORAGE_KEY } from '../../theme/use-theme.ts';
import { SettingsScreen } from './SettingsScreen.tsx';

var mockRouterReplace = jest.fn();
var mockSignOut = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '9.8.7',
    },
  },
}));

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}));

jest.mock('../../auth/client.ts', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

const asyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => {
  mockRouterReplace = jest.fn();
  mockSignOut = jest.fn();
  asyncStorage.getItem.mockResolvedValue(null);
  asyncStorage.setItem.mockResolvedValue();
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('light');
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(jest.fn());
  jest.spyOn(Appearance, 'addChangeListener').mockImplementation(() => ({
    remove: jest.fn(),
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('SettingsScreen', () => {
  it('renders theme controls, logout, and the app version', async () => {
    const { getByLabelText, getByTestId, getByText } = await render(
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>,
    );

    expect(getByTestId('settings.screen')).toBeTruthy();
    expect(getByTestId('settings.theme.tabs')).toBeTruthy();
    expect(getByTestId('settings.theme.system')).toBeTruthy();
    expect(getByTestId('settings.theme.light')).toBeTruthy();
    expect(getByTestId('settings.theme.dark')).toBeTruthy();
    expect(getByLabelText('Use system theme')).toBeTruthy();
    expect(getByTestId('settings.logout')).toBeTruthy();
    expect(getByTestId('settings.version')).toBeTruthy();
    expect(getByText('Version 9.8.7')).toBeTruthy();

    await waitFor(() =>
      expect(asyncStorage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY),
    );
  });

  it('persists theme mode changes through ThemeProvider', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(
        getByTestId('settings.theme.system').props.accessibilityState,
      ).toMatchObject({ selected: true }),
    );

    await user.press(getByTestId('settings.theme.dark'));

    await waitFor(() =>
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        THEME_STORAGE_KEY,
        'dark',
      ),
    );
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('dark');
    expect(
      getByTestId('settings.theme.dark').props.accessibilityState,
    ).toMatchObject({ selected: true });

    await user.press(getByTestId('settings.theme.system'));

    await waitFor(() =>
      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        THEME_STORAGE_KEY,
        'system',
      ),
    );
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('unspecified');
  });

  it('signs out and returns to login', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>,
    );

    await user.press(getByTestId('settings.logout'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith();
    });
    expect(mockRouterReplace).toHaveBeenCalledWith('./login');
  });
});
