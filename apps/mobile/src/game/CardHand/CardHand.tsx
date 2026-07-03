import type { SnapshotBoardCell } from '@sequence/client-state';
import type { Board, Card, GameMode, Position } from '@sequence/game-logic';
import { findDeadCards } from '@sequence/game-logic';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';
import { CardFace } from '../cards/CardFace.tsx';

export interface CardHandProps {
  board: Readonly<Record<Position, SnapshotBoardCell | undefined>>;
  defaultSelectedIndex?: number | null;
  disabled?: boolean;
  hand: readonly Card[];
  mode: GameMode;
  onSelectionChange?: (card: Card | null, index: number | null) => void;
  onTurnInDeadCard?: (card: Card, index: number) => void;
  selectedIndex?: number | null;
}

export function CardHand({
  board,
  defaultSelectedIndex = null,
  disabled = false,
  hand,
  mode,
  onSelectionChange,
  onTurnInDeadCard,
  selectedIndex,
}: CardHandProps) {
  const { colors } = useTheme();
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<
    number | null
  >(defaultSelectedIndex);
  const controlled = selectedIndex !== undefined;
  const activeSelectedIndex = controlled
    ? selectedIndex
    : internalSelectedIndex;
  const deadCardCodes = useMemo(() => {
    const rulesBoard = snapshotBoardToRulesBoard(board);
    return new Set(
      findDeadCards(hand, rulesBoard).map((card) => cardCode(card)),
    );
  }, [board, hand]);

  const selectCard = (card: Card, index: number) => {
    const nextIndex = activeSelectedIndex === index ? null : index;
    const nextCard = nextIndex === null ? null : card;

    if (!controlled) {
      setInternalSelectedIndex(nextIndex);
    }
    onSelectionChange?.(nextCard, nextIndex);
  };

  return (
    <View
      accessibilityLabel="Your hand"
      pointerEvents="box-none"
      style={styles.dock}
      testID={testId('hand', 'dock')}
    >
      <View style={styles.fan} testID={testId('hand', 'fan')}>
        {hand.map((card, index) => {
          const code = cardCode(card);
          const cardTestId = testId('hand', 'card', code);
          const selected = activeSelectedIndex === index;
          const dead = mode === 'drag' && deadCardCodes.has(code);
          const showTurnIn =
            mode === 'drag' && dead && onTurnInDeadCard !== undefined;

          return (
            <Pressable
              accessibilityLabel={`${code}${dead ? ' dead card' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              key={`${code}-${index}`}
              onPress={disabled ? undefined : () => selectCard(card, index)}
              style={[
                styles.cardButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: selected ? colors.teamGreen : colors.border,
                  transform: transformFor(index, hand.length, selected),
                },
                selected ? styles.cardSelected : null,
                disabled ? styles.cardDisabled : null,
              ]}
              testID={cardTestId}
            >
              <CardFace
                card={card}
                size="hand"
                style={styles.cardFace}
                testID={`${cardTestId}.face`}
              />
              {dead ? (
                <Text style={styles.deadBadge} testID={`${cardTestId}.dead`}>
                  DEAD
                </Text>
              ) : null}
              {showTurnIn ? (
                <Pressable
                  accessibilityLabel={`Turn in ${code}`}
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    onTurnInDeadCard(card, index);
                  }}
                  style={[
                    styles.turnInButton,
                    { backgroundColor: colors.accent },
                  ]}
                  testID={`${cardTestId}.turnIn`}
                >
                  <Text style={styles.turnInText}>Turn in</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function snapshotBoardToRulesBoard(
  board: Readonly<Record<Position, SnapshotBoardCell | undefined>>,
): Board {
  const entries: Array<[Position, SnapshotBoardCell]> = [];
  for (const [position, cell] of Object.entries(board)) {
    if (cell !== undefined) {
      entries.push([position as Position, cell]);
    }
  }
  return new Map(entries);
}

function cardCode(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function transformFor(
  index: number,
  total: number,
  selected: boolean,
): [{ rotate: string }, { translateY: number }] {
  const center = (total - 1) / 2;
  const offset = index - center;
  return [
    { rotate: `${offset * 4}deg` },
    { translateY: selected ? -14 : Math.abs(offset) * 4 },
  ];
}

const styles = StyleSheet.create({
  dock: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: 12,
    position: 'absolute',
    right: 0,
  },
  fan: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 128,
  },
  cardButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 3,
    justifyContent: 'center',
    marginHorizontal: -5,
    padding: 2,
    shadowColor: '#0f172a',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  cardFace: {
    borderRadius: 7,
  },
  cardSelected: {
    borderWidth: 2,
    zIndex: 2,
  },
  cardDisabled: {
    opacity: 0.52,
  },
  deadBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: 'absolute',
    right: 6,
    top: 6,
  },
  turnInButton: {
    borderRadius: 999,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
  },
  turnInText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});
