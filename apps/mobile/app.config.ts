import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Sequence Online',
  slug: 'sequence-online',
  scheme: 'sequence',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: ['expo-router'],
  experiments: {
    reactCompiler: true,
    typedRoutes: true,
  },
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
    wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:3001',
  },
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.tkstang.sequenceonline',
    supportsTablet: false,
  },
});
