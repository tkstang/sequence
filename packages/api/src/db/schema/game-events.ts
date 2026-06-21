import {
  bigint,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { games } from './games.ts';

/**
 * `game_events` — the event log. Triple duty: move log (FR requirement),
 * subscription resume cursor (`lastEventId` = `seq`), and future replay.
 *
 * Events store full truth server-side (including draws); the subscription
 * layer redacts per recipient at broadcast — one source of truth, privacy at
 * the edge. `seq` is a per-game monotonic counter assigned by the append
 * helper (p04-t01) inside the move transaction.
 */
export const gameEvents = pgTable(
  'game_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    seq: bigint('seq', { mode: 'number' }).notNull(),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull(),
    actorSeat: smallint('actor_seat'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('game_events_game_seq_idx').on(table.gameId, table.seq),
  ],
);

export type GameEventRow = typeof gameEvents.$inferSelect;
export type NewGameEventRow = typeof gameEvents.$inferInsert;
