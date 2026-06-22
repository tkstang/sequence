'use client';

import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/button.tsx';
import { space } from '@/styles/tokens.stylex.ts';

type PendingAction = 'save' | 'concede' | null;

const styles = stylex.create({
  controls: {
    marginInline: 'auto',
    display: { default: 'grid', '@media (min-width: 640px)': 'flex' },
    width: '100%',
    maxWidth: 'min(94vw, 680px)',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: space.sm,
    alignItems: { '@media (min-width: 640px)': 'center' },
    justifyContent: { '@media (min-width: 640px)': 'flex-end' },
  },
});

export interface ActiveGameControlsProps {
  isSaving: boolean;
  isConceding: boolean;
  onSaveAndExit: () => void;
  onConcede: () => void;
}

export function ActiveGameControls({
  isSaving,
  isConceding,
  onSaveAndExit,
  onConcede,
}: ActiveGameControlsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  function confirmSave() {
    setPendingAction(null);
    onSaveAndExit();
  }

  function confirmConcede() {
    setPendingAction(null);
    onConcede();
  }

  return (
    <section
      aria-label="Game lifecycle controls"
      {...stylex.props(styles.controls)}
    >
      {pendingAction === 'save' ? (
        <>
          <Button
            variant="secondary"
            onClick={() => setPendingAction(null)}
            disabled={isSaving || isConceding}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmSave}
            disabled={isSaving || isConceding}
          >
            Confirm save
          </Button>
        </>
      ) : pendingAction === 'concede' ? (
        <>
          <Button
            variant="secondary"
            onClick={() => setPendingAction(null)}
            disabled={isSaving || isConceding}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmConcede}
            disabled={isSaving || isConceding}
          >
            Confirm concede
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            onClick={() => setPendingAction('save')}
            disabled={isSaving}
            aria-label={isSaving ? 'Saving game' : 'Save and exit'}
          >
            {isSaving ? 'Saving...' : 'Save & exit'}
          </Button>
          <Button
            variant="danger"
            onClick={() => setPendingAction('concede')}
            disabled={isConceding}
          >
            {isConceding ? 'Conceding...' : 'Concede'}
          </Button>
        </>
      )}
    </section>
  );
}
