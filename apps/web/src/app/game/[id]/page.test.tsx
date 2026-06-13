import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GamePage from './page.tsx';

const GAME_ID = '932230d4-186c-48cb-aca3-b011593601d1';

const mocks = vi.hoisted(() => ({
  subscription: {
    status: 'error',
    error: { data: { code: 'FORBIDDEN' } },
  },
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: GAME_ID }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    isPending: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@trpc/tanstack-react-query', () => ({
  useSubscription: () => mocks.subscription,
}));

vi.mock('@/lib/trpc/client.ts', () => ({
  useTRPC: () => ({
    game: {
      onGameEvent: { subscriptionOptions: vi.fn(() => ({})) },
      setTeam: { mutationOptions: vi.fn(() => ({})) },
      kick: { mutationOptions: vi.fn(() => ({})) },
      randomizeTeams: { mutationOptions: vi.fn(() => ({})) },
      start: { mutationOptions: vi.fn(() => ({})) },
      makeMove: { mutationOptions: vi.fn(() => ({})) },
      turnInDeadCard: { mutationOptions: vi.fn(() => ({})) },
      chooseSequenceCells: { mutationOptions: vi.fn(() => ({})) },
      rematch: { mutationOptions: vi.fn(() => ({})) },
      saveAndExit: { mutationOptions: vi.fn(() => ({})) },
      concede: { mutationOptions: vi.fn(() => ({})) },
    },
  }),
}));

describe('<GamePage>', () => {
  beforeEach(() => {
    mocks.subscription = {
      status: 'error',
      error: { data: { code: 'FORBIDDEN' } },
    };
  });

  it('shows an actionable auth error when the initial game stream is forbidden', () => {
    render(<GamePage />);

    expect(
      screen.getByRole('heading', { name: /game unavailable/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/log in with the account that created or joined/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/loading game/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/connection interrupted/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute(
      'href',
      `/login?next=${encodeURIComponent(`/game/${GAME_ID}`)}`,
    );
  });
});
