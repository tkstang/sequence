import Link from 'next/link';

import { AppHeader } from '@/components/app-header.tsx';
import { Card } from '@/components/card.tsx';

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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        homeHref="/"
        right={
          <Link
            href="/login"
            className="text-sm font-semibold underline-offset-2 hover:underline"
          >
            Log in
          </Link>
        }
      />

      <main className="flex flex-1 flex-col">
        <section className="bg-felt text-cream flex flex-col items-center gap-6 px-6 py-20 text-center">
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Sequence, the way you play it round the table — online.
          </h1>
          <p className="max-w-xl text-lg opacity-90">
            Real-time, rule-faithful multiplayer Sequence for 2 to 6 players.
            Users, guests, or pass-and-play on one device.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-team-green rounded-xl px-6 py-3.5 text-base font-semibold text-white hover:brightness-95"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="text-cream rounded-xl border-[1.5px] border-white/70 px-6 py-3.5 text-base font-semibold hover:bg-white/10"
            >
              I have an account
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <Card className="h-full">
                  <span className="bg-slate text-cream mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <h3 className="mb-1 font-bold">{step.title}</h3>
                  <p className="text-sm opacity-80">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col items-center gap-4 px-6 pb-20 text-center">
          <h2 className="text-2xl font-bold">Ready to play?</h2>
          <Link
            href="/signup"
            className="bg-team-green rounded-xl px-6 py-3.5 text-base font-semibold text-white hover:brightness-95"
          >
            Create your free account
          </Link>
        </section>
      </main>

      <footer className="bg-slate text-cream/70 px-6 py-6 text-center text-xs">
        Sequence is a registered trademark of its respective owner. This is a
        fan-made hobby project.
      </footer>
    </div>
  );
}
