/**
 * Game creation: deal hands and derive alternating-team turn order.
 *
 * Deal table (official rules): 2p → 7, 3p → 6, 4p → 6, 6p → 5.
 * Turn order alternates teams (4p: 1 2 1 2; 6p/3-team: 1 2 3 1 2 3); the digital
 * analogue of alternating physical seats. 3-player is three single-player teams.
 */

import { buildDeck, shuffle, type Rng } from './deck.ts';
import type {
  Card,
  GameSettings,
  GameState,
  PlayerCount,
  PlayerSeed,
  Team,
} from './types.ts';

const DEAL_TABLE: Readonly<Record<PlayerCount, number>> = {
  2: 7,
  3: 6,
  4: 6,
  6: 5,
};

const SUPPORTED_COUNTS: readonly PlayerCount[] = [2, 3, 4, 6];

/** Number of distinct teams for a given player count. */
function teamCountFor(playerCount: PlayerCount): number {
  // 3-player is a 3-team free-for-all; everything else is two teams.
  return playerCount === 3 || playerCount === 6 ? 3 : 2;
}

/**
 * Arrange seeds into alternating-team turn order. Players are grouped by team,
 * then dealt round-robin across teams so consecutive seats are different teams.
 */
function alternatingOrder(
  players: readonly PlayerSeed[],
  teamCount: number,
): Team[] {
  const byTeam = new Map<Team, number>();
  for (const p of players) {
    byTeam.set(p.team, (byTeam.get(p.team) ?? 0) + 1);
  }

  // Each team must contribute the same number of players.
  const sizes = [...byTeam.values()];
  const perTeam = sizes[0]!;
  if (byTeam.size !== teamCount || sizes.some((s) => s !== perTeam)) {
    throw new Error(
      `uneven teams: expected ${teamCount} equal teams, got ${[
        ...byTeam.entries(),
      ]
        .map(([t, n]) => `${t}:${n}`)
        .join(', ')}`,
    );
  }

  const order: Team[] = [];
  for (let round = 0; round < perTeam; round++) {
    for (let team = 1 as Team; team <= teamCount; team = (team + 1) as Team) {
      order.push(team);
    }
  }
  return order;
}

export function createGame(
  settings: GameSettings,
  players: readonly PlayerSeed[],
  rng: Rng,
): GameState {
  const { playerCount } = settings;

  if (!SUPPORTED_COUNTS.includes(playerCount)) {
    throw new Error(`unsupported player count: ${playerCount}`);
  }
  if (players.length !== playerCount) {
    throw new Error(
      `seed count ${players.length} does not match player count ${playerCount}`,
    );
  }

  const teamCount = teamCountFor(playerCount);
  const teams = alternatingOrder(players, teamCount);

  const deck = shuffle(buildDeck(), rng);
  const handSize = DEAL_TABLE[playerCount];

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let cursor = 0;
  // Deal round-robin (one card per seat per pass) — matches physical dealing.
  for (let card = 0; card < handSize; card++) {
    for (let seat = 0; seat < playerCount; seat++) {
      hands[seat]!.push(deck[cursor]!);
      cursor++;
    }
  }

  return {
    settings,
    status: 'active',
    board: new Map(),
    hands,
    deck: deck.slice(cursor),
    played: [],
    sequences: [],
    teams,
    currentSeat: 0,
    round: 1,
    nextSequenceId: 1,
  };
}
