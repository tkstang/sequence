import { useInfiniteQuery } from '@tanstack/react-query';
import { render, userEvent } from '@testing-library/react-native';

import type {
  HeadToHeadRow,
  HistoryGameRow,
  HistoryPage,
  RecordSummary,
} from './types.ts';

type MockQueryResult<TData> = {
  data?: TData;
  isError: boolean;
  isPending: boolean;
};

type MockInfiniteResult = {
  data?: { pages: HistoryPage[] };
  fetchNextPage: jest.Mock;
  hasNextPage: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isPending: boolean;
};

var mockRecordQuery: MockQueryResult<RecordSummary>;
var mockHeadToHeadQuery: MockQueryResult<HeadToHeadRow[]>;
var mockGamesQuery: MockInfiniteResult;
var mockInfiniteQueryOptions = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(() => mockGamesQuery),
  useQuery: jest.fn((options: { queryKey?: string[] }) =>
    options.queryKey?.includes('headToHead')
      ? mockHeadToHeadQuery
      : mockRecordQuery,
  ),
}));

jest.mock('../../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    history: {
      headToHead: {
        queryOptions: jest.fn(() => ({
          queryKey: ['history', 'headToHead'],
          queryFn: jest.fn(),
        })),
      },
      myGames: {
        infiniteQueryOptions: (...args: unknown[]) =>
          mockInfiniteQueryOptions(...args),
      },
      myRecord: {
        queryOptions: jest.fn(() => ({
          queryKey: ['history', 'myRecord'],
          queryFn: jest.fn(),
        })),
      },
    },
  })),
}));

import { HistoryScreen } from './HistoryScreen.tsx';

function game(overrides: Partial<HistoryGameRow> = {}): HistoryGameRow {
  return {
    gameId: 'game-1',
    finishedAt: '2026-06-10T18:30:00.000Z',
    playerCount: 4,
    mode: 'tap',
    local: false,
    winnerTeam: 1,
    endReason: 'win',
    myTeam: 1,
    result: 'win',
    ...overrides,
  };
}

beforeEach(() => {
  mockInfiniteQueryOptions = jest.fn((_input, options) => ({
    queryKey: ['history', 'myGames'],
    queryFn: jest.fn(),
    ...options,
  }));
  mockRecordQuery = {
    data: { wins: 7, losses: 3, total: 10 },
    isError: false,
    isPending: false,
  };
  mockHeadToHeadQuery = {
    data: [
      {
        opponentId: 'user-1',
        opponentName: 'Maya',
        wins: 3,
        losses: 1,
        games: 4,
      },
    ],
    isError: false,
    isPending: false,
  };
  mockGamesQuery = {
    data: {
      pages: [
        {
          items: [
            game(),
            game({
              gameId: 'local-1',
              local: true,
              mode: 'drag',
              result: 'loss',
              winnerTeam: 2,
            }),
          ],
          nextCursor: 'cursor-page-2',
        },
      ],
    },
    fetchNextPage: jest.fn(),
    hasNextPage: true,
    isError: false,
    isFetchingNextPage: false,
    isPending: false,
  };
});

describe('HistoryScreen', () => {
  it('renders the W-L-total record, completed games including local games, and head-to-head rows', async () => {
    const { getByTestId, getByText } = await render(<HistoryScreen />);

    expect(getByTestId('history.screen')).toBeTruthy();
    expect(getByTestId('history.record')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();

    expect(getByTestId('history.game.game-1')).toBeTruthy();
    expect(getByTestId('history.game.local-1')).toBeTruthy();
    expect(getByTestId('history.game.local-1.local')).toBeTruthy();
    expect(getByText('LOCAL')).toBeTruthy();
    expect(getByText('W')).toBeTruthy();
    expect(getByText('L')).toBeTruthy();

    expect(getByTestId('history.headToHead')).toBeTruthy();
    expect(getByText('Maya')).toBeTruthy();
    expect(getByText('3-1')).toBeTruthy();
    expect(getByText('4 games')).toBeTruthy();
  });

  it('renders empty states for record-adjacent sections with no completed games or opponents', async () => {
    mockRecordQuery.data = { wins: 0, losses: 0, total: 0 };
    mockHeadToHeadQuery.data = [];
    mockGamesQuery.data = { pages: [{ items: [], nextCursor: null }] };
    mockGamesQuery.hasNextPage = false;

    const { getByText, queryByTestId } = await render(<HistoryScreen />);

    expect(getByText('No finished games yet.')).toBeTruthy();
    expect(getByText(/No head-to-head records yet/i)).toBeTruthy();
    expect(queryByTestId('history.loadMore')).toBeNull();
  });

  it('loads the next completed-games page using the server nextCursor', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(<HistoryScreen />);
    const infiniteOptions = jest.mocked(useInfiniteQuery).mock
      .calls[0]![0] as unknown as {
      getNextPageParam: (page: HistoryPage) => string | undefined;
    };

    expect(mockInfiniteQueryOptions).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ getNextPageParam: expect.any(Function) }),
    );
    expect(
      infiniteOptions.getNextPageParam({
        items: [],
        nextCursor: 'cursor-page-2',
      }),
    ).toBe('cursor-page-2');

    await user.press(getByTestId('history.loadMore'));

    expect(mockGamesQuery.fetchNextPage).toHaveBeenCalledWith();
  });

  it('renders query loading states', async () => {
    mockRecordQuery.isPending = true;
    mockHeadToHeadQuery.isPending = true;
    mockGamesQuery.isPending = true;
    mockGamesQuery.data = undefined;

    const { getAllByText } = await render(<HistoryScreen />);

    expect(getAllByText('Loading...').length).toBeGreaterThanOrEqual(3);
  });

  it('renders an explicit error state when any history query fails', async () => {
    mockRecordQuery.isError = true;
    mockRecordQuery.data = undefined;

    const { getByTestId, getByText, queryByTestId } = await render(
      <HistoryScreen />,
    );

    expect(getByTestId('history.error')).toBeTruthy();
    expect(getByText('Could not load history')).toBeTruthy();
    expect(queryByTestId('history.record')).toBeNull();
    expect(queryByTestId('history.games')).toBeNull();
    expect(queryByTestId('history.headToHead')).toBeNull();
  });
});
