import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';

import { type AppRouter, appRouter } from './app-router.ts';
import { createDb, type Database } from './db/client.ts';
import { type Env, getEnv } from './env.ts';
import { setTimerHook } from './game/move-engine.ts';
import { PresenceTracker, setPresenceHook } from './game/presence.ts';
import { TimerService } from './game/TimerService.ts';
import { rooms } from './shared/realtime/rooms.ts';
import { createContextFactory } from './trpc.ts';
import { type Auth, createAuth } from './user/auth.ts';

declare module 'fastify' {
  interface FastifyInstance {
    auth: Auth;
    db: Database;
    timers: TimerService;
  }
}

export interface BuildServerOptions {
  /** Pre-validated environment. Defaults to {@link getEnv}. */
  env?: Env;
  /** Override Fastify logger config (tests pass `false`). */
  logger?: boolean;
  /** Inject a database (tests pass a test-branch db). Defaults to `env.DATABASE_URL`. */
  db?: Database;
  /** Inject an auth instance. Defaults to one built over {@link BuildServerOptions.db}. */
  auth?: Auth;
  /** Max requests per IP in the auth-route window (default 20 / 1 min). Tests lower this. */
  authRateLimitMax?: number;
}

/**
 * Construct the Fastify instance with logging, CORS, and the health route.
 *
 * Kept as a factory (no top-level listen) so integration tests can boot the
 * app in-process via `app.inject` / `app.listen({ port: 0 })`.
 */
export async function buildServer(
  options: BuildServerOptions = {},
): Promise<FastifyInstance> {
  const env = options.env ?? getEnv();
  const db = options.db ?? createDb(env.DATABASE_URL).db;
  const auth = options.auth ?? createAuth(db, env);

  // Resolve client IPs from the edge proxy's `X-Forwarded-For`. Railway sits
  // behind a trusted edge proxy, so without this `request.ip` is the proxy
  // address and per-IP rate limiting collapses to one shared bucket. Env-gated
  // (`TRUST_PROXY`); defaults on in production, off elsewhere so a direct,
  // non-proxied deploy is not spoofable via a forged XFF header.
  const trustProxy = env.TRUST_PROXY ?? env.NODE_ENV === 'production';

  const app = Fastify({
    // Pino is Fastify's built-in logger. No hands/deck/PII ever logged.
    logger: options.logger ?? {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    // Better Auth and tRPC parse their own bodies on their routes.
    disableRequestLogging: env.NODE_ENV === 'test',
    trustProxy,
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
  });

  // I3: stamp the resolved client IP onto the raw request so the tRPC **WS**
  // context can read it. The @fastify/websocket + tRPC adapter hands the WS
  // createContext the bare Node `IncomingMessage` (no `.ip`), so without this
  // every WS caller would share one rate-limit bucket. `onRequest` runs on the
  // upgrade request (before the protocol switch) while `request.ip` is still
  // resolved by Fastify (honoring trustProxy); copying it to `req.raw.ip` makes
  // it available to `resolveClientIp` on the socket side.
  app.addHook('onRequest', async (request) => {
    (request.raw as { ip?: string }).ip = request.ip;
  });

  // Rate limiting registered globally but OFF by default (`global: false`) —
  // only routes that opt in via `config.rateLimit` are limited. We scope it to
  // the auth endpoints (threat: credential stuffing / invite-code enumeration
  // on adjacent public routes). preview/join get a tRPC-side limiter in p04.
  const authRateLimitMax = options.authRateLimitMax ?? 20;
  await app.register(rateLimit, { global: false });

  // WebSocket support for tRPC subscriptions. Registered before the tRPC
  // plugin so `useWSS: true` can attach to the same HTTP server. The upgrade
  // request carries the Better Auth session cookie (and, for guests, the
  // game-scoped cookie), so WS authenticates from the same cookie jar as HTTP.
  await app.register(fastifyWebsocket);

  // Decorate so downstream plugins (tRPC context, WS upgrade) reuse one auth/db.
  app.decorate('auth', auth);
  app.decorate('db', db);

  app.get('/health', async () => ({ status: 'ok' }));

  // Better Auth owns REST under /api/auth/* (not wrapped in tRPC). It exposes a
  // standard `Request -> Response` web handler, so we translate the Fastify
  // request into a Web Request and stream the Web Response back. This is
  // body-parser-agnostic (no raw-stream hijack), which keeps it compatible
  // with the tRPC HTTP plugin registered later.
  app.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    url: '/api/auth/*',
    config: {
      rateLimit: { max: authRateLimitMax, timeWindow: '1 minute' },
    },
    async handler(request, reply) {
      const webRequest = toWebRequest(request, env);
      const webResponse = await auth.handler(webRequest);
      return sendWebResponse(reply, webResponse);
    },
  });

  // tRPC over HTTP (queries + mutations) and WS (subscriptions) on one prefix.
  // `useWSS: true` reuses the @fastify/websocket server. A ~20s keepAlive ping
  // both satisfies tRPC liveness and neutralizes Railway's WS idle drops; the
  // disconnect/heartbeat → freeze lifecycle is layered on in p04.
  // The fastify adapter reads `trpcOptions.keepAlive` at runtime but its public
  // type does not yet surface the field, so we extend the typed options.
  const trpcOptions: FastifyTRPCPluginOptions<AppRouter>['trpcOptions'] & {
    keepAlive: { enabled: boolean; pingMs: number; pongWaitMs: number };
  } = {
    router: appRouter,
    createContext: createContextFactory({
      db,
      auth,
      guestSecret: env.BETTER_AUTH_SECRET,
    }),
    // ~20s ping satisfies tRPC liveness and neutralizes Railway WS idle drops.
    keepAlive: { enabled: true, pingMs: 20_000, pongWaitMs: 5_000 },
  };

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    useWSS: true,
    trpcOptions,
  } satisfies FastifyTRPCPluginOptions<AppRouter>);

  // Turn timers (FR8): wire the engine's turn-start hook to the TimerService and
  // rehydrate any live deadlines from the DB so a redeploy can't strand a timed
  // game. The service is decorated so presence (p04-t10) can pause/resume it.
  const timers = new TimerService(db);
  setTimerHook({
    onTurnCommitted({
      gameId,
      timerSeconds,
      version,
      pendingChoice,
      finished,
    }) {
      if (finished) {
        timers.clear(gameId);
        return;
      }
      void timers.scheduleTurn(gameId, timerSeconds, version, {
        pendingChoice,
      });
    },
  });
  app.decorate('timers', timers);
  await timers.rehydrate();

  // Presence (FR9): the subscription route reports per-seat connect/disconnect
  // through this hook → freeze on a drop, resume when the full roster is back.
  const presence = new PresenceTracker({ db, rooms, timers });
  setPresenceHook({
    onConnect(gameId, seat) {
      void presence.markConnected(gameId, seat);
    },
    onDisconnect(gameId, seat) {
      void presence.markDisconnected(gameId, seat);
    },
  });

  app.addHook('onClose', async () => {
    timers.clearAll();
    setPresenceHook(null);
    setTimerHook(null);
  });

  return app;
}

/**
 * Build a WHATWG `Request` from a Fastify request for Better Auth.
 *
 * Exported so the integration harness reuses the exact same bridge instead of
 * maintaining a second copy that could drift (m2).
 */
export function toWebRequest(request: FastifyRequest, env: Env): Request {
  const url = new URL(request.url, env.BETTER_AUTH_URL);
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    // We re-serialize the body below, so let the Request recompute length.
    if (key.toLowerCase() === 'content-length') continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  // Fastify has already parsed the body (e.g. JSON) — re-serialize it so the
  // content-type header still matches what Better Auth's zod parser expects.
  const body =
    hasBody && request.body !== undefined && request.body !== null
      ? typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body)
      : undefined;

  return new Request(url, { method, headers, body });
}

/**
 * Stream a WHATWG `Response` (from Better Auth) back through a Fastify reply.
 * Exported alongside {@link toWebRequest} so the harness shares one bridge (m2).
 */
export async function sendWebResponse(
  reply: FastifyReply,
  webResponse: Response,
): Promise<FastifyReply> {
  reply.status(webResponse.status);
  webResponse.headers.forEach((value, key) => {
    reply.header(key, value);
  });
  const body = webResponse.body
    ? Buffer.from(await webResponse.arrayBuffer())
    : null;
  return reply.send(body);
}

/**
 * Boot entrypoint: validate env, build the server, and listen.
 */
export async function start(): Promise<FastifyInstance> {
  const env = getEnv();
  const app = await buildServer({ env });
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  return app;
}

// Run when executed directly (`node src/server.ts` / `tsx`), not when imported.
if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err: unknown) => {
    process.stderr.write(`${String(err)}\n`);
    process.exit(1);
  });
}
