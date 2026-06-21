import postgres from 'postgres';

/**
 * Cross-file serialization for integration tests that share one Neon test
 * branch.
 *
 * The vitest **workspace** runner can execute the API's integration test files
 * in parallel workers; since they all `TRUNCATE` the same shared tables, an
 * unguarded interleave corrupts another file's in-flight fixtures (e.g. a
 * Better Auth `linkAccount` fails its FK because a sibling file truncated
 * `user` mid-test). A Postgres session-level **advisory lock**, held for the
 * lifetime of a test file, makes the files run one-at-a-time at the DB level —
 * independent of how vitest schedules them.
 */

// Arbitrary but stable lock key shared by every integration file.
const LOCK_KEY = 4_815_162_342;

export interface DbLock {
  release(): Promise<void>;
}

/**
 * Acquire the global integration advisory lock on a dedicated connection.
 * Blocks until the lock is free, so concurrent files queue rather than race.
 *
 * @param connectionString - the test-branch connection string.
 */
export async function acquireDbLock(connectionString: string): Promise<DbLock> {
  // A single-connection client: pg_advisory_lock is session-scoped, so the
  // lock lives exactly as long as this connection.
  const client = postgres(connectionString, { max: 1 });
  await client`select pg_advisory_lock(${LOCK_KEY})`;
  return {
    async release() {
      await client`select pg_advisory_unlock(${LOCK_KEY})`;
      await client.end();
    },
  };
}
