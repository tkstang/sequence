export interface RecordSummary {
  wins: number;
  losses: number;
  total: number;
}

export interface HeadToHeadRow {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
  games: number;
}

export interface HistoryGameRow {
  gameId: string;
  finishedAt: string | null;
  playerCount: number;
  mode: string;
  local: boolean;
  winnerTeam: number | null;
  endReason: string | null;
  myTeam: number;
  result: 'win' | 'loss' | 'none';
}

export interface HistoryPage {
  items: HistoryGameRow[];
  nextCursor: string | null;
}
