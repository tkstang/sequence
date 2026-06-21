'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { CardHand } from '@/app/game/[id]/components/CardHand/CardHand.tsx';
import {
  createTapSelection,
  deadCardIndexes,
} from '@/app/game/[id]/components/controllers/tap-controller.ts';
import {
  getGameFixture,
  winningSequenceCells,
} from '@/app/game/[id]/components/game-fixtures.ts';
import { GameBoard } from '@/app/game/[id]/components/GameBoard/GameBoard.tsx';
import { GameOver } from '@/app/game/[id]/components/GameOver/GameOver.tsx';
import { HandoffScreen } from '@/app/game/[id]/components/HandoffScreen/HandoffScreen.tsx';
import { LobbyTeams } from '@/app/game/[id]/components/LobbyTeams/LobbyTeams.tsx';
import { PlayerRail } from '@/app/game/[id]/components/PlayerRail/PlayerRail.tsx';
import { Badge } from '@/components/badge.tsx';
import { Button } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';

import { Stage, StageGrid } from './stage.tsx';

const noop = () => {};

/** Fixture lookup that throws loudly if a slug drifts out of sync. */
function fixture(id: string) {
  const found = getGameFixture(id);
  if (!found) throw new Error(`missing fixture: ${id}`);
  return found.snapshot;
}

function PrimitivesStory() {
  return (
    <StageGrid>
      <Stage
        title="Button — variants"
        description="primary / secondary / ghost / danger"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Stage>
      <Stage title="Button — sizes" description="md / lg">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Stage>
      <Stage title="Card" background="cream">
        <Card className="w-full max-w-sm">
          <p className="text-sm font-bold text-black">Surface container</p>
          <p className="mt-1 text-sm text-black/60">
            Cream/white surface used across dashboard, history, and join.
          </p>
        </Card>
      </Stage>
      <Stage
        title="Badge — tones"
        description="frozen / saved / neutral / win / loss"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="frozen">Frozen</Badge>
          <Badge tone="saved">Saved</Badge>
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="win">Win</Badge>
          <Badge tone="loss">Loss</Badge>
        </div>
      </Stage>
    </StageGrid>
  );
}

function InteractiveBoard() {
  const snapshot = fixture('active-your-turn');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selection = createTapSelection({
    hand: snapshot.hand,
    board: snapshot.board,
    team: snapshot.teams[snapshot.mySeat] ?? 1,
    selectedIndex,
  });
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3">
      <GameBoard
        board={snapshot.board}
        validTargets={selection?.validTargets}
        onCellSelect={noop}
      />
      <CardHand
        hand={snapshot.hand}
        mode="tap"
        selectedIndex={selectedIndex}
        onSelectCard={(_, index) =>
          setSelectedIndex((current) => (current === index ? null : index))
        }
      />
      <p className="text-xs text-black/55">
        Tap a card to preview its valid targets on the board.
      </p>
    </div>
  );
}

function BoardStory() {
  const choice = fixture('sequence-choice');
  const finished = fixture('game-over');
  return (
    <StageGrid>
      <Stage title="Active — tap to highlight targets">
        <InteractiveBoard />
      </Stage>
      <Stage
        title="Sequence choice"
        description="Overline run pending the locking five"
      >
        <div className="w-full max-w-2xl">
          <GameBoard
            board={choice.board}
            pendingChoiceCells={choice.pendingChoice?.cells}
            choiceSelectedCells={choice.pendingChoice?.cells.slice(0, 5)}
          />
        </div>
      </Stage>
      <Stage title="Game over — winning cells">
        <div className="w-full max-w-2xl">
          <GameBoard
            board={finished.board}
            winningCells={winningSequenceCells}
          />
        </div>
      </Stage>
    </StageGrid>
  );
}

function HandStory() {
  const active = fixture('active-your-turn');
  const dead = fixture('dead-card');
  return (
    <StageGrid>
      <Stage title="Tap mode" background="felt">
        <div className="w-full max-w-xl">
          <CardHand hand={active.hand} mode="tap" onSelectCard={noop} />
        </div>
      </Stage>
      <Stage title="Tap mode — dead card dimmed" background="felt">
        <div className="w-full max-w-xl">
          <CardHand
            hand={dead.hand}
            mode="tap"
            deadCardIndexes={deadCardIndexes(dead.hand, dead.board)}
            onSelectCard={noop}
          />
        </div>
      </Stage>
      <Stage title="Drag mode" background="felt">
        <div className="w-full max-w-xl">
          <CardHand
            hand={active.hand}
            mode="drag"
            onCardDragStart={noop}
            onCardDragEnd={noop}
          />
        </div>
      </Stage>
    </StageGrid>
  );
}

function PlayerRailStory() {
  const yourTurn = fixture('active-your-turn');
  const noTimer = fixture('active-not-your-turn');
  const finished = fixture('game-over');
  return (
    <StageGrid>
      <Stage title="Active — timed turn">
        <div className="w-full max-w-3xl">
          <PlayerRail
            players={yourTurn.players}
            currentSeat={yourTurn.currentSeat}
            round={yourTurn.round}
            sequences={yourTurn.sequences}
            lastPlayedCards={{ 1: { rank: 'K', suit: 'H' } }}
            timerSeconds={yourTurn.timerSeconds}
            turnRemainingMs={yourTurn.turnRemainingMs}
            status={yourTurn.status}
            nowMs={0}
          />
        </div>
      </Stage>
      <Stage title="Active — no timer, opponent on the clock">
        <div className="w-full max-w-3xl">
          <PlayerRail
            players={noTimer.players}
            currentSeat={noTimer.currentSeat}
            round={noTimer.round}
            sequences={noTimer.sequences}
            timerSeconds={null}
            status={noTimer.status}
            nowMs={0}
          />
        </div>
      </Stage>
      <Stage title="Finished — sequence counts">
        <div className="w-full max-w-3xl">
          <PlayerRail
            players={finished.players}
            currentSeat={finished.currentSeat}
            round={finished.round}
            sequences={finished.sequences}
            timerSeconds={null}
            status={finished.status}
            nowMs={0}
          />
        </div>
      </Stage>
    </StageGrid>
  );
}

function LobbyStory() {
  const lobby = fixture('lobby');
  return (
    <StageGrid>
      <Stage title="Four players, no timer">
        <div className="w-full max-w-2xl">
          <LobbyTeams
            inviteCode={lobby.inviteCode}
            playerCount={4}
            mode={lobby.mode}
            timerSeconds={null}
            players={lobby.players}
            mySeat={lobby.mySeat}
            onJoinTeam={noop}
            onKick={noop}
            onRandomize={noop}
            onStart={noop}
            onCopyInvite={noop}
          />
        </div>
      </Stage>
      <Stage title="Two players, 30s turn timer">
        <div className="w-full max-w-2xl">
          <LobbyTeams
            inviteCode={lobby.inviteCode}
            playerCount={2}
            mode="drag"
            timerSeconds={30}
            players={lobby.players.slice(0, 2)}
            mySeat={lobby.mySeat}
            onJoinTeam={noop}
            onKick={noop}
            onRandomize={noop}
            onStart={noop}
            onCopyInvite={noop}
          />
        </div>
      </Stage>
    </StageGrid>
  );
}

function HandoffStory() {
  return (
    <StageGrid>
      <Stage title="With last move" background="cream">
        <div className="w-full max-w-md">
          <HandoffScreen
            playerName="Marcus"
            lastMoveLabel="KH to 1KH"
            onReveal={noop}
          />
        </div>
      </Stage>
      <Stage title="First turn (no last move)" background="cream">
        <div className="w-full max-w-md">
          <HandoffScreen playerName="Riya" onReveal={noop} />
        </div>
      </Stage>
    </StageGrid>
  );
}

function GameOverStory() {
  const finished = fixture('game-over');
  return (
    <StageGrid>
      <Stage title="Win">
        <div className="w-full max-w-2xl">
          <GameOver
            winnerTeam={finished.winnerTeam}
            endReason="win"
            players={finished.players}
            onRematch={noop}
          />
        </div>
      </Stage>
      <Stage title="Conceded">
        <div className="w-full max-w-2xl">
          <GameOver
            winnerTeam={null}
            endReason="concede"
            concededTeam={2}
            players={finished.players}
            onRematch={noop}
          />
        </div>
      </Stage>
    </StageGrid>
  );
}

/** Section slug → renderer. Keys must match `sections.ts`. */
export const STORIES: Record<string, () => ReactNode> = {
  primitives: PrimitivesStory,
  board: BoardStory,
  hand: HandStory,
  'player-rail': PlayerRailStory,
  lobby: LobbyStory,
  handoff: HandoffStory,
  'game-over': GameOverStory,
};
