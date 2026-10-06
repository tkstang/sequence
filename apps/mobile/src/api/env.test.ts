var mockExpoConfig: { extra?: Record<string, unknown> } | undefined;

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockExpoConfig;
    },
  },
}));

import { getApiEnv } from './env.ts';

describe('mobile API env', () => {
  beforeEach(() => {
    mockExpoConfig = undefined;
  });

  it('defaults to the local API endpoints when Expo extra is absent', () => {
    expect(getApiEnv()).toEqual({
      apiUrl: 'http://localhost:3001',
      wsUrl: 'ws://localhost:3001',
    });
  });

  it('reads API endpoints from Expo config extra', () => {
    mockExpoConfig = {
      extra: {
        apiUrl: 'https://api.example.test',
        wsUrl: 'wss://api.example.test',
      },
    };

    expect(getApiEnv()).toEqual({
      apiUrl: 'https://api.example.test',
      wsUrl: 'wss://api.example.test',
    });
  });
});
