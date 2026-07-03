import type { WebSocketClientOptions } from '@trpc/client';

import {
  WS_KEEP_ALIVE,
  WS_LAZY,
  websocketRetryDelayMs,
} from '../realtime/timing.ts';
import { buildCookieHeader } from './cookies.ts';
import type { ApiEnv } from './env.ts';

type NativeWebSocketOptions = {
  headers?: Record<string, string>;
};

type WebSocketEventType = Parameters<WebSocket['addEventListener']>[0];
type WebSocketEventHandler = Parameters<WebSocket['addEventListener']>[1];

type PendingListener = {
  type: WebSocketEventType;
  listener: WebSocketEventHandler;
};

type NativeWebSocketConstructor = typeof WebSocket & {
  new (
    url: string | URL,
    protocols?: string | string[],
    options?: NativeWebSocketOptions,
  ): WebSocket;
};

function getWebSocketConstructor() {
  return WebSocket as NativeWebSocketConstructor;
}

export function createAuthedWebSocketClass(
  BaseWebSocket: NativeWebSocketConstructor = getWebSocketConstructor(),
): typeof WebSocket {
  return class AuthedWebSocket {
    static CONNECTING = BaseWebSocket.CONNECTING;
    static OPEN = BaseWebSocket.OPEN;
    static CLOSING = BaseWebSocket.CLOSING;
    static CLOSED = BaseWebSocket.CLOSED;

    private binaryTypeValue: WebSocket['binaryType'] = 'blob';
    private readonly pendingListeners: PendingListener[] = [];
    private socket: WebSocket | null = null;

    constructor(url: string | URL, protocols?: string | string[]) {
      void this.open(url, protocols);
    }

    get readyState() {
      return this.socket?.readyState ?? BaseWebSocket.CONNECTING;
    }

    get binaryType() {
      return this.socket?.binaryType ?? this.binaryTypeValue;
    }

    set binaryType(value: WebSocket['binaryType']) {
      this.binaryTypeValue = value;
      if (this.socket) {
        this.socket.binaryType = value;
      }
    }

    get bufferedAmount() {
      return this.socket?.bufferedAmount ?? 0;
    }

    get extensions() {
      return this.socket?.extensions ?? '';
    }

    get protocol() {
      return this.socket?.protocol ?? '';
    }

    get url() {
      return this.socket?.url ?? '';
    }

    addEventListener(
      type: WebSocketEventType,
      listener: WebSocketEventHandler,
    ) {
      if (this.socket) {
        this.socket.addEventListener(type, listener);
        return;
      }

      this.pendingListeners.push({ type, listener });
    }

    removeEventListener(
      type: WebSocketEventType,
      listener: WebSocketEventHandler,
    ) {
      const index = this.pendingListeners.findIndex(
        (pending) => pending.type === type && pending.listener === listener,
      );

      if (index >= 0) {
        this.pendingListeners.splice(index, 1);
      }

      this.socket?.removeEventListener(type, listener);
    }

    close(code?: number, reason?: string) {
      this.socket?.close(code, reason);
    }

    dispatchEvent(event: Event) {
      return this.socket?.dispatchEvent(event) ?? false;
    }

    send(data: string | ArrayBuffer | Blob | ArrayBufferView) {
      this.socket?.send(data);
    }

    private async open(url: string | URL, protocols?: string | string[]) {
      const cookie = await buildCookieHeader();
      const options = cookie ? { headers: { Cookie: cookie } } : undefined;
      const socket = new BaseWebSocket(url, protocols, options);

      socket.binaryType = this.binaryTypeValue;
      for (const pending of this.pendingListeners) {
        socket.addEventListener(pending.type, pending.listener);
      }
      this.pendingListeners.length = 0;
      this.socket = socket;
    }
  } as unknown as typeof WebSocket;
}

export const AuthedWebSocket = createAuthedWebSocketClass();

function getWebSocketTRPCUrl(wsUrl: string) {
  return `${wsUrl.replace(/\/+$/, '')}/trpc`;
}

export function createWebSocketClientOptions(
  env: Pick<ApiEnv, 'wsUrl'>,
): WebSocketClientOptions {
  return {
    url: getWebSocketTRPCUrl(env.wsUrl),
    WebSocket: AuthedWebSocket,
    keepAlive: WS_KEEP_ALIVE,
    lazy: WS_LAZY,
    retryDelayMs: websocketRetryDelayMs,
  };
}
