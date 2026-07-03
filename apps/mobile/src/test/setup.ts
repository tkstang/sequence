type ReactNativeTestGlobal = typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
  IS_REACT_NATIVE_TEST_ENVIRONMENT: boolean;
  __DEV__: boolean;
  __fbBatchedBridgeConfig: {
    localModulesConfig: unknown[];
    remoteModuleConfig: unknown[];
  };
  nativeFabricUIManager: Record<string, never>;
  cancelAnimationFrame?: (handle: number | null | undefined) => void;
  requestAnimationFrame?: (callback: (time: number) => void) => number;
};

const reactNativeTestGlobal = globalThis as ReactNativeTestGlobal;

reactNativeTestGlobal.IS_REACT_ACT_ENVIRONMENT = true;
reactNativeTestGlobal.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
reactNativeTestGlobal['__DEV__'] = true;
reactNativeTestGlobal['__fbBatchedBridgeConfig'] = {
  localModulesConfig: [],
  remoteModuleConfig: [],
};
reactNativeTestGlobal.nativeFabricUIManager = {};
reactNativeTestGlobal.cancelAnimationFrame ??= (handle) => {
  if (handle != null) {
    clearTimeout(handle);
  }
};
reactNativeTestGlobal.requestAnimationFrame ??= (callback) =>
  setTimeout(() => callback(Date.now()), 0) as unknown as number;

require('@react-native/js-polyfills/error-guard');

jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () =>
  jest.requireActual('@react-native/jest-preset/jest/mocks/NativeModules'),
);
jest.mock('react-native/Libraries/Core/InitializeCore', () =>
  jest.requireActual('@react-native/jest-preset/jest/mocks/InitializeCore'),
);
jest.mock('react-native/Libraries/Core/NativeExceptionsManager', () => ({}));
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const mockTurboModules = {
    AppState: {
      addListener: jest.fn(),
      getConstants: () => ({ initialAppState: 'active' }),
      getCurrentAppState: jest.fn(
        (success: (state: { app_state: string }) => void) =>
          success({ app_state: 'active' }),
      ),
      removeListeners: jest.fn(),
    },
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          screen: { fontScale: 2, height: 1334, scale: 2, width: 750 },
          window: { fontScale: 2, height: 1334, scale: 2, width: 750 },
        },
      }),
    },
    SettingsManager: {
      deleteValues: jest.fn(),
      getConstants: () => ({ settings: {} }),
      setValues: jest.fn(),
    },
    PlatformConstants: {
      getConstants: () => ({
        forceTouchAvailable: false,
        interfaceIdiom: 'phone',
        isTesting: true,
        osVersion: '18.0',
        reactNativeVersion: { major: 0, minor: 86, patch: 0 },
        systemName: 'iOS',
      }),
    },
    SourceCode: {
      getConstants: () => ({
        scriptURL: 'http://localhost/index.bundle?platform=ios',
      }),
    },
    Timing: {
      createTimer: jest.fn(),
      deleteTimer: jest.fn(),
      setSendIdleEvents: jest.fn(),
    },
    UIManager: {
      getConstants: () => ({}),
      getConstantsForViewManager: () => ({}),
      getDefaultEventTypes: () => [],
      getViewManagerConfig: () => ({}),
    },
    WebSocketModule: {
      addListener: jest.fn(),
      close: jest.fn(),
      connect: jest.fn(),
      ping: jest.fn(),
      removeListeners: jest.fn(),
      send: jest.fn(),
      sendBinary: jest.fn(),
    },
  };

  return {
    get: (name: keyof typeof mockTurboModules) =>
      mockTurboModules[name] ?? null,
    getEnforcing: (name: keyof typeof mockTurboModules) =>
      mockTurboModules[name] ?? {},
  };
});
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
  __esModule: true,
  default: {
    deleteValues: jest.fn(),
    getConstants: () => ({ settings: {} }),
    setValues: jest.fn(),
  },
}));

if ('expect' in globalThis) {
  const { configure } =
    require('@testing-library/react-native') as typeof import('@testing-library/react-native');

  configure({
    asyncUtilTimeout: 2000,
  });
}
