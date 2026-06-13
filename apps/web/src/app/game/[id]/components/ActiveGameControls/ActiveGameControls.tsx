'use client';

import { useState } from 'react';

import { Button } from '@/components/button.tsx';

type PendingAction = 'save' | 'concede' | null;

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
      className="mx-auto grid w-full max-w-[min(94vw,680px)] grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end"
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
