import type { PendingChoiceView } from '@sequence/client-state';
import type { Position } from '@sequence/game-logic';
import { cleanup, render, userEvent } from '@testing-library/react-native';

import { SequenceChoiceSheet } from './SequenceChoiceSheet.tsx';

const pendingChoice = {
  seat: 0,
  cells: ['23H', '24H', '25H', '26H', '27H', '28H'],
  placed: '23H',
} satisfies PendingChoiceView;

const chainedChoice = {
  seat: 0,
  cells: ['2AC', '2KC', '2QC', '2JC', '2TC', '29C'],
  placed: '29C',
  additionalRuns: [['3AC', '3KC', '3QC', '3JC', '3TC', '39C']],
} satisfies PendingChoiceView;

afterEach(() => {
  cleanup();
});

describe('SequenceChoiceSheet', () => {
  it('opens for my pending choice and submits an exactly-five window containing the placed cell', async () => {
    const user = userEvent.setup();
    const onChoose = jest.fn();
    const onHighlightedCellsChange = jest.fn();

    const { getByTestId, queryByTestId } = await render(
      <SequenceChoiceSheet
        mySeat={0}
        onChoose={onChoose}
        onHighlightedCellsChange={onHighlightedCellsChange}
        pendingChoice={pendingChoice}
        version={12}
      />,
    );

    expect(getByTestId('sequenceChoice.sheet')).toBeTruthy();
    expect(getByTestId('sequenceChoice.window.0')).toBeTruthy();
    expect(queryByTestId('sequenceChoice.window.1')).toBeNull();
    expect(onHighlightedCellsChange).toHaveBeenLastCalledWith([
      '23H',
      '24H',
      '25H',
      '26H',
      '27H',
    ]);

    await user.press(getByTestId('sequenceChoice.submit'));

    expect(onChoose).toHaveBeenCalledWith({
      cells: ['23H', '24H', '25H', '26H', '27H'],
      version: 12,
    });
  });

  it('reopens against the next run when a chained pending choice arrives', async () => {
    const onHighlightedCellsChange = jest.fn();
    const { getByText, rerender } = await render(
      <SequenceChoiceSheet
        mySeat={0}
        onChoose={jest.fn()}
        onHighlightedCellsChange={onHighlightedCellsChange}
        pendingChoice={pendingChoice}
        version={12}
      />,
    );

    await rerender(
      <SequenceChoiceSheet
        mySeat={0}
        onChoose={jest.fn()}
        onHighlightedCellsChange={onHighlightedCellsChange}
        pendingChoice={chainedChoice}
        version={13}
      />,
    );

    expect(getByText('2KC - 2QC - 2JC - 2TC - 29C')).toBeTruthy();
    expect(getByText('1 more run to choose after this')).toBeTruthy();
    expect(onHighlightedCellsChange).toHaveBeenLastCalledWith([
      '2KC',
      '2QC',
      '2JC',
      '2TC',
      '29C',
    ]);
  });

  it('shows a frozen banner without opening the sheet for another seat', async () => {
    const onHighlightedCellsChange = jest.fn();
    const otherSeatChoice = {
      ...pendingChoice,
      seat: 1,
    } satisfies PendingChoiceView;

    const { getByText, queryByTestId } = await render(
      <SequenceChoiceSheet
        mySeat={0}
        onChoose={jest.fn()}
        onHighlightedCellsChange={onHighlightedCellsChange}
        pendingChoice={otherSeatChoice}
        version={12}
      />,
    );

    expect(queryByTestId('sequenceChoice.sheet')).toBeNull();
    expect(getByText('Waiting for seat 1 to choose a sequence.')).toBeTruthy();
    expect(onHighlightedCellsChange).toHaveBeenLastCalledWith([]);
  });

  it('guards against malformed choices that cannot form five contiguous cells', async () => {
    const user = userEvent.setup();
    const onChoose = jest.fn();
    const malformedChoice = {
      seat: 0,
      cells: ['23H', '24H', '25H', '26H'] as Position[],
      placed: '23H',
    } satisfies PendingChoiceView;

    const { getByTestId, getByText } = await render(
      <SequenceChoiceSheet
        mySeat={0}
        onChoose={onChoose}
        pendingChoice={malformedChoice}
        version={12}
      />,
    );

    expect(
      getByText('No valid five-cell sequence includes the placed chip.'),
    ).toBeTruthy();
    expect(
      getByTestId('sequenceChoice.submit').props.accessibilityState,
    ).toMatchObject({
      disabled: true,
    });

    await user.press(getByTestId('sequenceChoice.submit'));
    expect(onChoose).not.toHaveBeenCalled();
  });
});
