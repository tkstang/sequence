import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { getApiEnv, type ApiEnv } from '../api/env.ts';

export const AUTH_STORAGE_PREFIX = 'sequence.auth';
export const AUTH_SECURE_STORE_KEYS = [
  `${AUTH_STORAGE_PREFIX}_cookie`,
  `${AUTH_STORAGE_PREFIX}_session_data`,
] as const;

export const secureStoreSessionStorage = {
  getItem: (key: string) => SecureStore.getItem(key),
  setItem: (key: string, value: string) => SecureStore.setItem(key, value),
};

export function createAuthClientConfig(env: ApiEnv = getApiEnv()) {
  return {
    baseURL: env.apiUrl,
    plugins: [
      expoClient({
        scheme: 'sequence',
        storage: secureStoreSessionStorage,
        storagePrefix: AUTH_STORAGE_PREFIX,
      }),
    ],
  };
}

export const authClient = createAuthClient(createAuthClientConfig());

export const { useSession, signIn, signUp, signOut, getCookie } = authClient;
