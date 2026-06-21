import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import * as schema from './schema/index.ts';

export type Schema = typeof schema;
export type Database = PostgresJsDatabase<Schema>;

/**
 * Create a postgres.js connection and a Drizzle instance over it.
 *
 * A small fixed pool (≤10) against a direct Neon connection string — the game
 * is a single-writer-per-row, low-concurrency workload, so a large pool buys
 * nothing. Returns both so callers (app, tests, migrations) can close the
 * underlying socket deterministically.
 *
 * @param connectionString - direct Postgres connection string.
 */
export function createDb(connectionString: string): {
  db: Database;
  sql: Sql;
} {
  const sql = postgres(connectionString, {
    max: 10,
    // postgres.js prepares by default; Neon's pooled endpoints reject prepared
    // statements, but we connect on the direct endpoint, so prepare stays on.
  });
  const db = drizzle(sql, { schema });
  return { db, sql };
}
