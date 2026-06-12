/**
 * The Sequence board layout, salvaged verbatim from the legacy implementation
 * (`utils/game.js`, retrievable at the `legacy-final` git tag).
 *
 * Each cell is a position code: a leading copy index (1–4) followed by either
 * `WW` (a wild corner — free space, counts for any team) or a two-character
 * card code (`rank` + `suit`). Ranks use `T` for ten; jacks never appear on
 * the board (they are wild cards in hand). The copy index disambiguates the
 * two physical copies of each card on the 10×10 board.
 */

export const BOARD_SIZE = 10;

/** A raw board position code, e.g. `'1AC'` (Ace of Clubs) or `'1WW'` (corner). */
export type PositionId = string;

export type BoardRank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'T'
  | 'Q'
  | 'K';

export type BoardSuit = 'C' | 'D' | 'H' | 'S';

export type ParsedBoardCell =
  | { kind: 'corner' }
  | { kind: 'card'; rank: BoardRank; suit: BoardSuit };

// prettier-ignore
export const BOARD_MAP: readonly (readonly PositionId[])[] = [
  ['1WW', '1AC', '1KC', '1QC', '1TC', '19C', '18C', '17C', '16C', '2WW'],
  ['1AD', '17S', '18S', '19S', '1TS', '1QS', '1KS', '1AS', '15C', '12S'],
  ['1KD', '16S', '2TC', '29C', '28C', '27C', '26C', '12D', '14C', '13S'],
  ['1QD', '15S', '2QC', '18H', '17H', '16H', '25C', '13D', '13C', '14S'],
  ['1TD', '24S', '2KC', '19H', '12H', '15H', '24C', '14D', '12C', '25S'],
  ['19D', '23S', '2AC', '1TH', '13H', '14H', '23C', '15D', '1AH', '26S'],
  ['18D', '22S', '2AD', '1QH', '1KH', '2AH', '22C', '16D', '2KH', '27S'],
  ['17D', '22H', '2KD', '2QD', '2TD', '29D', '28D', '27D', '2QH', '28S'],
  ['26D', '23H', '24H', '25H', '26H', '27H', '28H', '29H', '2TH', '29S'],
  ['3WW', '25D', '24D', '23D', '22D', '2AS', '2KS', '2QS', '2TS', '4WW'],
] as const;

const RANKS = new Set<BoardRank>([
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'Q',
  'K',
]);

const SUITS = new Set<BoardSuit>(['C', 'D', 'H', 'S']);

/** A board coordinate (row, col), zero-based, row 0 = top. */
export interface Coord {
  readonly row: number;
  readonly col: number;
}

/** Position code → coordinate, built once from {@link BOARD_MAP}. */
const COORDS: ReadonlyMap<PositionId, Coord> = (() => {
  const map = new Map<PositionId, Coord>();
  for (let row = 0; row < BOARD_MAP.length; row++) {
    const cells = BOARD_MAP[row]!;
    for (let col = 0; col < cells.length; col++) {
      map.set(cells[col]!, { row, col });
    }
  }
  return map;
})();

/** All position codes (flattened board), in row-major order. */
export const ALL_POSITIONS: readonly PositionId[] = BOARD_MAP.flat();

/** Card code (`rank`+`suit`, e.g. `'AC'`) → its two board position codes. */
const CARD_POSITIONS: ReadonlyMap<string, readonly PositionId[]> = (() => {
  const map = new Map<string, PositionId[]>();
  for (const position of ALL_POSITIONS) {
    const parsed = parseBoardCell(position);
    if (parsed.kind === 'corner') continue;
    const code = `${parsed.rank}${parsed.suit}`;
    const list = map.get(code);
    if (list) {
      list.push(position);
    } else {
      map.set(code, [position]);
    }
  }
  return map;
})();

/**
 * The two board cells a card (by rank+suit) can be placed on. Returns an empty
 * array for cards that never appear on the board (jacks).
 */
export function boardCellsFor(
  rank: BoardRank | 'J',
  suit: BoardSuit,
): readonly PositionId[] {
  return CARD_POSITIONS.get(`${rank}${suit}`) ?? [];
}

/** Look up a position's coordinate. Throws on an unknown code. */
export function coordOf(position: PositionId): Coord {
  const coord = COORDS.get(position);
  if (!coord) {
    throw new Error(`unknown board position: ${position}`);
  }
  return coord;
}

/** The position code at a coordinate, or `undefined` if off-board. */
export function positionAt(row: number, col: number): PositionId | undefined {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return undefined;
  }
  return BOARD_MAP[row]![col];
}

/** True when the position code denotes a wild corner (free) cell. */
export function isCorner(position: PositionId): boolean {
  return position.slice(1) === 'WW';
}

/**
 * Parse a board position code into its corner/card meaning, dropping the
 * leading copy index.
 */
export function parseBoardCell(position: PositionId): ParsedBoardCell {
  if (isCorner(position)) {
    return { kind: 'corner' };
  }

  const rank = position[1] as BoardRank;
  const suit = position[2] as BoardSuit;

  if (!RANKS.has(rank) || !SUITS.has(suit)) {
    throw new Error(`Invalid board position code: ${position}`);
  }

  return { kind: 'card', rank, suit };
}
