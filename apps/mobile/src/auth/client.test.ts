jest.mock('@better-auth/expo/client', () => ({
  expoClient: jest.fn((options: unknown) => ({
    id: 'expo',
    options,
  })),
}));

jest.mock('better-auth/react', () => ({
  createAuthClient: jest.fn(() => ({
    getCookie: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    useSession: jest.fn(),
  })),
}));

var mockExpoConfig: { extra?: Record<string, unknown> } | undefined;

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockExpoConfig;
    },
  },
}));

import { expoClient } from '@better-auth/expo/client';

import {
  AUTH_BASE_PATH,
  AUTH_SECURE_STORE_KEYS,
  AUTH_STORAGE_PREFIX,
  createAuthClientConfig,
  getAuthBaseURL,
  secureStoreSessionStorage,
} from './client.ts';

const mockedExpoClient = jest.mocked(expoClient);

describe('mobile auth client config', () => {
  beforeEach(() => {
    mockExpoConfig = undefined;
    mockedExpoClient.mockClear();
  });

  it('wires the Expo plugin to SecureStore-backed session storage', () => {
    const config = createAuthClientConfig({
      apiUrl: 'https://api.example.test',
      wsUrl: 'wss://api.example.test',
    });

    expect(config).toMatchObject({
      baseURL: 'https://api.example.test/api/auth',
    });
    expect(expoClient).toHaveBeenCalledWith({
      scheme: 'sequence',
      storage: secureStoreSessionStorage,
      storagePrefix: AUTH_STORAGE_PREFIX,
    });
    expect(config.plugins).toEqual([
      {
        id: 'expo',
        options: {
          scheme: 'sequence',
          storage: secureStoreSessionStorage,
          storagePrefix: AUTH_STORAGE_PREFIX,
        },
      },
    ]);
  });

  it('reads the auth base URL from the mobile env module by default', () => {
    mockExpoConfig = {
      extra: {
        apiUrl: 'https://env-api.example.test',
        wsUrl: 'wss://env-api.example.test',
      },
    };

    expect(createAuthClientConfig()).toMatchObject({
      baseURL: 'https://env-api.example.test/api/auth',
    });
  });

  it('normalizes the Better Auth route path onto the API origin', () => {
    expect(AUTH_BASE_PATH).toBe('/api/auth');
    expect(
      getAuthBaseURL({
        apiUrl: 'https://api.example.test/',
        wsUrl: 'wss://api.example.test',
      }),
    ).toBe('https://api.example.test/api/auth');
  });

  it('keeps SecureStore keys inside the Expo-supported character set', () => {
    expect(AUTH_SECURE_STORE_KEYS).toHaveLength(2);
    expect(AUTH_SECURE_STORE_KEYS).toEqual(
      AUTH_SECURE_STORE_KEYS.map(() =>
        expect.stringMatching(/^[A-Za-z0-9._-]+$/),
      ),
    );
  });
});
