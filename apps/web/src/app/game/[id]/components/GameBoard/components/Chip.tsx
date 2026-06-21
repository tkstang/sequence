import type { Team } from '@sequence/game-logic';

const TEAM_CLASS: Record<Team, string> = {
  1: 'bg-team-blue',
  2: 'bg-team-green',
  3: 'bg-team-red',
};

export interface ChipProps {
  team: Team;
  locked?: boolean;
  winning?: boolean;
}

export function Chip({ team, locked = false, winning = false }: ChipProps) {
  return (
    <span
      aria-label={`Team ${team} chip${locked ? ' locked' : ''}`}
      className={`absolute inset-[18%] rounded-full ${TEAM_CLASS[team]} shadow-sm ring-2 ${
        winning ? 'ring-yellow-300' : locked ? 'ring-white/80' : 'ring-black/10'
      }`}
    >
      {locked ? (
        <span
          className="absolute inset-[32%] rounded-full bg-white/70"
          aria-hidden
        />
      ) : null}
    </span>
  );
}
