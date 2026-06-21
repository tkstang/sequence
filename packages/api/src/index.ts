/**
 * @sequence/api — Fastify 5 + tRPC 11 host for the Sequence game.
 *
 * `AppRouter` is the multi-client contract surface: the web app (and the future
 * RN app) import it **type-only** to type their tRPC client. Re-exported here so
 * `import type { AppRouter } from '@sequence/api'` resolves at the package root
 * without reaching into `src/app-router.ts`.
 */
export type { AppRouter } from './app-router.ts';

export const PACKAGE_NAME = '@sequence/api';
