'use client';

import type { Position } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';

import { Card } from '@/components/card.tsx';
import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

import type { PendingChoiceView } from '../../game-state.ts';

const REQUIRED_CELLS = 5;

// Selection accent yellow, matching the board highlight/pin color.
const ACCENT_YELLOW = '#fde047';

const styles = stylex.create({
  card: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: 'min(94vw, 680px)',
    flexDirection: 'column',
    gap: space.md,
    padding: space.lg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: ACCENT_YELLOW,
    borderRadius: radius.xl,
    backgroundColor: color.frozenBg,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    color: color.text,
  },
  count: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: color.textMuted,
  },
  confirm: {
    borderWidth: 0,
    borderRadius: radius.md,
    paddingInline: space.lg,
    paddingBlock: space.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    backgroundColor: {
      default: color.teamGreen,
      ':disabled': color.slateSoft,
    },
    color: { default: color.textOnDark, ':disabled': color.textFaint },
    transitionProperty: 'background-color, color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  cellGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chipBtn: {
    borderRadius: radius.md,
    borderWidth: '1px',
    borderStyle: 'solid',
    paddingInline: space.sm,
    paddingBlock: space.xs,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  chipSelected: {
    borderColor: color.teamGreen,
    backgroundColor: color.teamGreen,
    color: color.textOnDark,
  },
  chipUnselected: {
    borderColor: color.border,
    backgroundColor: color.surface,
    color: color.textMuted,
  },
  chipPinned: {
    boxShadow: `0 0 0 2px ${ACCENT_YELLOW}`,
  },
});

export function initialChoiceSelection(
  pendingChoice?: PendingChoiceView,
): Position[] {
  return pendingChoice?.placed ? [pendingChoice.placed] : [];
}

export function toggleChoiceCell(
  selectedCells: readonly Position[],
  cell: Position,
  pendingChoice: PendingChoiceView,
): Position[] {
  if (!pendingChoice.cells.includes(cell)) return [...selectedCells];
  if (pendingChoice.placed === cell) {
    return selectedCells.includes(cell)
      ? [...selectedCells]
      : [cell, ...selectedCells].slice(0, REQUIRED_CELLS);
  }
  if (selectedCells.includes(cell)) {
    return selectedCells.filter((selected) => selected !== cell);
  }
  if (selectedCells.length >= REQUIRED_CELLS) return [...selectedCells];
  return [...selectedCells, cell];
}

export interface SequenceChoiceProps {
  pendingChoice: PendingChoiceView;
  selectedCells: readonly Position[];
  isActor: boolean;
  actorName: string;
  isSubmitting?: boolean;
  onToggleCell: (cell: Position) => void;
  onConfirm: (cells: Position[]) => void;
}

export function SequenceChoice({
  pendingChoice,
  selectedCells,
  isActor,
  actorName,
  isSubmitting = false,
  onToggleCell,
  onConfirm,
}: SequenceChoiceProps) {
  const selected = new Set(selectedCells);
  const ready = selectedCells.length === REQUIRED_CELLS;
  const queued = pendingChoice.additionalRuns?.length ?? 0;
  const cardProps = stylex.props(styles.card);

  return (
    <Card className={cardProps.className} style={cardProps.style}>
      <div {...stylex.props(styles.header)}>
        <div>
          <p {...stylex.props(styles.title)}>
            {isActor ? 'Choose sequence' : `${actorName} choosing`}
          </p>
          <p {...stylex.props(styles.count)}>
            {selectedCells.length}/{REQUIRED_CELLS}
            {queued > 0 ? ` - ${queued} next` : ''}
          </p>
        </div>
        {isActor ? (
          <button
            type="button"
            disabled={!ready || isSubmitting}
            onClick={() => onConfirm([...selectedCells])}
            {...stylex.props(styles.confirm)}
          >
            Confirm
          </button>
        ) : null}
      </div>
      <div {...stylex.props(styles.cellGrid)}>
        {pendingChoice.cells.map((cell) => {
          const isSelected = selected.has(cell);
          const isPinned = pendingChoice.placed === cell;
          return (
            <button
              key={cell}
              type="button"
              disabled={!isActor}
              aria-pressed={isSelected}
              onClick={() => onToggleCell(cell)}
              {...stylex.props(
                styles.chipBtn,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                isPinned && styles.chipPinned,
              )}
            >
              {cell}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
