'use client';

import type { Position } from '@sequence/game-logic';

import { Card } from '@/components/card.tsx';

import type { PendingChoiceView } from '../../game-state.ts';

const REQUIRED_CELLS = 5;

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

  return (
    <Card className="mx-auto flex w-full max-w-[min(94vw,680px)] flex-col gap-3 border-yellow-300 bg-yellow-50">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-black">
            {isActor ? 'Choose sequence' : `${actorName} choosing`}
          </p>
          <p className="text-xs font-medium text-black/60">
            {selectedCells.length}/{REQUIRED_CELLS}
            {queued > 0 ? ` - ${queued} next` : ''}
          </p>
        </div>
        {isActor ? (
          <button
            type="button"
            disabled={!ready || isSubmitting}
            onClick={() => onConfirm([...selectedCells])}
            className="bg-team-green disabled:bg-slate/30 rounded-md px-4 py-2 text-sm font-bold text-white disabled:text-black/40"
          >
            Confirm
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
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
              className={`rounded-md border px-2.5 py-1.5 text-xs font-bold ${
                isSelected
                  ? 'border-team-green bg-team-green text-white'
                  : 'border-black/15 bg-white text-black/70'
              } ${isPinned ? 'ring-2 ring-yellow-400' : ''}`}
            >
              {cell}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
