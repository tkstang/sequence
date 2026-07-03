import type { SnapshotBoardCell } from '@sequence/client-state';
import type { Card, Position, Team } from '@sequence/game-logic';
import { validPlacements } from '@sequence/game-logic';

export interface BoardSpotlightInput {
  readonly board: Readonly<Record<Position, SnapshotBoardCell | undefined>>;
  readonly currentTeam?: Team | null;
  readonly selectedCard?: Card | null;
}

export interface BoardSpotlight {
  readonly active: boolean;
  readonly targets: ReadonlySet<Position>;
}

export function createBoardSpotlight({
  board,
  currentTeam,
  selectedCard,
}: BoardSpotlightInput): BoardSpotlight {
  if (!selectedCard || currentTeam === undefined || currentTeam === null) {
    return { active: false, targets: new Set<Position>() };
  }

  const placements = validPlacements(
    [selectedCard],
    snapshotBoardToRulesBoard(board),
    currentTeam,
  );

  return {
    active: true,
    targets: new Set(placements.get(selectedCard) ?? []),
  };
}

export function isSpotlightTarget(
  spotlight: BoardSpotlight,
  position: Position,
): boolean {
  return spotlight.active && spotlight.targets.has(position);
}

export function isSpotlightDimmed(
  spotlight: BoardSpotlight,
  position: Position,
): boolean {
  return spotlight.active && !spotlight.targets.has(position);
}

function snapshotBoardToRulesBoard(
  board: Readonly<Record<Position, SnapshotBoardCell | undefined>>,
): ReadonlyMap<Position, SnapshotBoardCell> {
  const entries: Array<[Position, SnapshotBoardCell]> = [];
  for (const [position, cell] of Object.entries(board)) {
    if (cell !== undefined) {
      entries.push([position as Position, cell]);
    }
  }
  return new Map(entries);
}
