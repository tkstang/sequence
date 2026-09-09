import type { Card, Rank, Suit } from '@sequence/game-logic';
import { cleanup, render } from '@testing-library/react-native';

function mockSvgModule(code: string) {
  const SvgMock = Object.assign(
    jest.fn(() => null),
    {
      displayName: code,
    },
  );

  return {
    __esModule: true,
    default: SvgMock,
  };
}

jest.mock('../../assets/cards/AC.svg', () => mockSvgModule('AC'));
jest.mock('../../assets/cards/AD.svg', () => mockSvgModule('AD'));
jest.mock('../../assets/cards/AH.svg', () => mockSvgModule('AH'));
jest.mock('../../assets/cards/AS.svg', () => mockSvgModule('AS'));
jest.mock('../../assets/cards/2C.svg', () => mockSvgModule('2C'));
jest.mock('../../assets/cards/2D.svg', () => mockSvgModule('2D'));
jest.mock('../../assets/cards/2H.svg', () => mockSvgModule('2H'));
jest.mock('../../assets/cards/2S.svg', () => mockSvgModule('2S'));
jest.mock('../../assets/cards/3C.svg', () => mockSvgModule('3C'));
jest.mock('../../assets/cards/3D.svg', () => mockSvgModule('3D'));
jest.mock('../../assets/cards/3H.svg', () => mockSvgModule('3H'));
jest.mock('../../assets/cards/3S.svg', () => mockSvgModule('3S'));
jest.mock('../../assets/cards/4C.svg', () => mockSvgModule('4C'));
jest.mock('../../assets/cards/4D.svg', () => mockSvgModule('4D'));
jest.mock('../../assets/cards/4H.svg', () => mockSvgModule('4H'));
jest.mock('../../assets/cards/4S.svg', () => mockSvgModule('4S'));
jest.mock('../../assets/cards/5C.svg', () => mockSvgModule('5C'));
jest.mock('../../assets/cards/5D.svg', () => mockSvgModule('5D'));
jest.mock('../../assets/cards/5H.svg', () => mockSvgModule('5H'));
jest.mock('../../assets/cards/5S.svg', () => mockSvgModule('5S'));
jest.mock('../../assets/cards/6C.svg', () => mockSvgModule('6C'));
jest.mock('../../assets/cards/6D.svg', () => mockSvgModule('6D'));
jest.mock('../../assets/cards/6H.svg', () => mockSvgModule('6H'));
jest.mock('../../assets/cards/6S.svg', () => mockSvgModule('6S'));
jest.mock('../../assets/cards/7C.svg', () => mockSvgModule('7C'));
jest.mock('../../assets/cards/7D.svg', () => mockSvgModule('7D'));
jest.mock('../../assets/cards/7H.svg', () => mockSvgModule('7H'));
jest.mock('../../assets/cards/7S.svg', () => mockSvgModule('7S'));
jest.mock('../../assets/cards/8C.svg', () => mockSvgModule('8C'));
jest.mock('../../assets/cards/8D.svg', () => mockSvgModule('8D'));
jest.mock('../../assets/cards/8H.svg', () => mockSvgModule('8H'));
jest.mock('../../assets/cards/8S.svg', () => mockSvgModule('8S'));
jest.mock('../../assets/cards/9C.svg', () => mockSvgModule('9C'));
jest.mock('../../assets/cards/9D.svg', () => mockSvgModule('9D'));
jest.mock('../../assets/cards/9H.svg', () => mockSvgModule('9H'));
jest.mock('../../assets/cards/9S.svg', () => mockSvgModule('9S'));
jest.mock('../../assets/cards/TC.svg', () => mockSvgModule('TC'));
jest.mock('../../assets/cards/TD.svg', () => mockSvgModule('TD'));
jest.mock('../../assets/cards/TH.svg', () => mockSvgModule('TH'));
jest.mock('../../assets/cards/TS.svg', () => mockSvgModule('TS'));
jest.mock('../../assets/cards/JC.svg', () => mockSvgModule('JC'));
jest.mock('../../assets/cards/JD.svg', () => mockSvgModule('JD'));
jest.mock('../../assets/cards/JH.svg', () => mockSvgModule('JH'));
jest.mock('../../assets/cards/JS.svg', () => mockSvgModule('JS'));
jest.mock('../../assets/cards/QC.svg', () => mockSvgModule('QC'));
jest.mock('../../assets/cards/QD.svg', () => mockSvgModule('QD'));
jest.mock('../../assets/cards/QH.svg', () => mockSvgModule('QH'));
jest.mock('../../assets/cards/QS.svg', () => mockSvgModule('QS'));
jest.mock('../../assets/cards/KC.svg', () => mockSvgModule('KC'));
jest.mock('../../assets/cards/KD.svg', () => mockSvgModule('KD'));
jest.mock('../../assets/cards/KH.svg', () => mockSvgModule('KH'));
jest.mock('../../assets/cards/KS.svg', () => mockSvgModule('KS'));

import {
  CARD_FACE_ASSETS,
  CARD_FACE_CODES,
  CardFace,
  getCardAssetComponent,
} from './CardFace.tsx';

afterEach(() => {
  cleanup();
});

const ranks = [
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
  'J',
  'Q',
  'K',
] as const satisfies readonly Rank[];
const suits = ['C', 'D', 'H', 'S'] as const satisfies readonly Suit[];

const deck = ranks.flatMap((rank) =>
  suits.map((suit) => ({
    card: { rank, suit } satisfies Card,
    code: `${rank}${suit}` as const,
  })),
);

describe('CardFace', () => {
  it.each(deck)(
    'resolves $code to the matching SVG asset',
    ({ card, code }) => {
      expect(getCardAssetComponent(card)).toBe(CARD_FACE_ASSETS[code]);
      expect(getCardAssetComponent(card).displayName).toBe(code);
    },
  );

  it('registers exactly the 52 face assets', () => {
    expect(CARD_FACE_CODES).toHaveLength(52);
    expect(new Set(CARD_FACE_CODES).size).toBe(52);
    expect(CARD_FACE_CODES).toEqual(deck.map(({ code }) => code));
  });

  it('keeps the resolved asset identity stable across rerenders', async () => {
    const card = { rank: 'A', suit: 'C' } satisfies Card;
    const before = getCardAssetComponent(card);
    const { getByTestId, rerender } = await render(
      <CardFace card={card} size="board" testID="card.face.ac" />,
    );

    expect(getByTestId('card.face.ac')).toBeTruthy();

    rerender(<CardFace card={card} size="hand" testID="card.face.ac" />);

    expect(getCardAssetComponent(card)).toBe(before);
  });

  it('skips SVG rerenders for equal card values', async () => {
    const Asset = getCardAssetComponent({ rank: 'A', suit: 'C' });
    (Asset as jest.Mock).mockClear();
    const { rerender } = await render(
      <CardFace
        card={{ rank: 'A', suit: 'C' }}
        size="board"
        testID="card.face.memo"
      />,
    );

    expect(Asset).toHaveBeenCalledTimes(1);

    rerender(
      <CardFace
        card={{ rank: 'A', suit: 'C' }}
        size="board"
        testID="card.face.memo"
      />,
    );

    expect(Asset).toHaveBeenCalledTimes(1);
  });
});
