import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AuthenticatedHeader } from '@/components/authenticated-header.tsx';

import { useLogout } from './use-logout.ts';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('./auth-client.ts', () => ({
  signOut: mocks.signOut,
}));

function LogoutHarness() {
  const { logout, isSigningOut } = useLogout();
  return (
    <AuthenticatedHeader
      userInitial="T"
      onLogout={logout}
      isSigningOut={isSigningOut}
    />
  );
}

describe('useLogout', () => {
  it('calls Better Auth signOut, clears query state, and redirects to login', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['game', 'myGames'], { stale: true });
    mocks.signOut.mockResolvedValueOnce({ data: null, error: null });

    render(
      <QueryClientProvider client={queryClient}>
        <LogoutHarness />
      </QueryClientProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(mocks.replace).toHaveBeenCalledWith('/login');
  });
});
