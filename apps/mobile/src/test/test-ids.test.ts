import { testId } from './test-ids.ts';

describe('testId', () => {
  it('joins non-empty identifier segments with dots', () => {
    expect(testId('board', 'cell', '1AC')).toBe('board.cell.1AC');
  });

  it('rejects empty identifier segments', () => {
    expect(() => testId('board', '', '1AC')).toThrow(
      'testID segments must be non-empty',
    );
  });
});
