jest.mock('./cookies.ts', () => ({
  buildCookieHeader: jest.fn(),
  getActiveGameCookieGameId: jest.fn(),
}));

import {
  WS_KEEP_ALIVE,
  WS_LAZY,
  WS_RETRY_DELAY,
  websocketRetryDelayMs,
} from '../realtime/timing.ts';
import { buildCookieHeader } from './cookies.ts';
import { getActiveGameCookieGameId } from './cookies.ts';
import {
  createAuthedWebSocketClass,
  createWebSocketClientOptions,
} from './ws.ts';

const mockedBuildCookieHeader =
  buildCookieHeader as unknown as jest.MockedFunction<typeof buildCookieHeader>;
const mockedGetActiveGameCookieGameId =
  getActiveGameCookieGameId as unknown as jest.MockedFunction<
    typeof getActiveGameCookieGameId
  >;

type ConstructedSocket = {
  protocols?: string | string[];
  url: string | URL;
  options?: unknown;
};

class SpyWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: ConstructedSocket[] = [];

  constructor(
    url: string | URL,
    protocols?: string | string[],
    options?: unknown,
  ) {
    SpyWebSocket.instances.push({ url, protocols, options });
  }
}

describe('AuthedWebSocket', () => {
  beforeEach(() => {
    mockedBuildCookieHeader.mockReset();
    mockedGetActiveGameCookieGameId.mockReset();
    mockedGetActiveGameCookieGameId.mockReturnValue(undefined);
    SpyWebSocket.instances = [];
  });

  it('passes the assembled Cookie header as the React Native WebSocket options arg', async () => {
    mockedBuildCookieHeader.mockResolvedValue(
      'better-auth.session_token=abc123',
    );
    const AuthedWebSocket = createAuthedWebSocketClass(
      SpyWebSocket as unknown as Parameters<
        typeof createAuthedWebSocketClass
      >[0],
    );

    const socket = new AuthedWebSocket('ws://localhost:3001/trpc');
    await Promise.resolve();

    expect(socket.readyState).toBe(SpyWebSocket.CONNECTING);
    expect(mockedBuildCookieHeader).toHaveBeenCalledWith();
    expect(SpyWebSocket.instances).toEqual([
      {
        url: 'ws://localhost:3001/trpc',
        protocols: undefined,
        options: {
          headers: {
            Cookie: 'better-auth.session_token=abc123',
          },
        },
      },
    ]);
  });

  it('includes the active game id when assembling the WebSocket cookie header', async () => {
    mockedGetActiveGameCookieGameId.mockReturnValue('game-1');
    mockedBuildCookieHeader.mockResolvedValue('sequence_guest=guest-token-1');
    const AuthedWebSocket = createAuthedWebSocketClass(
      SpyWebSocket as unknown as Parameters<
        typeof createAuthedWebSocketClass
      >[0],
    );

    const socket = new AuthedWebSocket('ws://localhost:3001/trpc');
    await Promise.resolve();

    expect(socket.readyState).toBe(SpyWebSocket.CONNECTING);
    expect(mockedBuildCookieHeader).toHaveBeenCalledWith({
      gameId: 'game-1',
    });
    expect(SpyWebSocket.instances.at(-1)?.options).toEqual({
      headers: {
        Cookie: 'sequence_guest=guest-token-1',
      },
    });
  });

  it('omits headers when there is no cookie to send', async () => {
    mockedBuildCookieHeader.mockResolvedValue(undefined);
    const AuthedWebSocket = createAuthedWebSocketClass(
      SpyWebSocket as unknown as Parameters<
        typeof createAuthedWebSocketClass
      >[0],
    );

    const socket = new AuthedWebSocket('ws://localhost:3001/trpc');
    await Promise.resolve();

    expect(socket.readyState).toBe(SpyWebSocket.CONNECTING);
    expect(SpyWebSocket.instances).toEqual([
      {
        url: 'ws://localhost:3001/trpc',
        protocols: undefined,
        options: undefined,
      },
    ]);
  });
});

describe('websocket timing contract', () => {
  it('exports the keep-alive and lazy wsLink constants', () => {
    expect(WS_KEEP_ALIVE).toEqual({
      enabled: true,
      intervalMs: 5_000,
      pongTimeoutMs: 2_000,
    });
    expect(WS_LAZY).toEqual({
      enabled: true,
      closeMs: 30_000,
    });
  });

  it('exports the exponential retry delay contract', () => {
    expect(WS_RETRY_DELAY).toEqual({
      initialMs: 250,
      maxMs: 5_000,
    });
    expect([0, 1, 2, 3, 4, 5, 6].map(websocketRetryDelayMs)).toEqual([
      250, 500, 1_000, 2_000, 4_000, 5_000, 5_000,
    ]);
  });

  it('builds ws client options from the shared contract constants', () => {
    const options = createWebSocketClientOptions({
      wsUrl: 'ws://localhost:3001',
    });

    expect(options.url).toBe('ws://localhost:3001/trpc');
    expect(options.keepAlive).toBe(WS_KEEP_ALIVE);
    expect(options.lazy).toBe(WS_LAZY);
    expect(options.retryDelayMs?.(0)).toBe(250);
    expect(options.retryDelayMs?.(6)).toBe(5_000);
  });

  it('normalizes trailing slashes in the configured WebSocket origin', () => {
    const options = createWebSocketClientOptions({
      wsUrl: 'ws://localhost:3001/',
    });

    expect(options.url).toBe('ws://localhost:3001/trpc');
  });
});
