import { createBoardLayoutMap } from './layout-map.ts';

describe('createBoardLayoutMap', () => {
  it('registers cell frames and hit-tests the topmost matching cell', () => {
    const layoutMap = createBoardLayoutMap();

    layoutMap.registerFrame('1AC', { height: 20, width: 20, x: 10, y: 10 });
    layoutMap.registerFrame('1KC', { height: 20, width: 20, x: 30, y: 10 });

    expect(layoutMap.getFrame('1AC')).toEqual({
      height: 20,
      width: 20,
      x: 10,
      y: 10,
    });
    expect(layoutMap.hitTest({ x: 39, y: 20 })).toBe('1KC');
    expect(layoutMap.hitTest({ x: 9, y: 20 })).toBeNull();
  });

  it('clears stale frames', () => {
    const layoutMap = createBoardLayoutMap();

    layoutMap.registerFrame('1AC', { height: 20, width: 20, x: 10, y: 10 });
    layoutMap.clear();

    expect(layoutMap.getFrame('1AC')).toBeUndefined();
    expect(layoutMap.hitTest({ x: 12, y: 12 })).toBeNull();
  });
});
