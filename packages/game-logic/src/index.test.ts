import { describe, expect, it } from 'vitest';

import { PACKAGE_NAME } from './index.ts';

describe('@sequence/game-logic', () => {
  it('imports successfully', () => {
    expect(PACKAGE_NAME).toBe('@sequence/game-logic');
  });
});
