import { describe, expect, it } from 'vitest';

import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  palette,
  radius,
  space,
  zIndex,
  type ColorToken,
} from './index.ts';

function keysOf<T extends Record<string, unknown>>(record: T): Array<keyof T> {
  return Object.keys(record).sort() as Array<keyof T>;
}

describe('palette', () => {
  it('keeps light and dark palettes in key parity', () => {
    const lightKeys = keysOf(palette.light);
    const darkKeys = keysOf(palette.dark);

    expect(darkKeys).toEqual(lightKeys);

    const compileTimeColorToken: ColorToken = lightKeys[0];
    expect(palette.light[compileTimeColorToken]).toBeDefined();
    expect(palette.dark[compileTimeColorToken]).toBeDefined();
  });
});

describe('dimensions', () => {
  it('exports the expected token groups', () => {
    expect(keysOf(space)).toEqual([
      'huge',
      'lg',
      'md',
      'none',
      'sm',
      'xl',
      'xs',
      'xxl',
      'xxs',
      'xxxl',
    ]);
    expect(keysOf(radius)).toEqual(['lg', 'md', 'pill', 'round', 'sm', 'xl']);
    expect(keysOf(fontSize)).toEqual(['lg', 'md', 'sm', 'xl', 'xs', 'xxl']);
    expect(keysOf(fontWeight)).toEqual([
      'black',
      'bold',
      'medium',
      'regular',
      'semibold',
    ]);
    expect(keysOf(lineHeight)).toEqual(['normal', 'snug', 'tight']);
    expect(keysOf(zIndex)).toEqual([
      'base',
      'overlay',
      'raised',
      'sticky',
      'toast',
    ]);
    expect(keysOf(fontFamily)).toEqual(['mono', 'sans']);
  });
});
