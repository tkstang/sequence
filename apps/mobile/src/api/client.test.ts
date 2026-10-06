var mockActiveGameCookieGameId: string | undefined;

jest.mock('./cookies.ts', () => ({
  getActiveGameCookieGameId: () => mockActiveGameCookieGameId,
  setActiveGameCookieGameId: (gameId: string | undefined) => {
    mockActiveGameCookieGameId = gameId;
  },
}));

import { getGameIdForCookieHeader } from './client.ts';
import { setActiveGameCookieGameId } from './cookies.ts';

describe('getGameIdForCookieHeader', () => {
  afterEach(() => {
    setActiveGameCookieGameId(undefined);
  });

  it('reads the game id from a tRPC operation input', () => {
    setActiveGameCookieGameId('fallback-game');

    expect(
      getGameIdForCookieHeader([
        { input: { gameId: 'operation-game', targetSeat: 1 } },
      ]),
    ).toBe('operation-game');
  });

  it('falls back to the active stream game id', () => {
    setActiveGameCookieGameId('active-game');

    expect(
      getGameIdForCookieHeader([{ input: { inviteCode: 'ABC123' } }]),
    ).toBe('active-game');
    expect(mockActiveGameCookieGameId).toBe('active-game');
  });
});
