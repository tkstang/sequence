export type TestIdScreen =
  | 'auth'
  | 'board'
  | 'create'
  | 'dashboard'
  | 'game'
  | 'hand'
  | 'handoff'
  | 'history'
  | 'home'
  | 'join'
  | 'lobby'
  | 'sequenceChoice'
  | 'settings';

type TestIdSegment = string | number;

export function testId(
  screen: TestIdScreen,
  element: string,
  ...qualifiers: TestIdSegment[]
): string {
  const segments = [screen, element, ...qualifiers].map((segment) =>
    String(segment).trim(),
  );

  if (segments.some((segment) => segment.length === 0)) {
    throw new Error('testID segments must be non-empty');
  }

  return segments.join('.');
}
