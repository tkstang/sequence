/**
 * Game creation: deal hands and derive alternating-team turn order.
 *
 * Deal table (official rules): 2p → 7, 3p → 6, 4p → 6, 6p → 5.
 * Turn order is taken directly from the seeds' seat/team assignment (the lobby
 * self-sorts), validated to alternate teams (4p: 1 2 1 2; 6p/3-team: 1 2 3 1 2 3).
 * 3-player is three single-player teams; 6-player may be 3v3 (2 teams) or 2x3
 * (3 teams) — whichever the seeds express.
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

/**
 * Legal distinct-team counts per player count (official rules):
 *  - 2p → 2 teams of 1
 *  - 3p → 3 teams of 1 (free-for-all)
 *  - 4p → 2 teams of 2
 *  - 6p → 2 teams of 3 (3v3) OR 3 teams of 2 (2x3) — chosen by the seeds
 */
const LEGAL_TEAM_COUNTS: Readonly<Record<PlayerCount, readonly number[]>> = {
  2: [2],
  3: [3],
  4: [2],
  6: [2, 3],
};

/**
 * Build the seat-ordered team list from the seeds, honoring the explicit
 * seat/team assignment (the lobby self-sort is the product feature — we never
 * silently remap). Validates:
 *  - one seed per seat 0..N-1 (no gaps / duplicates)
 *  - team ids contiguous from 1
 *  - distinct-team count legal for the player count
 *  - even teams (each team the same size) for non-FFA games
 *  - seats alternate teams (no two consecutive seats on the same team)
 */
function seatOrderedTeams(players: readonly PlayerSeed[]): Team[] {
  const count = players.length;

  // Exactly one seed per seat 0..count-1.
  const bySeat = Array.from<Team | undefined>({ length: count }).fill(
    undefined,
  );
  for (const p of players) {
    if (p.seat < 0 || p.seat >= count || !Number.isInteger(p.seat)) {
      throw new Error(`seat out of range: ${p.seat}`);
    }
    if (bySeat[p.seat] !== undefined) {
      throw new Error(`duplicate seat: ${p.seat}`);
    }
    bySeat[p.seat] = p.team;
  }
  const teams = bySeat as Team[];
  if (teams.some((t) => t === undefined)) {
    throw new Error('seats are not contiguous from 0');
  }

  // Team ids contiguous from 1.
  const distinct = [...new Set(teams)].toSorted((a, b) => a - b);
  const teamCount = distinct.length;
  for (let i = 0; i < teamCount; i++) {
    if (distinct[i] !== ((i + 1) as Team)) {
      throw new Error(
        `team ids must be contiguous from 1, got ${distinct.join(', ')}`,
      );
    }
  }

  // Distinct-team count legal for this player count.
  const legal = LEGAL_TEAM_COUNTS[count as PlayerCount];
  if (!legal.includes(teamCount)) {
    throw new Error(
      `illegal team count ${teamCount} for ${count} players (allowed: ${legal.join(
        ', ',
      )})`,
    );
  }

  // Even teams (each team the same size).
  const sizes = new Map<Team, number>();
  for (const t of teams) sizes.set(t, (sizes.get(t) ?? 0) + 1);
  const perTeam = count / teamCount;
  if ([...sizes.values()].some((s) => s !== perTeam)) {
    throw new Error(
      `uneven teams: expected ${teamCount} teams of ${perTeam}, got ${[
        ...sizes.entries(),
      ]
        .map(([t, n]) => `${t}:${n}`)
        .join(', ')}`,
    );
  }

  // Seats alternate teams (no two consecutive seats share a team). With even
  // teams and contiguous team ids this matches the physical alternating layout.
  for (let i = 1; i < teams.length; i++) {
    if (teams[i] === teams[i - 1]) {
      throw new Error(
        `non-alternating turn order at seat ${i}: team ${teams[i]} follows team ${teams[i - 1]}`,
      );
    }
  }

  return teams;
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

  const teams = seatOrderedTeams(players);

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
