'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { AppHeader } from '@/components/app-header.tsx';
import { useTRPC } from '@/lib/trpc/client.ts';
import { useRequireSession } from '@/lib/use-session.ts';

import { HistoryView } from './history-view.tsx';
import type {
  HeadToHeadRow,
  HistoryGameRow,
  RecordSummary,
} from './history-view.tsx';

/**
 * History page (p05-t08, FR14). Gated on a session. Fetches the aggregate
 * record + head-to-head + a cursor-paged completed-games list.
 */
export default function HistoryPage() {
  const session = useRequireSession();
  const trpc = useTRPC();

  const record = useQuery({
    ...trpc.history.myRecord.queryOptions(),
    enabled: session.isAuthenticated,
  });
  const headToHead = useQuery({
    ...trpc.history.headToHead.queryOptions(),
    enabled: session.isAuthenticated,
  });
  const games = useInfiniteQuery({
    ...trpc.history.myGames.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (last: { nextCursor: string | null }) =>
          last.nextCursor ?? undefined,
      },
    ),
    enabled: session.isAuthenticated,
  });

  if (session.isPending || !session.isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-sm text-black/50">
        Loading…
      </main>
    );
  }

  const allGames: HistoryGameRow[] = (games.data?.pages ?? []).flatMap(
    (page: { items: HistoryGameRow[] }) => page.items,
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <HistoryView
        record={record.data as RecordSummary | undefined}
        headToHead={(headToHead.data ?? []) as HeadToHeadRow[]}
        games={allGames}
        isLoading={games.isPending}
        hasMore={Boolean(games.hasNextPage)}
        isLoadingMore={games.isFetchingNextPage}
        onLoadMore={() => games.fetchNextPage()}
      />
    </div>
  );
}
