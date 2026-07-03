import { cleanup, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

var mockSession: { data: unknown; isPending: boolean } = {
  data: null,
  isPending: false,
};
var mockRenderedScreenNames: string[] = [];
var mockProtectedGuards: boolean[] = [];

jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('expo-router', () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  function Stack({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  Stack.Screen = ({ name }: { name: string }) => {
    mockRenderedScreenNames.push(name);
    return null;
  };
  Stack.Protected = ({
    children,
    guard,
  }: {
    children: ReactNode;
    guard: boolean;
  }) => {
    mockProtectedGuards.push(guard);
    return guard ? <>{children}</> : null;
  };

  return { Stack };
});

jest.mock('../api/client.ts', () => ({
  createSequenceQueryClient: jest.fn(() => ({})),
  createSequenceTRPCClient: jest.fn(() => ({})),
  TRPCProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('../auth/client.ts', () => ({
  useSession: () => mockSession,
}));

jest.mock('../theme/theme-provider.tsx', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

import RootLayout from '../app/_layout.tsx';

afterEach(() => {
  cleanup();
  mockSession = { data: null, isPending: false };
  mockRenderedScreenNames = [];
  mockProtectedGuards = [];
});

describe('RootLayout protected routing', () => {
  it('exposes only auth routes when unauthenticated', async () => {
    await render(<RootLayout />);

    expect(mockProtectedGuards).toEqual([false, true]);
    expect(mockRenderedScreenNames).toEqual(['(auth)/login', '(auth)/signup']);
  });

  it('exposes the home route when authenticated', async () => {
    mockSession = {
      data: { user: { email: 'ada@example.test' } },
      isPending: false,
    };

    await render(<RootLayout />);

    expect(mockProtectedGuards).toEqual([true, false]);
    expect(mockRenderedScreenNames).toEqual(['index']);
  });
});
