import { randomUUID } from 'node:crypto';
import process from 'node:process';

import { expect, type BrowserContext, type Page } from '@playwright/test';
import { type Card, type GameState } from '@sequence/game-logic';

import {
  createDb,
  type Database,
} from '../../../packages/api/src/db/client.ts';
import { gamePlayers } from '../../../packages/api/src/db/schema/game-players.ts';
import { games } from '../../../packages/api/src/db/schema/games.ts';
import {
  appendEvents,
  loadGameState,
  persistGameState,
} from '../../../packages/api/src/game/state-mapping.ts';

const apiUrl = 'http://127.0.0.1:3001';

let dbBundle: ReturnType<typeof createDb> | null = null;

export function testDb(): Database {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST is required for e2e tests');
  dbBundle ??= createDb(url);
  return dbBundle.db;
}

function testSql() {
  testDb();
  return dbBundle!.sql;
}

export async function closeTestDb() {
  await dbBundle?.sql.end();
  dbBundle = null;
}

function splitSetCookie(header: string): string[] {
  return header.split(/,(?=[^ ;]+=)/).map((cookie) => cookie.trim());
}

function cookiePairs(setCookie: string): string[] {
  return splitSetCookie(setCookie)
    .map((cookie) => cookie.split(';')[0]?.trim())
    .filter((cookie): cookie is string => Boolean(cookie));
}

async function installCookies(context: BrowserContext, setCookie: string) {
  const cookies = cookiePairs(setCookie).map((pair) => {
    const [name, ...rest] = pair.split('=');
    return {
      name: name!,
      value: rest.join('='),
      url: apiUrl,
      httpOnly: true,
      sameSite: 'Lax' as const,
    };
  });
  await context.addCookies(cookies);
}

export async function signUpAccount(
  context: BrowserContext,
  label: string,
): Promise<{ userId: string; cookie: string; email: string }> {
  const email = `${label.toLowerCase()}-${randomUUID()}@example.com`;
  const res = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'supersecret123',
      name: label,
    }),
  });
  if (!res.ok) {
    throw new Error(`signup failed: ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.get('set-cookie') ?? '';
  await installCookies(context, setCookie);
  const json = (await res.json()) as { user: { id: string } };
  return {
    userId: json.user.id,
    cookie: cookiePairs(setCookie).join('; '),
    email,
  };
}

export async function trpcMutation<T>(
  path: string,
  input: unknown,
  cookie?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (cookie) headers.cookie = cookie;
  const res = await fetch(`${apiUrl}/trpc/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as
    | { result: { data: T } }
    | { error: { message?: string } };
  if (!res.ok || !('result' in json)) {
    throw new Error(
      'error' in json ? (json.error.message ?? path) : `${path} failed`,
    );
  }
  return json.result.data;
}

export async function createRemoteGame(
  context: BrowserContext,
  label: string,
  mode: 'tap' | 'drag' = 'tap',
) {
  const host = await signUpAccount(context, label);
  const created = await trpcMutation<{
    gameId: string;
    inviteCode: string;
  }>(
    'game.create',
    { playerCount: 2, mode, timerSeconds: null, local: false },
    host.cookie,
  );
  return { host, ...created };
}

export async function createLocalGame(
  context: BrowserContext,
  label: string,
  mode: 'tap' | 'drag' = 'tap',
) {
  const host = await signUpAccount(context, label);
  const created = await trpcMutation<{
    gameId: string;
    inviteCode: string;
  }>(
    'game.create',
    {
      playerCount: 2,
      mode,
      timerSeconds: null,
      local: true,
      opponentName: 'Guest',
    },
    host.cookie,
  );
  return { host, ...created };
}

export async function joinAsGuest(
  page: Page,
  inviteCode: string,
  name: string,
) {
  await page.goto(`/join/${inviteCode}`);
  await page.getByLabel('Guest name').fill(name);
  await page.getByRole('button', { name: /join as guest/i }).click();
  await expect(page).toHaveURL(/\/game\/[0-9a-f-]+$/);
}

function withSeatZeroHand(state: GameState, cards: readonly Card[]): GameState {
  const existing = state.hands[0] ?? [];
  const hand = [
    ...cards,
    ...existing.filter(
      (candidate) =>
        !cards.some(
          (card) =>
            card.rank === candidate.rank && card.suit === candidate.suit,
        ),
    ),
  ].slice(0, existing.length || 7);
  const hands = state.hands.map((candidate, seat) =>
    seat === 0 ? hand : [...candidate],
  );
  return { ...state, hands };
}

export async function seedOpeningHand(gameId: string, cards: readonly Card[]) {
  const db = testDb();
  const [row] = await testSql()<[{ version: number }]>`
    select version from games where id = ${gameId}
  `;
  if (!row) throw new Error(`missing game ${gameId}`);
  const state = await loadGameState(db, gameId);
  await db.transaction((tx) =>
    persistGameState(tx, gameId, withSeatZeroHand(state, cards), row.version),
  );
}

export async function seedNearWin(gameId: string) {
  const db = testDb();
  const [row] = await testSql()<[{ version: number }]>`
    select version from games where id = ${gameId}
  `;
  if (!row) throw new Error(`missing game ${gameId}`);
  const state = await loadGameState(db, gameId);
  const board = new Map(state.board);
  for (const position of ['2AC', '2KC', '2QC', '2TC', '29C'] as const) {
    board.set(position, { chip: 1, lockedBy: 1 });
  }
  for (const position of ['1AC', '1KC', '1QC'] as const) {
    board.set(position, { chip: 1 });
  }
  const nearWin = withSeatZeroHand(
    {
      ...state,
      board,
      sequences: [
        { id: 1, team: 1, cells: ['2AC', '2KC', '2QC', '2TC', '29C'] },
      ],
      nextSequenceId: 2,
      currentSeat: 0,
      round: 1,
    },
    [{ rank: 'T', suit: 'C' }],
  );
  await db.transaction((tx) =>
    persistGameState(tx, gameId, nearWin, row.version),
  );
}

export async function seedFinishedGame(input: {
  hostUserId: string;
  joinerUserId: string;
}) {
  const db = testDb();
  const gameId = randomUUID();
  const inviteCode = gameId.slice(0, 10);
  await db.insert(games).values({
    id: gameId,
    inviteCode,
    createdBy: input.hostUserId,
    playerCount: 2,
    mode: 'tap',
    timerSeconds: null,
    status: 'finished',
    winnerTeam: 1,
    endReason: 'win',
    finishedAt: new Date(),
    version: 1,
  });
  await db.insert(gamePlayers).values([
    {
      gameId,
      seat: 0,
      team: 1,
      userId: input.hostUserId,
      isCreator: true,
      connected: true,
    },
    {
      gameId,
      seat: 1,
      team: 2,
      userId: input.joinerUserId,
      connected: true,
    },
  ]);
  await db.transaction((tx) =>
    appendEvents(tx, gameId, [{ type: 'GameWon', team: 1 }]),
  );
  return { gameId, inviteCode };
}

export async function playFirstHighlightedMove(page: Page) {
  const cardButtons = page.locator(
    'section[aria-label="Your hand"] button[aria-label]:not([aria-label="Raise hand"]):not([aria-label="Lower hand"])',
  );
  const count = await cardButtons.count();
  for (let index = 0; index < count; index++) {
    await cardButtons.nth(index).click({ force: true });
    const target = page.locator('[data-highlight="valid-target"]').first();
    if ((await target.count()) > 0) {
      await target.click({ force: true });
      return;
    }
  }
  throw new Error('No highlighted move found in starting hand');
}
