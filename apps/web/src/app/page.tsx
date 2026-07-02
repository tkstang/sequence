import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';

import { AppHeader } from '@/components/app-header.tsx';
import { Card } from '@/components/card.tsx';
import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

/**
 * Landing page (p05-t04, FR15). Server-rendered marketing: hero, how-it-works,
 * and a CTA into signup. No client interactivity — it's the public front door.
 */
const steps: { title: string; body: string }[] = [
  {
    title: 'Create or join',
    body: 'Start a game and share the invite link, or hop into a friend’s game as a guest — no account needed to play.',
  },
  {
    title: 'Play in real time',
    body: 'Place chips, build five-in-a-row sequences, and watch every move sync instantly across 2 to 6 players.',
  },
  {
    title: 'Win the board',
    body: 'Claim sequences (corners are wild!) until your team hits the target. Rematch with one tap.',
  },
];

const styles = stylex.create({
  page: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    backgroundColor: color.bg,
    color: color.text,
  },
  headerLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: color.textOnDark,
    textDecorationLine: { default: 'none', ':hover': 'underline' },
    textUnderlineOffset: '2px',
    transitionProperty: 'text-decoration-color',
    transitionDuration: '140ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.textOnDark,
    outlineOffset: '2px',
  },
  main: {
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.xxl,
    paddingInline: space.xxl,
    paddingBlock: '80px',
    textAlign: 'center',
    backgroundColor: color.felt,
    color: color.textOnDark,
  },
  heroTitle: {
    maxWidth: '42rem',
    fontSize: {
      default: fontSize.xxl,
      '@media (min-width: 640px)': '3rem',
    },
    fontWeight: fontWeight.black,
    lineHeight: lineHeight.tight,
    letterSpacing: '-0.02em',
  },
  heroLede: {
    maxWidth: '36rem',
    fontSize: fontSize.lg,
    lineHeight: lineHeight.normal,
    opacity: 0.92,
  },
  ctaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  ctaPrimary: {
    borderRadius: radius.lg,
    paddingInline: space.xxl,
    paddingBlock: space.md,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    backgroundColor: color.teamGreen,
    color: color.accentText,
    filter: { default: 'none', ':hover': 'brightness(0.95)' },
    transitionProperty: 'filter',
    transitionDuration: '140ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.textOnDark,
    outlineOffset: '2px',
  },
  ctaSecondary: {
    borderRadius: radius.lg,
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderColor: 'rgba(255,255,255,0.7)',
    paddingInline: space.xxl,
    paddingBlock: space.md,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: color.textOnDark,
    backgroundColor: {
      default: 'transparent',
      ':hover': 'rgba(255,255,255,0.1)',
    },
    transitionProperty: 'background-color',
    transitionDuration: '140ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.textOnDark,
    outlineOffset: '2px',
  },
  howSection: {
    marginInline: 'auto',
    width: '100%',
    maxWidth: '56rem',
    paddingInline: space.xxl,
    paddingBlock: '64px',
  },
  howTitle: {
    marginBlockEnd: space.xxxl,
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  stepGrid: {
    display: 'grid',
    gap: space.lg,
    gridTemplateColumns: {
      default: '1fr',
      '@media (min-width: 640px)': 'repeat(3, minmax(0, 1fr))',
    },
  },
  stepCard: {
    height: '100%',
  },
  stepBadge: {
    display: 'inline-flex',
    height: '28px',
    width: '28px',
    alignItems: 'center',
    justifyContent: 'center',
    marginBlockEnd: space.md,
    borderRadius: radius.pill,
    backgroundColor: color.slate,
    color: color.textOnDark,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  stepTitle: {
    marginBlockEnd: space.xs,
    fontWeight: fontWeight.bold,
  },
  stepBody: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    color: color.textMuted,
  },
  ctaSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.lg,
    paddingInline: space.xxl,
    paddingBlockEnd: '80px',
    textAlign: 'center',
  },
  ctaSectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  footer: {
    paddingInline: space.xxl,
    paddingBlock: space.xxl,
    textAlign: 'center',
    fontSize: fontSize.xs,
    lineHeight: lineHeight.normal,
    backgroundColor: color.slate,
    color: color.textMuted,
  },
});

export default function HomePage() {
  return (
    <div {...stylex.props(styles.page)}>
      <AppHeader
        homeHref="/"
        right={
          <Link href="/login" {...stylex.props(styles.headerLink)}>
            Log in
          </Link>
        }
      />

      <main {...stylex.props(styles.main)}>
        <section {...stylex.props(styles.hero)}>
          <h1 {...stylex.props(styles.heroTitle)}>
            Sequence, the way you play it round the table — online.
          </h1>
          <p {...stylex.props(styles.heroLede)}>
            Real-time, rule-faithful multiplayer Sequence for 2 to 6 players.
            Users, guests, or pass-and-play on one device.
          </p>
          <div {...stylex.props(styles.ctaRow)}>
            <Link href="/signup" {...stylex.props(styles.ctaPrimary)}>
              Get started
            </Link>
            <Link href="/login" {...stylex.props(styles.ctaSecondary)}>
              I have an account
            </Link>
          </div>
        </section>

        <section {...stylex.props(styles.howSection)}>
          <h2 {...stylex.props(styles.howTitle)}>How it works</h2>
          <ol {...stylex.props(styles.stepGrid)}>
            {steps.map((step, i) => (
              <li key={step.title}>
                <Card {...stylex.props(styles.stepCard)}>
                  <span {...stylex.props(styles.stepBadge)}>{i + 1}</span>
                  <h3 {...stylex.props(styles.stepTitle)}>{step.title}</h3>
                  <p {...stylex.props(styles.stepBody)}>{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section {...stylex.props(styles.ctaSection)}>
          <h2 {...stylex.props(styles.ctaSectionTitle)}>Ready to play?</h2>
          <Link href="/signup" {...stylex.props(styles.ctaPrimary)}>
            Create your free account
          </Link>
        </section>
      </main>

      <footer {...stylex.props(styles.footer)}>
        Sequence is a registered trademark of its respective owner. This is a
        fan-made hobby project.
      </footer>
    </div>
  );
}
