import { getCookie } from '../auth/client.ts';
import { getGuestToken as readGuestToken } from '../auth/guest-store.ts';

export type GetGuestTokenForGame = (
  gameId: string,
) => Promise<string | undefined>;

export type BuildCookieHeaderOptions = {
  gameId?: string;
  getGuestToken?: GetGuestTokenForGame;
};

let activeGameCookieGameId: string | undefined;

export function setActiveGameCookieGameId(gameId: string | undefined): void {
  activeGameCookieGameId = gameId;
}

export function getActiveGameCookieGameId(): string | undefined {
  return activeGameCookieGameId;
}

export async function getGuestTokenForGame(
  gameId: string,
): Promise<string | undefined> {
  return (await readGuestToken(gameId)) ?? undefined;
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
    const guestTokenReader = options.getGuestToken ?? getGuestTokenForGame;
    const guestToken = await guestTokenReader(options.gameId);

    if (guestToken) {
      cookies.push(`sequence_guest=${guestToken}`);
    }
  }

  return cookies.length > 0 ? cookies.join('; ') : undefined;
}
