import Constants from 'expo-constants';

export type ApiEnv = {
  apiUrl: string;
  wsUrl: string;
};

const DEFAULT_API_ENV: ApiEnv = {
  apiUrl: 'http://localhost:3001',
  wsUrl: 'ws://localhost:3001',
};

function readExtraString(
  extra: Record<string, unknown> | undefined,
  key: keyof ApiEnv,
) {
  const value = extra?.[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;
}

export function resolveApiEnv(
  extra: Record<string, unknown> | undefined,
): ApiEnv {
  return {
    apiUrl: readExtraString(extra, 'apiUrl') ?? DEFAULT_API_ENV.apiUrl,
    wsUrl: readExtraString(extra, 'wsUrl') ?? DEFAULT_API_ENV.wsUrl,
  };
}

export function getApiEnv(): ApiEnv {
  return resolveApiEnv(Constants.expoConfig?.extra);
}
