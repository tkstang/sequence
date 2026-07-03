import { isValidElement } from 'react';
import type { ReactElement } from 'react';

import { findKitStory, kitStories } from './stories.ts';
import type { KitStoryFixture } from './stories.ts';

describe('dev playground stories', () => {
  it('registers game-surface stories through the shared story list', () => {
    expect(kitStories.map((story) => story.id)).toEqual(
      expect.arrayContaining(['game-board', 'game-hand', 'game-rail']),
    );
    expect(findKitStory('game-board')?.title).toBe('Game board');
    expect(findKitStory('game-hand')?.title).toBe('Card hand');
    expect(findKitStory('game-rail')?.title).toBe('Player rail');
  });

  it('covers expected board, hand, and rail states with native preview nodes', () => {
    const expectedLabels = {
      'game-board': [
        'Empty board',
        'Midgame scatter',
        'Spotlight targets',
        'Locked sequences',
        '6-player table',
      ],
      'game-hand': [
        'Tap mode selected',
        'Drag mode dead card',
        'Opponent turn disabled',
        '6-player short deal',
      ],
      'game-rail': [
        'Active timer',
        'Opponent offline',
        'Locked sequence count',
        '6-player teams',
      ],
    } as const;

    for (const [storyId, labels] of Object.entries(expectedLabels)) {
      const story = findKitStory(storyId);

      expect(story?.fixtures.map((fixture) => fixture.label)).toEqual(labels);
      expect(
        story?.fixtures.every(
          (fixture) =>
            fixture.component === 'Card' &&
            isValidElement(fixture.props.children),
        ),
      ).toBe(true);
    }
  });

  it('uses compact hand samples that fit the story cards', () => {
    const story = findKitStory('game-hand');
    const fixtures =
      story?.fixtures.filter(
        (fixture): fixture is Extract<KitStoryFixture, { component: 'Card' }> =>
          fixture.component === 'Card',
      ) ?? [];

    expect(fixtures.map((fixture) => handForFixture(fixture).length)).toEqual([
      4, 4, 4, 4,
    ]);
  });
});

function handForFixture(
  fixture: Extract<KitStoryFixture, { component: 'Card' }>,
): readonly unknown[] {
  const preview = fixture.props.children;
  if (!isValidElement<{ children?: unknown }>(preview)) {
    throw new Error('Expected story preview element');
  }

  const hand = (preview.props.children as ReactElement<{ hand?: unknown }>)
    .props.hand;
  if (!Array.isArray(hand)) {
    throw new Error('Expected CardHand preview hand');
  }

  return hand;
}
