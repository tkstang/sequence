import { cleanup, render } from '@testing-library/react-native';

type TestGlobal = typeof globalThis & {
  __DEV__: boolean;
};

const testGlobal = globalThis as TestGlobal;
const mockStack = jest.fn(() => null);

jest.mock('expo-router', () => ({
  Stack: mockStack,
}));

afterEach(() => {
  cleanup();
  mockStack.mockClear();
  jest.resetModules();
  testGlobal['__DEV__'] = true;
});

describe('DevLayout', () => {
  it('renders null when development routes are disabled', () => {
    testGlobal['__DEV__'] = false;

    const DevLayout = (
      require('../app/dev/_layout.tsx') as typeof import('../app/dev/_layout.tsx')
    ).default;
    render(<DevLayout />);

    expect(mockStack).not.toHaveBeenCalled();
  });
});
