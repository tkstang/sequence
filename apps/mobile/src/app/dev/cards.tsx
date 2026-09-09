import type { Card, Rank, Suit } from '@sequence/game-logic';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/Screen.tsx';
import { CARD_FACE_CODES, CardFace } from '../../game/cards/CardFace.tsx';
import { useTheme } from '../../theme/use-theme.ts';

function cardFromCode(code: string): Card {
  return {
    rank: code[0] as Rank,
    suit: code[1] as Suit,
  };
}

export default function DevCardsScreen() {
  const { colors } = useTheme();

  return (
    <Screen
      header={
        <Screen.Header eyebrow="Development only" title="Card SVG sanity" />
      }
      scroll
      testID="dev.cards"
    >
      <View style={styles.grid}>
        {CARD_FACE_CODES.map((code) => (
          <View
            key={code}
            style={[styles.tile, { backgroundColor: colors.surface }]}
            testID={`dev.cards.${code}`}
          >
            <CardFace card={cardFromCode(code)} size={42} />
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {code}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  tile: {
    alignItems: 'center',
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 4,
  },
});
