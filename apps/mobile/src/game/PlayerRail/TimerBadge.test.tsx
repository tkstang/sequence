import { act, cleanup, render } from '@testing-library/react-native';

import { TimerBadge } from './TimerBadge.tsx';

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('TimerBadge', () => {
  it('derives the countdown from turnDeadlineAt under fake timers', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));

    const { getByText } = await render(
      <TimerBadge
        status="active"
        timerSeconds={90}
        turnDeadlineAt="2026-07-03T12:01:30.000Z"
      />,
    );

    expect(getByText('1:30')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(31_000);
    });

    expect(getByText('0:59')).toBeTruthy();
  });

  it('re-syncs immediately when a stream update changes the deadline', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));

    const { getByText, rerender } = await render(
      <TimerBadge
        status="active"
        timerSeconds={90}
        turnDeadlineAt="2026-07-03T12:01:30.000Z"
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    expect(getByText('1:00')).toBeTruthy();

    await rerender(
      <TimerBadge
        status="active"
        timerSeconds={90}
        turnDeadlineAt="2026-07-03T12:02:30.000Z"
      />,
    );

    expect(getByText('2:00')).toBeTruthy();
  });

  it('clamps expired deadlines at 0:00 without local forfeit affordances', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));

    const { getByText, queryByTestId, queryByText } = await render(
      <TimerBadge
        status="active"
        timerSeconds={30}
        turnDeadlineAt="2026-07-03T12:00:01.000Z"
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });

    expect(getByText('0:00')).toBeTruthy();
    expect(queryByText('Forfeit')).toBeNull();
    expect(queryByTestId('game.timer.forfeit')).toBeNull();
  });
});
