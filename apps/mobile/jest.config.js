const expoPreset = require('jest-expo/jest-preset');

const transpiledPackages = [
  '(jest-)?react-native',
  '@react-native',
  '@react-native/.+',
  '@react-native-community',
  '@react-native-community/.+',
  'expo',
  'expo-.+',
  '@expo',
  '@expo/.+',
  '@expo-google-fonts/.+',
  'expo-router',
  '@react-navigation',
  '@react-navigation/.+',
  'react-native-.+',
  'react-strict-dom',
  '@stylexjs',
  '@stylexjs/.+',
  '@sequence',
  '@sequence/.+',
];

const transpiledGroup = transpiledPackages.join('|');

module.exports = {
  ...expoPreset,
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
  transformIgnorePatterns: [
    `node_modules/(?!\\.pnpm|${transpiledGroup})`,
    `node_modules/.pnpm/(?!(?:${transpiledGroup.replaceAll('/', '\\+')})@)`,
  ],
};
