jest.mock('../auth/client.ts', () => ({
  getCookie: jest.fn(),
}));

jest.mock('../auth/guest-store.ts', () => ({
  getGuestToken: jest.fn(),
}));

import { getCookie } from '../auth/client.ts';
import { getGuestToken } from '../auth/guest-store.ts';
import { buildCookieHeader, getGuestTokenForGame } from './cookies.ts';

const mockedGetCookie = getCookie as unknown as jest.MockedFunction<
  () => string | undefined
>;
const mockedGetGuestToken = getGuestToken as unknown as jest.MockedFunction<
  (gameId: string) => Promise<string | null>
>;

describe('buildCookieHeader', () => {
  beforeEach(() => {
    mockedGetCookie.mockReset();
    mockedGetGuestToken.mockReset();
  });

  it('returns the Better Auth cookie for a registered session', async () => {
    mockedGetCookie.mockReturnValue('better-auth.session_token=abc123');

    await expect(buildCookieHeader()).resolves.toBe(
      'better-auth.session_token=abc123',
    );
  });

  it('merges the guest token cookie for a game when one exists', async () => {
    mockedGetCookie.mockReturnValue('better-auth.session_token=abc123');

    await expect(
      buildCookieHeader({
        gameId: 'game-1',
        getGuestToken: async (gameId) =>
          gameId === 'game-1' ? 'guest-token-1' : undefined,
      }),
    ).resolves.toBe(
      'better-auth.session_token=abc123; sequence_guest=guest-token-1',
    );
  });

  it('returns undefined when no session or guest token is available', async () => {
    mockedGetCookie.mockReturnValue(undefined);

    await expect(buildCookieHeader({ gameId: 'missing-game' })).resolves.toBe(
      undefined,
    );
  });
});

describe('getGuestTokenForGame', () => {
  it('reads guest tokens from the guest store', async () => {
    mockedGetGuestToken.mockResolvedValue('stored-token');

    await expect(getGuestTokenForGame('game-1')).resolves.toBe('stored-token');
    expect(mockedGetGuestToken).toHaveBeenCalledWith('game-1');
  });

  it('normalizes missing guest tokens to undefined', async () => {
    mockedGetGuestToken.mockResolvedValue(null);

    await expect(getGuestTokenForGame('game-1')).resolves.toBeUndefined();
  });
});
