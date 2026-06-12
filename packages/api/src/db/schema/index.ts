/**
 * Schema barrel — re-exports every table so the Drizzle client and
 * `drizzle-kit` see one canonical schema object.
 *
 * Tables are added per task: games / game-players / game-events (p03-t03),
 * Better Auth tables (p03-t04). Until then this barrel is intentionally empty
 * but present so `createDb` and `drizzle.config.ts` have a stable import.
 */

/** Placeholder marker; replaced by table re-exports in p03-t03. */
export const SCHEMA_VERSION = 0;
