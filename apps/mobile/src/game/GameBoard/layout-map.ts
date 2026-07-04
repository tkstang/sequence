import type { Position } from '@sequence/game-logic';

export interface BoardCellFrame {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface BoardPoint {
  readonly x: number;
  readonly y: number;
}

export interface BoardLayoutMap {
  clear: () => void;
  getFrame: (position: Position) => BoardCellFrame | undefined;
  getRevision: () => number;
  hitTest: (point: BoardPoint) => Position | null;
  registerFrame: (position: Position, frame: BoardCellFrame) => void;
  subscribe: (listener: () => void) => () => void;
}

function containsPoint(frame: BoardCellFrame, point: BoardPoint): boolean {
  return (
    point.x >= frame.x &&
    point.x <= frame.x + frame.width &&
    point.y >= frame.y &&
    point.y <= frame.y + frame.height
  );
}

export function createBoardLayoutMap(): BoardLayoutMap {
  const frames = new Map<Position, BoardCellFrame>();
  const listeners = new Set<() => void>();
  let revision = 0;
  let notifyScheduled = false;

  function scheduleNotify() {
    revision += 1;
    if (notifyScheduled) return;

    notifyScheduled = true;
    enqueueMicrotask(() => {
      notifyScheduled = false;
      for (const listener of listeners) {
        listener();
      }
    });
  }

  return {
    clear() {
      frames.clear();
      scheduleNotify();
    },
    getFrame(position) {
      return frames.get(position);
    },
    getRevision() {
      return revision;
    },
    hitTest(point) {
      const entries = Array.from(frames.entries());
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [position, frame] = entries[index]!;
        if (containsPoint(frame, point)) return position;
      }
      return null;
    },
    registerFrame(position, frame) {
      frames.set(position, frame);
      scheduleNotify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function enqueueMicrotask(callback: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
    return;
  }

  void Promise.resolve().then(callback);
}
