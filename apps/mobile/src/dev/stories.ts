import {
  gameFixtures,
  type GameSnapshotView,
  type SnapshotPlayer,
} from '@sequence/client-state';
import type { Card, Team } from '@sequence/game-logic';
import { createElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { BadgeProps } from '../components/Badge.tsx';
import type { ButtonProps } from '../components/Button.tsx';
import type { CardProps } from '../components/Card.tsx';
import type { ScreenProps } from '../components/Screen.tsx';
import type { TextFieldProps } from '../components/TextField.tsx';
import { CardHand } from '../game/CardHand/CardHand.tsx';
import { GameBoard } from '../game/GameBoard/GameBoard.tsx';
import { PlayerRail } from '../game/PlayerRail/PlayerRail.tsx';

export type KitStoryId =
  | 'button'
  | 'text-field'
  | 'card'
  | 'badge'
  | 'screen'
  | 'game-board'
  | 'game-hand'
  | 'game-rail';

export type KitStoryFixture =
  | {
      component: 'Button';
      label: string;
      props: Omit<ButtonProps, 'onPress'>;
    }
  | {
      component: 'TextField';
      label: string;
      props: TextFieldProps;
    }
  | {
      component: 'Card';
      label: string;
      props: Omit<CardProps, 'children'> & { children: ReactNode };
    }
  | {
      component: 'Badge';
      label: string;
      props: BadgeProps;
    }
  | {
      component: 'Screen';
      label: string;
      props: Pick<ScreenProps, 'scroll'> & {
        eyebrow?: string;
        title: string;
        children: string;
      };
    };

export interface KitStory {
  id: KitStoryId;
  title: string;
  description: string;
  fixtures: readonly KitStoryFixture[];
}

const styles = StyleSheet.create({
  boardPreview: {
    alignItems: 'center',
    display: 'flex',
    maxWidth: 360,
  },
  handPreview: {
    height: 164,
    maxWidth: 360,
    overflow: 'hidden',
    position: 'relative',
  },
  railPreview: {
    maxWidth: 360,
  },
});

const emptyBoardSnapshot = snapshotById('lobby');
const midgameSnapshot = snapshotById('active-your-turn');
const notYourTurnSnapshot = snapshotById('active-not-your-turn');
const deadCardSnapshot = snapshotById('dead-card');
const lockedSequenceSnapshot = snapshotById('game-over');
const sixPlayerSnapshot = makeSixPlayerSnapshot(midgameSnapshot);
const offlineRailSnapshot = {
  ...notYourTurnSnapshot,
  players: notYourTurnSnapshot.players.map((player) =>
    player.seat === 1 ? { ...player, connected: false } : player,
  ),
} satisfies GameSnapshotView;

export const kitStories = [
  {
    id: 'button',
    title: 'Button',
    description: 'Primary actions, secondary options, and destructive choices.',
    fixtures: [
      {
        component: 'Button',
        label: 'Primary',
        props: {
          accessibilityLabel: 'Start game',
          children: 'Start game',
          size: 'md',
          testID: 'dev.story.button.primary',
          variant: 'primary',
        },
      },
      {
        component: 'Button',
        label: 'Secondary small',
        props: {
          children: 'Invite',
          size: 'sm',
          testID: 'dev.story.button.secondary',
          variant: 'secondary',
        },
      },
      {
        component: 'Button',
        label: 'Disabled destructive',
        props: {
          children: 'Resign',
          disabled: true,
          size: 'lg',
          testID: 'dev.story.button.disabled',
          variant: 'destructive',
        },
      },
    ],
  },
  {
    id: 'text-field',
    title: 'TextField',
    description: 'Single-line text entry at each supported control size.',
    fixtures: [
      {
        component: 'TextField',
        label: 'Small',
        props: {
          defaultValue: 'Tess',
          placeholder: 'Display name',
          size: 'sm',
          testID: 'dev.story.text-field.small',
        },
      },
      {
        component: 'TextField',
        label: 'Medium',
        props: {
          placeholder: 'Invite code',
          size: 'md',
          testID: 'dev.story.text-field.medium',
        },
      },
      {
        component: 'TextField',
        label: 'Disabled large',
        props: {
          disabled: true,
          placeholder: 'Locked setting',
          size: 'lg',
          testID: 'dev.story.text-field.disabled',
        },
      },
    ],
  },
  {
    id: 'card',
    title: 'Card',
    description: 'Surface containers for lobby panels and game state groups.',
    fixtures: [
      {
        component: 'Card',
        label: 'Surface',
        props: {
          children: 'Waiting for your next turn.',
          testID: 'dev.story.card.surface',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Raised',
        props: {
          children: 'Round summary with elevated emphasis.',
          elevation: 'raised',
          testID: 'dev.story.card.raised',
          variant: 'raised',
        },
      },
      {
        component: 'Card',
        label: 'Accent',
        props: {
          children: 'Team sequence claimed.',
          testID: 'dev.story.card.accent',
          variant: 'accent',
        },
      },
    ],
  },
  {
    id: 'badge',
    title: 'Badge',
    description: 'Compact labels for teams, status, and saved/frozen cells.',
    fixtures: [
      {
        component: 'Badge',
        label: 'Neutral',
        props: {
          children: 'Ready',
          testID: 'dev.story.badge.neutral',
          variant: 'neutral',
        },
      },
      {
        component: 'Badge',
        label: 'Team colors',
        props: {
          children: 'Blue team',
          size: 'lg',
          testID: 'dev.story.badge.team-blue',
          variant: 'teamBlue',
        },
      },
      {
        component: 'Badge',
        label: 'Frozen',
        props: {
          children: 'Frozen',
          size: 'sm',
          testID: 'dev.story.badge.frozen',
          variant: 'frozen',
        },
      },
    ],
  },
  {
    id: 'screen',
    title: 'Screen',
    description: 'Page shell with safe-area layout, headers, and scroll mode.',
    fixtures: [
      {
        component: 'Screen',
        label: 'Static shell',
        props: {
          children: 'Dashboard content area',
          eyebrow: 'Dev',
          title: 'Dashboard',
        },
      },
      {
        component: 'Screen',
        label: 'Scrollable shell',
        props: {
          children: 'Long match history content',
          scroll: true,
          title: 'History',
        },
      },
    ],
  },
  {
    id: 'game-board',
    title: 'Game board',
    description:
      'Native board previews for empty, active, spotlighted, locked, and 6-player states.',
    fixtures: [
      {
        component: 'Card',
        label: 'Empty board',
        props: {
          children: boardPreview(emptyBoardSnapshot, {
            testID: 'dev.story.game-board.empty',
          }),
          testID: 'dev.story.game-board.empty.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Midgame scatter',
        props: {
          children: boardPreview(midgameSnapshot, {
            testID: 'dev.story.game-board.midgame',
          }),
          testID: 'dev.story.game-board.midgame.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Spotlight targets',
        props: {
          children: boardPreview(midgameSnapshot, {
            selectedCard: midgameSnapshot.hand[0],
            testID: 'dev.story.game-board.spotlight',
          }),
          testID: 'dev.story.game-board.spotlight.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Locked sequences',
        props: {
          children: boardPreview(lockedSequenceSnapshot, {
            testID: 'dev.story.game-board.locked',
          }),
          testID: 'dev.story.game-board.locked.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: '6-player table',
        props: {
          children: boardPreview(sixPlayerSnapshot, {
            selectedCard: sixPlayerSnapshot.hand[1],
            testID: 'dev.story.game-board.six-player',
          }),
          testID: 'dev.story.game-board.six-player.card',
          variant: 'surface',
        },
      },
    ],
  },
  {
    id: 'game-hand',
    title: 'Card hand',
    description:
      'Native hand previews for normal selection, opponent lockout, and dead-card turn-in.',
    fixtures: [
      {
        component: 'Card',
        label: 'Tap mode selected',
        props: {
          children: handPreview(midgameSnapshot, {
            selectedIndex: 0,
            testID: 'dev.story.game-hand.tap-selected',
          }),
          testID: 'dev.story.game-hand.tap-selected.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Drag mode dead card',
        props: {
          children: handPreview(deadCardSnapshot, {
            mode: 'drag',
            onTurnInDeadCard: noopTurnInDeadCard,
            testID: 'dev.story.game-hand.dead-card',
          }),
          testID: 'dev.story.game-hand.dead-card.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Opponent turn disabled',
        props: {
          children: handPreview(notYourTurnSnapshot, {
            disabled: true,
            testID: 'dev.story.game-hand.disabled',
          }),
          testID: 'dev.story.game-hand.disabled.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: '6-player short deal',
        props: {
          children: handPreview(sixPlayerSnapshot, {
            selectedIndex: 1,
            testID: 'dev.story.game-hand.six-player',
          }),
          testID: 'dev.story.game-hand.six-player.card',
          variant: 'surface',
        },
      },
    ],
  },
  {
    id: 'game-rail',
    title: 'Player rail',
    description:
      'Native rail previews for active timers, offline seats, completed sequences, and 6-player teams.',
    fixtures: [
      {
        component: 'Card',
        label: 'Active timer',
        props: {
          children: railPreview(midgameSnapshot, {
            testID: 'dev.story.game-rail.active',
          }),
          testID: 'dev.story.game-rail.active.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Opponent offline',
        props: {
          children: railPreview(offlineRailSnapshot, {
            testID: 'dev.story.game-rail.offline',
          }),
          testID: 'dev.story.game-rail.offline.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: 'Locked sequence count',
        props: {
          children: railPreview(lockedSequenceSnapshot, {
            testID: 'dev.story.game-rail.locked',
          }),
          testID: 'dev.story.game-rail.locked.card',
          variant: 'surface',
        },
      },
      {
        component: 'Card',
        label: '6-player teams',
        props: {
          children: railPreview(sixPlayerSnapshot, {
            testID: 'dev.story.game-rail.six-player',
          }),
          testID: 'dev.story.game-rail.six-player.card',
          variant: 'surface',
        },
      },
    ],
  },
] satisfies readonly KitStory[];

export function findKitStory(id: string | undefined): KitStory | undefined {
  return kitStories.find((story) => story.id === id);
}

function snapshotById(id: string): GameSnapshotView {
  const fixture = gameFixtures.find((item) => item.id === id);
  if (fixture === undefined) {
    throw new Error(`Missing game fixture: ${id}`);
  }
  return fixture.snapshot;
}

function makeSixPlayerSnapshot(
  baseSnapshot: GameSnapshotView,
): GameSnapshotView {
  const players: SnapshotPlayer[] = [
    { ...baseSnapshot.players[0]!, team: 1 },
    { ...baseSnapshot.players[1]!, team: 2 },
    { ...baseSnapshot.players[2]!, team: 3 },
    { ...baseSnapshot.players[3]!, team: 1 },
    {
      connected: true,
      isCreator: false,
      isGuest: true,
      name: 'Nia',
      seat: 4,
      team: 2,
    },
    {
      connected: true,
      isCreator: false,
      isGuest: true,
      name: 'Owen',
      seat: 5,
      team: 3,
    },
  ];

  return {
    ...baseSnapshot,
    playerCount: 6,
    players,
    teams: [1, 2, 3, 1, 2, 3],
    hand: baseSnapshot.hand.slice(0, 5),
  };
}

function currentTeamFor(snapshot: GameSnapshotView): Team | null {
  return (
    snapshot.players.find((player) => player.seat === snapshot.mySeat)?.team ??
    null
  );
}

function boardPreview(
  snapshot: GameSnapshotView,
  options: {
    selectedCard?: Card | null;
    testID: string;
  },
): ReactNode {
  return createElement(
    View,
    { style: styles.boardPreview, testID: options.testID },
    createElement(GameBoard, {
      board: snapshot.board,
      currentTeam: currentTeamFor(snapshot),
      maxWidth: 336,
      selectedCard: options.selectedCard ?? null,
      sequences: snapshot.sequences,
    }),
  );
}

function handPreview(
  snapshot: GameSnapshotView,
  options: {
    disabled?: boolean;
    hand?: readonly Card[];
    mode?: 'tap' | 'drag';
    onTurnInDeadCard?: (card: Card, index: number) => void;
    selectedIndex?: number | null;
    testID: string;
  },
): ReactNode {
  return createElement(
    View,
    { style: styles.handPreview, testID: options.testID },
    createElement(CardHand, {
      board: snapshot.board,
      disabled: options.disabled ?? false,
      hand: options.hand ?? compactPreviewHand(snapshot.hand),
      mode: options.mode ?? snapshot.mode,
      onTurnInDeadCard: options.onTurnInDeadCard,
      selectedIndex: options.selectedIndex,
    }),
  );
}

function compactPreviewHand(hand: readonly Card[]): readonly Card[] {
  return hand.slice(0, 4);
}

function railPreview(
  snapshot: GameSnapshotView,
  options: { testID: string },
): ReactNode {
  return createElement(
    View,
    { style: styles.railPreview, testID: options.testID },
    createElement(PlayerRail, {
      currentSeat: snapshot.currentSeat,
      players: snapshot.players,
      round: snapshot.round,
      sequences: snapshot.sequences,
      status: snapshot.status,
      timerSeconds: snapshot.timerSeconds,
      turnRemainingMs: snapshot.turnRemainingMs,
    }),
  );
}

function noopTurnInDeadCard() {}
