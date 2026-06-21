import type { Team } from '@sequence/game-logic';

/**
 * Lobby-phase events. These ride the same `game_events` log + subscription as
 * gameplay events (one multiplexed stream per design §Event stream contract),
 * but they are API-level (roster/lifecycle) rather than rules-engine events, so
 * they live here rather than in `@sequence/game-logic`.
 */
export type LobbyEvent =
  | {
      readonly type: 'PlayerJoined';
      readonly seat: number;
      readonly team: Team;
      readonly name: string;
      readonly isGuest: boolean;
    }
  | { readonly type: 'TeamChanged'; readonly seat: number; readonly team: Team }
  | { readonly type: 'PlayerKicked'; readonly seat: number }
  | { readonly type: 'GameStarted'; readonly currentSeat: number };

/** The serialized payload form (jsonb) — structurally identical. */
export type LobbyEventPayload = LobbyEvent;
