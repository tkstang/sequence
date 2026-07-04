import type { ConfigContext, ExpoConfig } from 'expo/config';

const DEV_API_URL = 'http://localhost:3001';
const DEV_WS_URL = 'ws://localhost:3001';

function assertProductionProtocol(
  name: string,
  value: string,
  protocol: string,
) {
  if (process.env.NODE_ENV !== 'production') return;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid ${protocol} URL in production.`);
  }

  if (parsed.protocol !== `${protocol}:`) {
    throw new Error(`${name} must use ${protocol} in production.`);
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? DEV_API_URL;
  const wsUrl = process.env.EXPO_PUBLIC_WS_URL ?? DEV_WS_URL;

  assertProductionProtocol('EXPO_PUBLIC_API_URL', apiUrl, 'https');
  assertProductionProtocol('EXPO_PUBLIC_WS_URL', wsUrl, 'wss');

  return {
    ...config,
    name: 'Sequence Online',
    slug: 'sequence-online',
    scheme: 'sequence',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    plugins: ['expo-router', 'expo-web-browser'],
    experiments: {
      reactCompiler: true,
      typedRoutes: true,
    },
    extra: {
      ...config.extra,
      apiUrl,
      wsUrl,
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.tkstang.sequenceonline',
      supportsTablet: false,
    },
  };
};
