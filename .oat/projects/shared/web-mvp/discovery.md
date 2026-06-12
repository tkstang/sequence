---
oat_status: complete
oat_ready_for: oat-project-design
oat_blockers: []
oat_last_updated: 2026-06-12
oat_generated: false
---

# Discovery: web-mvp

## Phase Guardrails (Discovery)

Discovery is for requirements and decisions, not implementation details.

- Prefer outcomes and constraints over concrete deliverables (no specific scripts, file paths, or function names).
- If an implementation detail comes up, capture it as an **Open Question** for design (or a constraint), not as a deliverable list.

## Initial Request

Full rewrite of the COVID-era Sequence card game (Next.js + Firestore) into a real-time multiplayer web game: hand at the bottom, shared 10×10 board in the middle, live updates as players move. This project covers **Session 1 — backend + web MVP**; React Native (Session 2) becomes its own project afterward. Everything outside `.agents/`, `.claude/`, `.codex/`, `.oat/` is legacy reference to be removed/replaced.

Discovery was completed in an extended brainstorm session (2026-06-11) before this project was scaffolded. The canonical discovery artifacts live in `.oat/repo/reference/planning/2026-rewrite/`:

- **`discovery.md`** — consolidated discovery: target architecture, validated stack table, data model, persistence/auth/session models, legacy salvage inventory, operator pre-flight checklist
- **`rules-and-flows.md`** — requirements decisions: rules encoding, digital adaptations, edge-case rulings, screens inventory, lifecycle flows
- **`code-organization.md`** — structural conventions the build must follow
- **`sequence-game-instructions.pdf`** — official rules (canonical rules source)

This project artifact summarizes; the planning docs are authoritative detail.

## Clarifying Questions

Resolved during the brainstorm session — full decision log with rationale is in `rules-and-flows.md` and the consolidated `discovery.md`. Highlights under Key Decisions below.

## Solution Space

### Approach 1: Single spec-driven OAT project for the web MVP _(Recommended)_

**Description:** One project carrying discovery (done) → design (data model, API surface, wireframes) → phased plan → autonomous implementation with per-phase commits.
**When this is the right choice:** When the build will outlive any single agent session and must be resumable, incrementally testable, and reviewable.
**Tradeoffs:** Lifecycle overhead vs. free-running; mitigated because all planning artifacts already exist.

### Approach 2: Unstructured "one-shot" autonomous build from planning docs

**Description:** Deep brainstorm + design conversation + wireframes, then let the agent run with no project structure (the original directional plan).
**When this is the right choice:** Small builds that fit in one session.
**Tradeoffs:** This build is days of agent time across sessions — continuity would rest on ad-hoc notes. The 2025 modernization attempt stalled exactly this way (a `rewrite.md` work log and a dead scaffold).

### Chosen Direction

**Approach:** Approach 1 — single spec-driven OAT project.
**Rationale:** The upfront work is identical in both approaches; structure only adds value at execution time (resumability via state, incremental testability via phase commits, optional review gates).
**User validated:** Yes — explicitly, after weighing both.

## Key Decisions

1. **Scope:** Web MVP only (backend + web, including mobile-web layout). RN is a separate later project. Player counts 2/3/4/6 (deliberate cap below the official 12). Invite-only sessions; matchmaking is future work.
2. **Architecture:** pnpm monorepo — `apps/web` (Next.js 16, client-rendered game routes), `packages/api` (Fastify v5 + tRPC v11), `packages/game-logic` (pure TS, the only code shared with future RN).
3. **Real-time:** tRPC subscriptions over **WebSocket** (chosen over tRPC's newer SSE default: server-side disconnect detection for timer-pause, first-class Fastify adapter, native RN support). `tracked()`/`lastEventId` reconnect resume; ~20s heartbeat.
4. **Auth:** **Better Auth** (replaces Lucia, which was deprecated 3/2025) — official Fastify + Next.js + Expo support; sessions in our Postgres; login required to create games, guests join ephemerally via invite link.
5. **Database:** Neon Postgres (`aws-us-east-1`), plain `postgres.js`/`pg` driver (not the serverless driver). Data model includes chip lock state (sequence membership), move log, head-to-head aggregates.
6. **TypeScript:** side-by-side — tsgo (`@typescript/native-preview`) as the type gate, `typescript@6` for Next.js builds; flip to tsgo-only at TS7 GA. Oxlint (type-aware alpha held), Oxfmt, Vitest.
7. **Deploy:** Vercel Hobby (web) + Railway US East (API; Render/Fly.io as escape hatches) + Neon.
8. **Rules & flows:** all gameplay decisions settled in `rules-and-flows.md` — auto-draw, per-mode dead-card handling, creator-set turn timers (untimed default), double-sequence instant win, tap-to-lock >5 runs, per-game play mode (default tap-to-reveal vs hard-mode drag), 9-screen MVP inventory, concede/rematch, server-authoritative moves.

## Constraints

- Follow `code-organization.md` conventions: co-located tests/utils, kebab-case (PascalCase for components/classes), dot-extension siblings, domain-driven backend with file-per-route handlers.
- `game-logic` stays pure TS — no framework imports; it is the RN-shared surface.
- Structure everything for the eventual RN client from day one (portable auth, shared tRPC client), but build no RN code.
- Legacy salvage per consolidated discovery: `boardMap` and 52 SVG cards (LGPL 3 attribution) extract as-is; sequence scanners are reference-only — **jack logic, win conditions, corner-as-wild, and tests must be written new**.
- Scrub the committed GCP service key (`firebase-service-key-sequence-staging.json`) and remove legacy Firebase code during cleanup.
- Operator pre-flight checklist (in consolidated discovery) completes before implementation so the build runs unblocked to a testable game.

## Success Criteria

- A logged-in user can create a game (settings: player count/teams, play mode, timer), share an invite link, and play a complete real-time game with 2–6 players including guests.
- All rules from `rules-and-flows.md` enforced server-side; `game-logic` covered by co-located Vitest tests (including jacks, corners, win conditions, sequence locking, dead cards).
- Disconnect → auto-save/rejoin, save & exit, concede, and rematch flows all work.
- All 9 MVP screens present and usable on desktop and mobile web.
- Deployed: web on Vercel, API on Railway, DB on Neon — playable end-to-end by the operator.

## Out of Scope

- React Native app (separate project after web MVP).
- Chat/social, random matchmaking, replay viewer, series scoring, spectator view.
- Monetization (open question, not blocking).

## Deferred Ideas

- Optimistic UI with rollback for the in-flight move — purely client-side layer; protocol already supports it.
- Player counts 8–12 (official rules allow; config-level change later).
- Replay viewer over the move log.
- **Offline local play (web PWA)** — run the `game-logic` reducer client-side with device storage; user wants this as a fast-follow after web MVP, likely before the RN project. Enabled by the design rule that `game-logic` owns the complete turn loop (API is a thin host).

## Open Questions

*(Design-phase items)*

- **Data model & API surface:** full schema + tRPC router design — the core of the design phase.
- **Wireframes:** screen layouts for the 9-screen inventory (visual companion session planned).
- **Hard-mode UX details:** dead-card turn-in gesture, drag ergonomics, move-rejection feedback.

## Assumptions

- Solo operator + agent workflow; hobby budget (~$10–15/mo total infra).
- TS7 GA (~July 2026) will land mid-project, enabling the tsgo-only flip.
- Free tiers (Neon, Vercel) suffice for MVP validation.

## Risks

- **Bleeding-edge tooling (tsgo beta, oxfmt beta):** known workarounds documented; fallback is trivial (side-by-side TS already in place).
  - **Likelihood:** Medium · **Impact:** Low · **Mitigation:** side-by-side install; flip at GA.
- **Better Auth breaking changes / small core team:** pin minor versions, upgrade deliberately; conventional session model keeps roll-your-own as exit path.
  - **Likelihood:** Medium · **Impact:** Medium · **Mitigation:** version pinning; exit path documented.
- **Railway WS idle drops:** heartbeat (required anyway) neutralizes; Render/Fly.io are afternoon swaps.
  - **Likelihood:** Low · **Impact:** Low · **Mitigation:** 20s heartbeat; portable container.

## Next Steps

Spec-driven mode: continue to **`oat-project-design`** (confirms requirements, produces `spec.md` + `design.md`) — the design conversation covers data model, API surface, and wireframes.
