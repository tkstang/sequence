/**
 * Schema barrel — re-exports every table so the Drizzle client and
 * `drizzle-kit` see one canonical schema object.
 *
 * Better Auth tables (`user`, `session`, `account`, `verification`) are added
 * in p03-t04.
 */
export * from './games.ts';
export * from './game-players.ts';
export * from './game-events.ts';
