import {
  boolean,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import type { CardJson } from './games.ts';
import { games } from './games.ts';

/**
 * `game_players` — one row per seat. Hands live here because the privacy
 * boundary matches the table boundary: a player's hand never leaves their own
 * row except through the redacted subscription stream.
 *
 * A seat is either a registered user (`user_id`) or a guest
 * (`guest_name` + `guest_token_hash`). A local-game (FR16) seat 2 is a
 * `guest_name` with no `user_id` and no token — the creator's session covers
 * both seats. `user_id` references Better Auth's `user.id` at the application
 * layer (that table is generated in p03-t04).
 */
export const gamePlayers = pgTable(
  'game_players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    seat: smallint('seat').notNull(),
    team: smallint('team').notNull(),

    // Identity: either a user or a guest.
    userId: text('user_id'),
    guestName: text('guest_name'),
    guestTokenHash: text('guest_token_hash'),

    // Private hand.
    hand: jsonb('hand').$type<CardJson[]>(),

    // Presence.
    connected: boolean('connected').notNull().default(false),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    isCreator: boolean('is_creator').notNull().default(false),
  },
  (table) => [
    uniqueIndex('game_players_game_seat_idx').on(table.gameId, table.seat),
    index('game_players_user_game_idx').on(table.userId, table.gameId),
  ],
);

export type GamePlayerRow = typeof gamePlayers.$inferSelect;
export type NewGamePlayerRow = typeof gamePlayers.$inferInsert;
