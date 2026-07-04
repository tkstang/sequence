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

  it('publishes batched revision updates for frame changes', async () => {
    const layoutMap = createBoardLayoutMap();
    const listener = jest.fn();
    const unsubscribe = layoutMap.subscribe(listener);

    expect(layoutMap.getRevision()).toBe(0);

    layoutMap.registerFrame('1AC', { height: 20, width: 20, x: 10, y: 10 });
    layoutMap.registerFrame('1KC', { height: 20, width: 20, x: 30, y: 10 });

    expect(layoutMap.getRevision()).toBe(2);
    expect(listener).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    layoutMap.clear();
    await Promise.resolve();

    expect(layoutMap.getRevision()).toBe(3);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
