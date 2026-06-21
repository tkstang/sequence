/**
 * Playground section catalog.
 *
 * Plain, serializable metadata so the server `layout`/index can render the nav
 * without pulling in the client-only story components. The matching renderers
 * live in `stories.tsx`, keyed by the same `slug`.
 */
export interface PlaygroundSectionMeta {
  slug: string;
  title: string;
  blurb: string;
}

export const SECTIONS: PlaygroundSectionMeta[] = [
  {
    slug: 'primitives',
    title: 'Primitives',
    blurb: 'Button, Card, and Badge across variants, sizes, and tones.',
  },
  {
    slug: 'board',
    title: 'Game board',
    blurb: 'GameBoard driven by fixtures, with selection and win highlighting.',
  },
  {
    slug: 'hand',
    title: 'Card hand',
    blurb: 'CardHand fan in tap and drag modes, including dead cards.',
  },
  {
    slug: 'player-rail',
    title: 'Player rail',
    blurb: 'PlayerRail turn order, timers, sequence counts, and disconnects.',
  },
  {
    slug: 'lobby',
    title: 'Lobby teams',
    blurb: 'LobbyTeams seat assignment across player counts.',
  },
  {
    slug: 'handoff',
    title: 'Handoff',
    blurb: 'Pass-and-play handoff screen between local turns.',
  },
  {
    slug: 'game-over',
    title: 'Game over',
    blurb: 'GameOver summary for wins and concessions.',
  },
];

export function getSectionMeta(
  slug: string,
): PlaygroundSectionMeta | undefined {
  return SECTIONS.find((section) => section.slug === slug);
}
