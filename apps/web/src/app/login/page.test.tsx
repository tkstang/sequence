import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage, { sanitizeNextPath } from './page.tsx';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
  signInEmail: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/auth-client.ts', () => ({
  signIn: { email: mocks.signInEmail },
}));

describe('sanitizeNextPath', () => {
  it('allows relative app paths only', () => {
    expect(sanitizeNextPath('/join/abc123')).toBe('/join/abc123');
    expect(sanitizeNextPath('/join/abc123?x=1#top')).toBe(
      '/join/abc123?x=1#top',
    );
    expect(sanitizeNextPath('https://evil.example/join/abc123')).toBe(
      '/dashboard',
    );
    expect(sanitizeNextPath('//evil.example/join/abc123')).toBe('/dashboard');
  });
});

describe('<LoginPage>', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.signInEmail.mockReset();
    mocks.searchParams = new URLSearchParams();
  });

  it('redirects to a safe invite next path after successful login', async () => {
    mocks.searchParams = new URLSearchParams('next=/join/abc123');
    mocks.signInEmail.mockResolvedValueOnce({ data: null, error: null });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'p@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'supersecret');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(mocks.signInEmail).toHaveBeenCalledWith({
        email: 'p@example.com',
        password: 'supersecret',
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith('/join/abc123');
  });
});
