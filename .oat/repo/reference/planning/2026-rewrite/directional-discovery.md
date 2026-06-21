# Sequence Game — Tech Stack Discovery

> **SUPERSEDED (2026-06-11):** This directional draft has been superseded by **`discovery.md`** in this directory, which consolidates it with the brainstorm session's requirements decisions (`rules-and-flows.md`) and stack-validation research (notably: Lucia → Better Auth). Kept for history; do not treat the stack table below as current.

*Discovery / brainstorming doc — drafted for paste into Stoa*

## What Is This

This document is some initial discovery captured with Claud in a brainstorming session about revamping an old project. The project was started in 2020, then I did a little bit of work in late 2025 in an effort to just modernize it so I could pick the project back up (see commit 79e45f442a976e3fbc47b2b564e8ec5fededf228). This time around, I want to do a more radical rewrite to align with my current vision. This document should be treated as directional, and will be used as a starting point for a larger discovery and brainstorming effort. I have initialized this project with open-agent-toolkit (OAT). Anything outside of .agents, .claude, .codex, and .oat directories can be considered legacy reference and can be removed/replaced.

## Project Overview

Revamping the **Sequence** card game project originally started during the COVID era (Next.js + Firestore real-time DB). The original got reasonably far — board rendering, card deck UI, and the sequence-detection algorithm were largely working — but the plan now is a full revamp, likely rewriting most logic from scratch with AI assistance.

**Core experience:** real-time multiplayer Sequence. Players each see their hand at the bottom of the screen, the shared board in the middle, pull/play a card to place a chip, and all players see live board updates as others move.

**Build approach:** Use Claude (Fable) end-to-end via an OAT-style workflow — deep discovery → collaborative design → one-shot build. This doc is the planning artifact for that.

## Target Architecture

Monorepo with a shared, framework-agnostic game backend that both web and mobile clients consume. Start with web (or PWA), add React Native later — but structure everything from day one so the eventual multi-client state is clean.

```
sequence/ (pnpm workspace)
├── apps/
│   ├── web/          # Next.js — marketing site + client-rendered game routes
│   └── mobile/       # React Native (later phase)
├── packages/
│   ├── api/          # Fastify + tRPC backend
│   └── game-logic/   # shared: sequence algorithm, validation, rules (pure TS)
├── bruno/            # Bruno API collection — endpoint testing, committed to repo
└── (tooling: TS 7 beta / tsgo, oxlint, oxfmt, vitest at root)
```

**Web game rendering:** Keep the game inside the Next.js app as **client-rendered routes** (rather than a separate Vite SPA). The game is pure client-side + real-time, so Next's server features go unused on those routes — that's fine, and it keeps one web app, one deploy, shared auth + tRPC client. Splitting out a Vite SPA stays an option if bundle size or build perf ever justifies it. Note the web and RN clients **don't share UI** (different render primitives) — they share `game-logic` + the tRPC client, so this is purely a web-side call.

## Stack Decisions

| Layer | Choice | Notes |
|---|---|---|
| **Monorepo** | pnpm workspaces | Mirrors existing work setup |
| **Language** | TypeScript 7 beta (`tsgo` / `@typescript/native-preview`) | Go-port compiler, ~10x faster; beta, stable line is still 6.0 — knowingly bleeding-edge |
| **Lint** | Oxlint | Stable (v1.x), fast |
| **Format** | Oxfmt | Beta (~v0.5x, pre-1.0) but usable; has import sorting + Tailwind class sorting |
| **Tests** | Vitest (Jest for RN) | Vitest across game-logic, api, and web components; RN component tests stay on Jest by choice (mature RN tooling) |
| **Backend** | Separate Fastify service | Already comfortable with Fastify; preferred over Next.js API routes |
| **API layer** | tRPC | End-to-end type safety; API defined once, both clients get autocomplete + type checking |
| **Real-time** | tRPC WebSocket support (Fastify adapter) | **No Socket.io needed** — tRPC subscriptions handle live updates |
| **API testing** | Bruno | Git-friendly API client; collection lives in `bruno/` in-repo, built side-by-side with endpoints |
| **Database** | Neon (serverless Postgres) | Branching for dev, scale-to-zero for cheap idle, no lock-in (plain Postgres) |
| **Auth** | **Lucia** (session-based) | Framework-agnostic — same auth layer on web, RN (via Expo SecureStore), and any future Vite split. Avoids NextAuth's Next.js lock-in. Supabase auth remains an upgrade path. |
| **Web** | Next.js 16 + React 19 | Marketing site + client-rendered game routes; turn on React Compiler (auto-memoization helps a re-render-heavy game) |
| **Mobile** | React Native | Later phase |
| **Styling (web)** | Tailwind CSS | Pairs with oxfmt class sorting |
| **Styling (mobile)** | NativeWind | Same utility-class mental model as web for UI chrome |
| **Animation** | Motion (web) / Reanimated (RN) | Platform-native animation libs; board/cards are SVG + positioning + animation |
| **State (web)** | tRPC built-in caching | Skip React Query — tRPC covers it |
| **State (mobile)** | tRPC client + React Query | RN tRPC tooling is less seamless; React Query fills the gap |
| **Shared logic** | `game-logic` workspace package | Sequence algorithm + validation imported by both clients |

## Deployment

- **Web (Next.js):** Vercel — git deploy, instant previews, tight Next.js integration
- **API (Fastify):** Railway or Render — Vercel can't host the standalone backend; Railway is simplest (push-to-deploy)
- **Database:** Neon

All three have free/cheap tiers to start.

## Data Model (Postgres)

Everything that must survive a session or be shared between players:

- **Game sessions** — players (original roster), whose turn, status (active / saved / completed), persistence expiry
- **Board state** — chip positions, cards played
- **User accounts / auth**
- **Game history** — completed games, outcomes, replays
- **Win-loss records** — derived by aggregating the games table (player IDs + outcome + timestamp); built in from day one
- **Move / chat logs** (chat is post-MVP; see below)

Client-side only: ephemeral UI state (e.g. which card is selected or which square is being hovered before a move commits).

## Game Flow & Persistence

Two tiers of persistence, designed to keep the DB clean while letting friends pick games back up later:

- **Auto-save (active games):** Any disconnect — closed tab, dead phone, dropped connection — triggers an auto-save with a **1-hour** rejoin window. Game freezes on whoever's turn it was. If no one rejoins within the hour, it's cleaned up.
- **Save & exit (saved games):** An explicit *save and exit* action persists the game for **1 week**. On mobile, exiting an unfinished game **prompts** "save this game?". On web, auto-save covers the close-tab case (no reliable pre-close prompt), with save & exit available as a deliberate action.
- **Resume rule:** A saved/paused game can only continue once **all original players** have rejoined — no proceeding with a partial roster.

## Player Count & Team Structure

- **Supported counts:** 2, 3, 4, or 6 players. **5 is impossible** — only three chip colors exist (red, blue, green), so max 3 teams.
- **Teams:** Even counts above 2 (i.e. 4 or 6) can play as teams, two/three teams alternating turns around the board. 3-player is free-for-all.
- **Win condition:** Depends on number of teams/players — **2 teams → 2 sequences to win; 3 teams → 1 sequence**. (Standard Sequence scaling.)
- **Chip ownership:** Track which player/team owns which color in the DB.

## Auth & Guest Model

- **Persistence requires login.** Only logged-in users can save games or have game history/win-loss records.
- **Guest play allowed, but ephemeral.** A guest can join and play a live session via an invite link, but guest games **cannot be saved** — there's no reliable way to verify a returning guest is the same person (cookie/device identity is too fragile to hang persistence on). Drop as a guest and the game's gone.
- **Onboarding:** logged-in users only for the persistent experience; keep signup simple (email/password and/or social via Lucia).

## Sessions & Matchmaking

- **MVP:** Invite-only. Create a game → get a shareable link / code → friends join.
- **Future:** Random matchmaking ("looking for game" queue, backend pairs players, spins up a session). **Not** in MVP, but the session model is built flexibly enough to bolt this on without rearchitecting.

## UI / UX Interaction Model

Responsive across desktop, mobile web, and React Native. Desktop gets the fuller-featured layout; mobile stays usable on a small screen.

- **Always visible:** the full board with all placed chips, plus your hand peeking up from the bottom edge so you can see what you're holding.
- **Cards:** SVG card set (one per card in the deck) already exists from the original project — supports flip/animation if desired.
- **Two play modes, both built from day one** (toggle/flag — turning on hard mode later is just a setting):
  - **Default (tap-to-reveal):** Tap a card → its valid square(s) highlight on the board (max two per card, possibly one if the other's taken) → tap a highlighted square to confirm. Lower friction; good for casual play.
  - **Hard mode (drag-with-validation):** Drag a chip onto the board. Nothing is pre-highlighted — you have to find your own spots. Hovering a square shows a confirmation highlight so you don't misdrop; placement is rejected (with feedback) if you don't hold a supporting card. Preserves the board-scanning challenge that's core to Sequence.
- **Rules nuance to handle:** one-eyed jacks (remove a chip) and two-eyed jacks (wild — play anywhere).

## Chat / Social

Nice to have, **not MVP**. Scope as v1 — architect with it in mind (the move/chat log table anticipates it) but don't let it block the MVP.

## Decisions Settled Along the Way

- **Neon vs Supabase:** Neon to start — leaner, cheaper, pay-for-what-you-use. Supabase's extras (managed auth, storage, realtime) aren't needed yet, and migration stays easy since it's all Postgres underneath.
- **Next.js vs Astro:** Next.js — Astro is static-first and not suited to the WebSocket-heavy, game-state-streaming model.
- **Next.js for the game vs separate Vite SPA:** Keep the game in Next.js as client-rendered routes. One web app, one deploy, shared auth + tRPC client. Vite SPA split stays available if build perf / bundle size ever justifies it.
- **Hono vs Fastify:** Fastify — existing familiarity wins; structure + validation + performance are a fine fit.
- **Socket.io:** Dropped — tRPC's WebSocket support replaces it.
- **React Query on web:** Skipped — tRPC's built-in caching is enough.
- **Styling:** Tailwind (web) + NativeWind (RN) for shared utility-class DX on UI chrome; board/cards are SVG + per-platform animation (Motion / Reanimated). Don't force one styling lib cross-platform — share logic, not UI.
- **Auth — Lucia over NextAuth:** Framework-agnostic; same session logic across web, React Native (Expo SecureStore), and any future Vite split. NextAuth's Next.js coupling would force a rearchitect later.

## Code Organization

Detailed conventions live in a separate **`CODE_ORGANIZATION.md`** (handed to the agent alongside this doc). Key principles:

- **Co-locate** tests (`*.test.ts`) and utils (`*.utils.ts`) with their source — no `__tests__/` directories.
- **Kebab-case** files by default; **PascalCase** for React components and class files.
- **Dot-extension siblings** (`GameBoard.tsx` / `.utils.ts` / `.test.ts` / `.config.ts`) keep core files lean.
- **Nest sub-components** under their parent; genuinely shared code bubbles up to `src/shared/`.
- **Backend is domain-driven** (`game/`, `user/`), with **file-per-route** handler granularity.

## Build Sequencing

Two sessions, to validate the experience before reproducing it:

1. **Session 1 — Backend + Web.** Build the Fastify/tRPC backend and the Next.js web app (including small-screen/mobile-web layout). Get the game feeling right and the direction confirmed on a real device before committing to a second client. *Design for React Native from the start* (shared `game-logic`, portable auth) so the port is straightforward — but don't build it yet.
2. **Session 2 — React Native.** Port the proven patterns to RN against the already-working backend and tRPC client.

## OAT & Workflow

- **OAT lives in the repo** (`skills/` scaffold) but **does not drive the initial build.** For greenfield, lighter structure is better — discovery → design → let the model cook in one cohesive pass.
- **OAT comes in later** for iterative, well-scoped refinement work (`/skeptic`, `/compare`, etc.) once there's a working skeleton to pressure-test.

## Operator Pre-Flight Checklist

Set up before the build session so the agent runs uninterrupted:

- **Neon** — create project, grab connection string; Neon MCP configured for the agent.
- **Railway** — org + API token (backend deploy).
- **Vercel** — repo linked, token (web deploy).
- **Credentials** — all of the above in `.env` / `.env.local` for the agent to reference.
- **GitHub repo** — created and cloned; pnpm workspace skeleton scaffolded (`apps/web`, `apps/mobile`, `packages/api`, `packages/game-logic`) with empty `package.json`s declaring workspace membership.
- **MCP access** — Neon MCP (+ GitHub / filesystem MCPs as desired).
- **Bruno** — `bruno.json` at repo root so the agent knows where to scaffold endpoint tests.
- **Root configs** — `tsconfig.base.json` (TS 7, strict) and `turbo.json` (build/test pipeline) so the agent inherits rather than guesses.
- **OAT** — `skills/` scaffold in place (not driving this pass).

## Open Questions / To Resolve in Design Phase

- **Sequence algorithm:** Original algorithm exists and worked (handles X-in-a-row detection, one/two-eyed jacks, required sequence count). Low risk — Claude can validate it quickly with tests, or rewrite from scratch. Not a concern.
- **Tooling note (not a concern):** TS 7 (beta) and oxfmt (pre-1.0) are intentionally early but proven in practice — oxfmt already runs in multiple production repos, and TS 7 is in hand. No fallback planning needed; agent should just use them.
- **Monetization model** — database/hosting costs scale with players. No model decided yet; possibly a paid tier eventually.
- **Offline / spotty connection (mobile):** Unresolved — when a player makes a move while briefly disconnected, does it queue locally and sync on reconnect, or fail-and-retry? Affects client architecture; decide during design. (Turn-based nature makes this lower-stakes, but worth a deliberate call.)
- **Phasing:** Confirmed — Session 1 ships backend + web (validate small-screen UX), Session 2 ports to React Native. (See Build Sequencing above.)

## Next Steps

1. Tighten this into a full **requirements doc** (rules, edge cases, screens, flows).
2. Collaborative **design pass** on data model + API surface.
3. Feed the locked spec into Claude Code and attempt a **one-shot build**.
