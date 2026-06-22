'use client';

import * as stylex from '@stylexjs/stylex';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

import { AppHeader } from './app-header.tsx';

export interface AuthenticatedHeaderProps {
  userInitial: string;
  onLogout: () => void;
  isSigningOut?: boolean;
  homeHref?: string;
}

const styles = stylex.create({
  cluster: {
    display: 'flex',
    alignItems: 'center',
    gap: space.md,
  },
  account: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: radius.round,
    backgroundColor: color.teamBlue,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: color.textOnDark,
  },
  logout: {
    borderWidth: 0,
    borderRadius: radius.md,
    paddingInline: space.sm,
    paddingBlock: space.xs,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: { default: color.textOnDark, ':hover': color.textOnDark },
    backgroundColor: {
      default: 'transparent',
      ':hover': 'rgba(255,255,255,0.12)',
    },
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    opacity: { default: 1, ':disabled': 0.6 },
    transitionProperty: 'background-color, color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.textOnDark,
    outlineOffset: '2px',
  },
});

/** Header for authenticated shell pages: account mark plus reachable logout. */
export function AuthenticatedHeader({
  userInitial,
  onLogout,
  isSigningOut = false,
  homeHref = '/dashboard',
}: AuthenticatedHeaderProps) {
  return (
    <AppHeader
      homeHref={homeHref}
      right={
        <div {...stylex.props(styles.cluster)}>
          <span {...stylex.props(styles.account)} aria-label="Your account">
            {userInitial}
          </span>
          <button
            type="button"
            onClick={onLogout}
            disabled={isSigningOut}
            {...stylex.props(styles.logout)}
          >
            {isSigningOut ? 'Signing out...' : 'Log out'}
          </button>
        </div>
      }
    />
  );
}
