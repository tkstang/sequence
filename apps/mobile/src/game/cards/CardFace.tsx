import type { Card, Rank, Suit } from '@sequence/game-logic';
import { memo } from 'react';
import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import TwoC from '../../assets/cards/2C.svg';
import TwoD from '../../assets/cards/2D.svg';
import TwoH from '../../assets/cards/2H.svg';
import TwoS from '../../assets/cards/2S.svg';
import ThreeC from '../../assets/cards/3C.svg';
import ThreeD from '../../assets/cards/3D.svg';
import ThreeH from '../../assets/cards/3H.svg';
import ThreeS from '../../assets/cards/3S.svg';
import FourC from '../../assets/cards/4C.svg';
import FourD from '../../assets/cards/4D.svg';
import FourH from '../../assets/cards/4H.svg';
import FourS from '../../assets/cards/4S.svg';
import FiveC from '../../assets/cards/5C.svg';
import FiveD from '../../assets/cards/5D.svg';
import FiveH from '../../assets/cards/5H.svg';
import FiveS from '../../assets/cards/5S.svg';
import SixC from '../../assets/cards/6C.svg';
import SixD from '../../assets/cards/6D.svg';
import SixH from '../../assets/cards/6H.svg';
import SixS from '../../assets/cards/6S.svg';
import SevenC from '../../assets/cards/7C.svg';
import SevenD from '../../assets/cards/7D.svg';
import SevenH from '../../assets/cards/7H.svg';
import SevenS from '../../assets/cards/7S.svg';
import EightC from '../../assets/cards/8C.svg';
import EightD from '../../assets/cards/8D.svg';
import EightH from '../../assets/cards/8H.svg';
import EightS from '../../assets/cards/8S.svg';
import NineC from '../../assets/cards/9C.svg';
import NineD from '../../assets/cards/9D.svg';
import NineH from '../../assets/cards/9H.svg';
import NineS from '../../assets/cards/9S.svg';
import AC from '../../assets/cards/AC.svg';
import AD from '../../assets/cards/AD.svg';
import AH from '../../assets/cards/AH.svg';
import AS from '../../assets/cards/AS.svg';
import JC from '../../assets/cards/JC.svg';
import JD from '../../assets/cards/JD.svg';
import JH from '../../assets/cards/JH.svg';
import JS from '../../assets/cards/JS.svg';
import KC from '../../assets/cards/KC.svg';
import KD from '../../assets/cards/KD.svg';
import KH from '../../assets/cards/KH.svg';
import KS from '../../assets/cards/KS.svg';
import QC from '../../assets/cards/QC.svg';
import QD from '../../assets/cards/QD.svg';
import QH from '../../assets/cards/QH.svg';
import QS from '../../assets/cards/QS.svg';
import TC from '../../assets/cards/TC.svg';
import TD from '../../assets/cards/TD.svg';
import TH from '../../assets/cards/TH.svg';
import TS from '../../assets/cards/TS.svg';

export type CardFaceCode = `${Rank}${Suit}`;
export type CardFaceSize = 'board' | 'hand' | number;
type SvgCardComponent = ComponentType<SvgProps>;

const CARD_ASPECT_RATIO = 224.225 / 312.808;
const CARD_WIDTHS = {
  board: 32,
  hand: 72,
} as const satisfies Record<Exclude<CardFaceSize, number>, number>;

export const CARD_FACE_CODES = [
  'AC',
  'AD',
  'AH',
  'AS',
  '2C',
  '2D',
  '2H',
  '2S',
  '3C',
  '3D',
  '3H',
  '3S',
  '4C',
  '4D',
  '4H',
  '4S',
  '5C',
  '5D',
  '5H',
  '5S',
  '6C',
  '6D',
  '6H',
  '6S',
  '7C',
  '7D',
  '7H',
  '7S',
  '8C',
  '8D',
  '8H',
  '8S',
  '9C',
  '9D',
  '9H',
  '9S',
  'TC',
  'TD',
  'TH',
  'TS',
  'JC',
  'JD',
  'JH',
  'JS',
  'QC',
  'QD',
  'QH',
  'QS',
  'KC',
  'KD',
  'KH',
  'KS',
] as const satisfies readonly CardFaceCode[];

export const CARD_FACE_ASSETS: Record<CardFaceCode, SvgCardComponent> = {
  AC,
  AD,
  AH,
  AS,
  '2C': TwoC,
  '2D': TwoD,
  '2H': TwoH,
  '2S': TwoS,
  '3C': ThreeC,
  '3D': ThreeD,
  '3H': ThreeH,
  '3S': ThreeS,
  '4C': FourC,
  '4D': FourD,
  '4H': FourH,
  '4S': FourS,
  '5C': FiveC,
  '5D': FiveD,
  '5H': FiveH,
  '5S': FiveS,
  '6C': SixC,
  '6D': SixD,
  '6H': SixH,
  '6S': SixS,
  '7C': SevenC,
  '7D': SevenD,
  '7H': SevenH,
  '7S': SevenS,
  '8C': EightC,
  '8D': EightD,
  '8H': EightH,
  '8S': EightS,
  '9C': NineC,
  '9D': NineD,
  '9H': NineH,
  '9S': NineS,
  TC,
  TD,
  TH,
  TS,
  JC,
  JD,
  JH,
  JS,
  QC,
  QD,
  QH,
  QS,
  KC,
  KD,
  KH,
  KS,
};

export interface CardFaceProps {
  card: Card;
  size?: CardFaceSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function getCardFaceCode(card: Card): CardFaceCode {
  return `${card.rank}${card.suit}` as CardFaceCode;
}

export function getCardAssetComponent(card: Card): SvgCardComponent {
  return CARD_FACE_ASSETS[getCardFaceCode(card)];
}

function widthForSize(size: CardFaceSize): number {
  return typeof size === 'number' ? size : CARD_WIDTHS[size];
}

function CardFaceImpl({ card, size = 'board', style, testID }: CardFaceProps) {
  const width = widthForSize(size);
  const height = width / CARD_ASPECT_RATIO;
  const Asset = getCardAssetComponent(card);

  return (
    <View
      accessibilityLabel={`${getCardFaceCode(card)} card`}
      style={[styles.root, { height, width }, style]}
      testID={testID}
    >
      <Asset height={height} width={width} />
    </View>
  );
}

export const CardFace = memo(CardFaceImpl);
CardFace.displayName = 'CardFace';

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
