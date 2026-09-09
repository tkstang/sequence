import Constants from 'expo-constants';

import packageJson from '../../../package.json';

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? packageJson.version;
}
