import { getCookie } from '../auth/client.ts';

export type GetGuestTokenForGame = (
  gameId: string,
) => Promise<string | undefined>;

export type BuildCookieHeaderOptions = {
  gameId?: string;
  getGuestToken?: GetGuestTokenForGame;
};

export async function getGuestTokenForGame(
  _gameId: string,
): Promise<string | undefined> {
  return undefined;
}

export async function buildCookieHeader(
  options: BuildCookieHeaderOptions = {},
): Promise<string | undefined> {
  const cookies: string[] = [];
  const sessionCookie = await getCookie();

  if (sessionCookie) {
    cookies.push(sessionCookie);
  }

  if (options.gameId) {
    const getGuestToken = options.getGuestToken ?? getGuestTokenForGame;
    const guestToken = await getGuestToken(options.gameId);

    if (guestToken) {
      cookies.push(`sequence_guest=${guestToken}`);
    }
  }

  return cookies.length > 0 ? cookies.join('; ') : undefined;
}
