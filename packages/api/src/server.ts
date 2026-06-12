import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { type Env, getEnv } from './env.ts';

export interface BuildServerOptions {
  /** Pre-validated environment. Defaults to {@link getEnv}. */
  env?: Env;
  /** Override Fastify logger config (tests pass `false`). */
  logger?: boolean;
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

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
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
