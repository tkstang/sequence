import { describe, expect, it } from 'vitest';

import {
  applyStreamItem,
  screenForState,
  type GameSnapshotView,
  type LoggedGameEvent,
} from './game-state.ts';

function snapshot(overrides: Partial<GameSnapshotView> = {}): GameSnapshotView {
  return {
    gameId: 'game-1',
    inviteCode: 'ABC123',
    status: 'lobby',
    playerCount: 2,
    mode: 'tap',
    timerSeconds: null,
    local: false,
    mySeat: 0,
    currentSeat: 0,
    round: 0,
    version: 0,
    board: {},
    sequences: [],
    players: [
      {
        seat: 0,
        team: 1,
        name: 'Host',
        isCreator: true,
        isGuest: false,
        connected: true,
      },
    ],
    teams: [1, 2],
    hand: [],
    ...overrides,
  };
}

function event(
  type: string,
  payload: Record<string, unknown>,
  version?: number,
): LoggedGameEvent {
  return { seq: 1, type, payload, version };
}

describe('game route view state', () => {
  it('starts from a snapshot and routes lobby state', () => {
    const state = applyStreamItem(null, {
      kind: 'snapshot',
      snapshot: snapshot(),
    });

    expect(state?.inviteCode).toBe('ABC123');
    expect(state?.players[0]?.name).toBe('Host');
    expect(screenForState(state)).toBe('lobby');
  });

  it('applies lobby events from a scripted stream', () => {
    let state = applyStreamItem(null, {
      kind: 'snapshot',
      snapshot: snapshot(),
    });

    state = applyStreamItem(state, {
      kind: 'event',
      event: event('PlayerJoined', {
        seat: 1,
        team: 2,
        name: 'Guest',
        isGuest: true,
      }),
    });
    state = applyStreamItem(state, {
      kind: 'event',
      event: event('TeamChanged', { seat: 1, team: 1 }),
    });

    expect(state?.players.map((p) => [p.name, p.team])).toEqual([
      ['Host', 1],
      ['Guest', 1],
    ]);
  });

  it('tracks private hand updates and live version changes', () => {
    let state = applyStreamItem(null, {
      kind: 'snapshot',
      snapshot: snapshot({ status: 'active', version: 1 }),
    });

    state = applyStreamItem(state, {
      kind: 'event',
      event: event(
        'HandUpdated',
        {
          seat: 0,
          hand: [
            { rank: 'A', suit: 'C' },
            { rank: 'K', suit: 'D' },
          ],
        },
        2,
      ),
    });
    state = applyStreamItem(state, {
      kind: 'event',
      event: event(
        'ChipPlaced',
        {
          seat: 0,
          team: 1,
          position: '1AC',
          card: { rank: 'A', suit: 'C' },
        },
        3,
      ),
    });

    expect(state?.version).toBe(3);
    expect(state?.hand).toEqual([{ rank: 'K', suit: 'D' }]);
    expect(state?.board['1AC']).toEqual({ chip: 1 });
  });

  it('routes local active games through handoff when veiled', () => {
    const state = applyStreamItem(null, {
      kind: 'snapshot',
      snapshot: snapshot({ status: 'active', local: true }),
    });

    expect(screenForState(state)).toBe('game');
    expect(screenForState(state, true)).toBe('handoff');
  });

  it('routes finished games to game-over', () => {
    const state = applyStreamItem(null, {
      kind: 'snapshot',
      snapshot: snapshot({ status: 'finished', winnerTeam: 1 }),
    });

    expect(screenForState(state)).toBe('game-over');
  });

  it('preserves GameConceded team attribution', () => {
    const state = applyStreamItem(
      applyStreamItem(null, {
        kind: 'snapshot',
        snapshot: snapshot({ status: 'active' }),
      }),
      {
        kind: 'event',
        event: event('GameConceded', { team: 2 }, 2),
      },
    );

    expect(state?.status).toBe('finished');
    expect(state?.endReason).toBe('concede');
    expect(state?.concededTeam).toBe(2);
  });

  it('keeps concede end reason when a two-team concede also emits GameWon', () => {
    let state = applyStreamItem(null, {
      kind: 'snapshot',
      snapshot: snapshot({ status: 'active' }),
    });
    state = applyStreamItem(state, {
      kind: 'event',
      event: event('GameConceded', { team: 2 }, 2),
    });
    state = applyStreamItem(state, {
      kind: 'event',
      event: event('GameWon', { team: 1 }, 3),
    });

    expect(state?.status).toBe('finished');
    expect(state?.winnerTeam).toBe(1);
    expect(state?.endReason).toBe('concede');
    expect(state?.concededTeam).toBe(2);
  });

  it('preserves pending choice metadata for chained selections', () => {
    const state = applyStreamItem(
      applyStreamItem(null, {
        kind: 'snapshot',
        snapshot: snapshot({ status: 'active' }),
      }),
      {
        kind: 'event',
        event: event('PendingChoice', {
          seat: 0,
          placed: '1AC',
          cells: ['1AC', '1KC', '1QC', '1JC', '1TC', '19C'],
          additionalRuns: [['2AC', '2KC', '2QC', '2JC', '2TC', '29C']],
        }),
      },
    );

    expect(state?.pendingChoice).toMatchObject({
      seat: 0,
      placed: '1AC',
      additionalRuns: [['2AC', '2KC', '2QC', '2JC', '2TC', '29C']],
    });
  });
});
