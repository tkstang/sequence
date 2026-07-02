import type { Team } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';

import { color, radius, shadow } from '@/styles/tokens.stylex.ts';

const TEAM_COLOR: Record<Team, string> = {
  1: color.teamBlue,
  2: color.teamGreen,
  3: color.teamRed,
};

const styles = stylex.create({
  chip: {
    position: 'absolute',
    // Size by width with a 1:1 aspect ratio so the chip stays circular even
    // though board cells are now portrait (equal % insets would make it oblong).
    insetInlineStart: '50%',
    insetBlockStart: '50%',
    transform: 'translate(-50%, -50%)',
    width: '64%',
    aspectRatio: '1 / 1',
    borderRadius: radius.round,
    boxShadow: shadow.sm,
    borderWidth: '2px',
    borderStyle: 'solid',
  },
  tint: (background: string) => ({ backgroundColor: background }),
  ringWinning: { borderColor: color.highlight },
  ringLocked: { borderColor: 'rgba(255,255,255,0.8)' },
  ringNeutral: { borderColor: color.border },
  lockDot: {
    position: 'absolute',
    insetBlock: '32%',
    insetInline: '32%',
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});

export interface ChipProps {
  team: Team;
  locked?: boolean;
  winning?: boolean;
}

export function Chip({ team, locked = false, winning = false }: ChipProps) {
  return (
    <span
      aria-label={`Team ${team} chip${locked ? ' locked' : ''}`}
      {...stylex.props(
        styles.chip,
        styles.tint(TEAM_COLOR[team]),
        winning
          ? styles.ringWinning
          : locked
            ? styles.ringLocked
            : styles.ringNeutral,
      )}
    >
      {locked ? <span aria-hidden {...stylex.props(styles.lockDot)} /> : null}
    </span>
  );
}
