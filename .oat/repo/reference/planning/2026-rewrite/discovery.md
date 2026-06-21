---
title: 'Sequence 2026 Rewrite — Consolidated Discovery'
date: '2026-06-11'
source: oat-brainstorm
supersedes: directional-discovery.md
---

# Sequence 2026 Rewrite — Consolidated Discovery

*Supersedes `directional-discovery.md` (kept as history). Consolidates the original directional draft with the 2026-06-11 brainstorm session: requirements deep-dive (canonical decisions in `rules-and-flows.md`), stack validation research, and the workflow decision. Companion docs: `rules-and-flows.md` (requirements decisions), `code-organization.md` (conventions), `sequence-game-instructions.pdf` (official rules).*

## Project Overview

Full rewrite of the COVID-era Sequence card game project (Next.js + Firestore). **Core experience:** real-time multiplayer Sequence — hand at the bottom, shared board in the middle, live updates as players move. Everything outside `.agents/`, `.claude/`, `.codex/`, `.oat/` is legacy reference, to be removed/replaced.

**Workflow decision (settled this session):** one **spec-driven OAT project (`web-mvp`)** covers Session 1 (backend + web). Discovery arrives complete from this brainstorm; the design phase (data model, API surface, UI wireframes) is the next collaborative conversation; then a phased plan executes autonomously. React Native (Session 2) becomes its own OAT project after the web MVP ships. Rationale: the build will outlive any single agent session — `state.md` + phased plan + per-phase commits are what make autonomous execution resumable and incrementally testable (the 2025 attempt stalled precisely for lack of this).

## Target Architecture

Monorepo with a framework-agnostic game backend; web first, RN later, structured for multi-client from day one.

```
sequence/ (pnpm workspace)
├── apps/
│   ├── web/          # Next.js 16 — marketing site + client-rendered game routes
│   └── mobile/       # React Native (later project)
├── packages/
│   ├── api/          # Fastify + tRPC backend (domain-driven, file-per-route)
│   └── game-logic/   # pure TS: rules, board, sequence detection, validation
├── bruno/            # Bruno API collection
└── (tooling at root: tsgo + TS6, oxlint, oxfmt, vitest)
```

Game routes stay client-rendered inside Next.js (one web app, one deploy, shared auth + tRPC client); a Vite SPA split remains an escape hatch. Web and RN share `game-logic` + tRPC client, not UI.

## Stack (validated 2026-06-11)

| Layer | Choice | Notes |
|---|---|---|
| Monorepo | pnpm workspaces | |
| Language | **TypeScript: side-by-side** — `@typescript/native-preview` (tsgo) as the type gate, `typescript@6` present for Next.js builds | tsgo beta (GA ~July 2026); Next 16 build still calls stable TS compiler API; known pnpm workspace-references bug. Flip to tsgo-only at GA. Fallback = delete one devDependency. |
| Lint | Oxlint (stable v1.x) | **Hold** its type-aware alpha (`oxlint-tsgolint`) until stable |
| Format | Oxfmt (beta v0.5x) | 100% Prettier parity; import sorting + Tailwind class sorting built in, enable in config |
| Tests | Vitest (Jest later for RN) | No tsgo interaction — transpiles independently |
| Backend | Fastify (v5+) standalone service | tRPC v11 requires Fastify v5 |
| API layer | tRPC v11 | End-to-end types for both clients |
| Real-time | **tRPC subscriptions over WebSocket** (`wsLink` + `applyWSSHandler`, Fastify adapter) | Chosen over tRPC's newer SSE default: server `close` event = disconnect detection (pause timers), first-class Fastify support, native WS in RN (SSE needs 3 fragile polyfills). Use `tracked()` + `lastEventId` for reconnect resume; ~20s heartbeat (also required by host proxies). |
| API testing | Bruno | Collection in `bruno/`, built alongside endpoints |
| Database | **Neon confirmed** | Post-Databricks acquisition improved: storage −80%, free tier 100 CU-hr/mo. Free tier fine to start. |
| DB driver | `postgres.js` (or `pg`) | **Not** the Neon serverless driver — that's for edge functions, wrong model for a long-lived server. Direct (non-pooler) connection string. |
| Auth | **Better Auth** (replaces Lucia — deprecated 3/2025, now a learning resource) | Only option with official Fastify + Next.js + Expo/SecureStore support. v1.6, YC-backed. Pin minors, upgrade deliberately; watch Expo-plugin bundling issue (#7603) for Session 2. Roll-your-own (Lucia guides + Arctic) is the exit path. |
| Web | Next.js 16 + React 19, React Compiler on | |
| Styling | Tailwind (web) / NativeWind (RN later) | |
| Animation | Motion (web) / Reanimated (RN later) | Board/cards are SVG + positioning + animation |
| State (web) | tRPC built-in caching | No React Query on web |
| Deploy — web | Vercel Hobby | Client-rendered game routes fit limits comfortably; route game traffic to the API host, not Route Handlers |
| Deploy — API | **Railway Hobby** (~$5/mo) | Best dashboard UX; keep "Serverless" sleep toggle OFF; WS heartbeat covers its idle-drop quirk. Render ($7 flat) / Fly.io (~$4–6, Docker) are afternoon-swap escape hatches. Kuberns evaluated and rejected (immature, ~$22/mo minimum). |
| Region | Neon `aws-us-east-1` + Railway US East | Co-locate DB and API (sub-5ms vs 15–80ms cross-region) |

## Requirements

Canonical decisions live in **`rules-and-flows.md`** — official-rules encoding, player counts (2/3/4/6, deliberate cap below the official 12), digital adaptations (auto-draw, per-mode dead cards, creator-set turn timers), edge-case rulings (double-sequence instant win, tap-to-lock >5 runs, unplayable one-eyed jacks, per-turn dead-card evaluation), info visibility (last-played + Round N only), per-game play mode, lobby self-sort teams, concede/rematch, login-to-create, the 9-screen MVP inventory, and server-authoritative offline handling.

## Data Model (Postgres)

Game sessions (roster, turn, status, expiry) · board state with **chip lock state** (sequence membership — required for one-eyed-jack validation and sequence reuse) · users/auth (Better Auth manages its schema) · game history + outcomes · win-loss aggregates **including head-to-head per-opponent** · move log (replays later, chat post-MVP). Client-only: ephemeral UI state.

## Game Flow & Persistence

- **Auto-save (active games):** any disconnect → auto-save, 1-hour rejoin window, game freezes, timer pauses; cleaned up if no one rejoins.
- **Save & exit:** explicit action persists 1 week. Mobile prompts on exit; web relies on auto-save for tab-close.
- **Resume rule:** all original players must rejoin.
- **Concede:** any player may concede; their team takes the recorded loss, game ends immediately.

## Auth & Guest Model

- Persistence (saves, history, records) requires login. **Creating a game requires login.**
- Guests join via invite link, play ephemerally, cannot save.
- Email/password + social via Better Auth; keep signup minimal.

## Sessions & Matchmaking

MVP is invite-only (link/code). Random matchmaking is future work; session model stays flexible enough to bolt on.

## Legacy Salvage (from codebase exploration, 2026-06-11)

- **`utils/game.js`** — pure, Firebase-free. `boardMap` (10×10) extract as-is; row/column/diagonal scanners rewrite-as-reference. **Gaps the rewrite must fill: no jack logic, no win condition, no corner-as-wild, zero tests.**
- **52 SVG card faces** (`public/cards/`) extract as-is — LGPL 3, attribution required; face cards 100–230 KB, consider optimizing. Dedupe `10*.svg`/`T*.svg` aliases.
- **Board component** — reference only (CSS Grid 10×10, chip overlay, card rotation trick). No hand/deck/turn/win UI exists.
- **Scrub `firebase-service-key-sequence-staging.json`** from the repo (committed GCP service key) and remove legacy Firebase/Firestore code during cleanup.

## Operator Pre-Flight Checklist (complete before implementation)

So the agent runs unblocked end-to-end and hands over a testable game:

- **Neon** — create project in `aws-us-east-1`; connection string (direct, non-pooler) into env; Neon MCP configured.
- **Better Auth** — generate `BETTER_AUTH_SECRET`; create OAuth apps for any launch social providers (or defer to email/password only) and capture client IDs/secrets.
- **Railway** — project + service created (US East), API token for deploys.
- **Vercel** — repo linked, token available.
- **GitHub** — repo state as-is is fine; agent owns workspace scaffolding inside the OAT plan.
- **Env files** — all of the above in `.env` / `.env.local` at agreed paths.
- **Bruno** — nothing needed beyond the planned `bruno/` directory; agent scaffolds.
- **OAT** — `web-mvp` project active (done); design + plan phases precede implementation.

## Open Questions

- **Monetization** — undecided; hosting costs scale with players. Not blocking MVP.
- **Design-phase items:** data model detail + API surface, screen wireframes, hard-mode dead-card turn-in gesture, mobile drag ergonomics, move-rejection feedback.

## Next Steps

1. ✅ Discovery complete (this doc + `rules-and-flows.md`).
2. **Design phase** (`oat-project-design` on `web-mvp`): data model, API surface, wireframes.
3. Plan phase → phased autonomous implementation → testable game.
