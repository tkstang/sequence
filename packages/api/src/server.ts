import cors from '@fastify/cors';
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';

import { type AppRouter, appRouter } from './app-router.ts';
import { createDb, type Database } from './db/client.ts';
import { type Env, getEnv } from './env.ts';
import { createContextFactory } from './trpc.ts';
import { type Auth, createAuth } from './user/auth.ts';

declare module 'fastify' {
  interface FastifyInstance {
    auth: Auth;
    db: Database;
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

  const app = Fastify({
    // Pino is Fastify's built-in logger. No hands/deck/PII ever logged.
    logger: options.logger ?? {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    // Better Auth and tRPC parse their own bodies on their routes.
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
  });

  // Decorate so downstream plugins (tRPC context, WS upgrade) reuse one auth/db.
  app.decorate('auth', auth);
  app.decorate('db', db);

  app.get('/health', async () => ({ status: 'ok' }));

  // Better Auth owns REST under /api/auth/* (not wrapped in tRPC). It exposes a
  // standard `Request -> Response` web handler, so we translate the Fastify
  // request into a Web Request and stream the Web Response back. This is
  // body-parser-agnostic (no raw-stream hijack), which keeps it compatible
  // with the tRPC HTTP plugin registered later.
  app.all('/api/auth/*', async (request, reply) => {
    const webRequest = toWebRequest(request, env);
    const webResponse = await auth.handler(webRequest);

    reply.status(webResponse.status);
    webResponse.headers.forEach((value, key) => {
      reply.header(key, value);
    });
    const body = webResponse.body
      ? Buffer.from(await webResponse.arrayBuffer())
      : null;
    return reply.send(body);
  });

  // tRPC over HTTP (queries + mutations). The WS transport for subscriptions
  // is added in p03-t06.
  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: createContextFactory({ db, auth }),
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
  });

  return app;
}

/** Build a WHATWG `Request` from a Fastify request for Better Auth. */
function toWebRequest(request: FastifyRequest, env: Env): Request {
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
