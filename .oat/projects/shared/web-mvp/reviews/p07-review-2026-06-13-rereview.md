---
oat_generated: true
oat_generated_at: 2026-06-13
oat_review_scope: p07
oat_review_type: code
oat_review_invocation: manual
oat_project: .oat/projects/shared/web-mvp
oat_rereview_of: reviews/p07-review-2026-06-13.md
---

# Code Review: p07 Re-review

**Reviewed:** 2026-06-13
**Scope:** p07 only, including the previous p07 blocking NFR2 finding and the p07 review-fix commits after `2e10f64`
**Files reviewed:** 25 (15 changed files plus required project artifacts, previous review, and active-control/realtime context)
**Commits:** `519e21f`, `8afd6a3`, `acbdec9`, `10d87fc`, `96c9148`, `d339810`

## Findings

### Critical

None

### Important

None

### Medium

None

### Minor

- **Minor: Physical-phone smoke remains unperformed** (`.oat/projects/shared/web-mvp/handoff.md:102`)
  - Issue: p07-t04 requested a 375px mobile pass on a real phone (`.oat/projects/shared/web-mvp/plan.md:844`), and the handoff still records that the production mobile pass used an automated Pixel 5 / 375px viewport rather than a physical phone (`.oat/projects/shared/web-mvp/handoff.md:106`, `.oat/projects/shared/web-mvp/handoff.md:155`). This does not block p07 because NFR3's acceptance criterion is complete playability at about a 375px-wide viewport (`.oat/projects/shared/web-mvp/spec.md:201`, `.oat/projects/shared/web-mvp/spec.md:205`), and the prior p07 review already treated the physical-phone item as a minor caveat rather than the p07 blocker (`.oat/projects/shared/web-mvp/reviews/p07-review-2026-06-13.md:35`).
  - Suggestion: Run one physical mobile browser smoke before broader operator playtesting and append the result to `handoff.md`.
  - Requirement: NFR3

## Disposition

**p07 disposition:** Pass.

The original blocking NFR2 finding is resolved. The previous review correctly failed p07 because production `game.makeMove` probes missed the ~500ms server-processing target (`.oat/projects/shared/web-mvp/reviews/p07-review-2026-06-13.md:24`, `.oat/projects/shared/web-mvp/spec.md:194`, `.oat/projects/shared/web-mvp/spec.md:198`). The current handoff and implementation records now show the review-fix path: Railway replica placement corrected to one `us-east4-eqdc4a` replica, server timing exposed, `game.makeMove` collapsed to one joined state load plus one atomic write/event CTE, and a short auth-mutation-invalidated session-user cache added (`.oat/projects/shared/web-mvp/handoff.md:31`, `.oat/projects/shared/web-mvp/handoff.md:32`, `.oat/projects/shared/web-mvp/handoff.md:104`, `.oat/projects/shared/web-mvp/implementation.md:800`).

The final recorded production smoke after the lifecycle redeploy shows `game.makeMove` at `Server-Timing: app;dur=45.6` and versioned `game.concede` at `app;dur=49.8`, both well under the NFR2 server-processing target (`.oat/projects/shared/web-mvp/handoff.md:104`, `.oat/projects/shared/web-mvp/handoff.md:105`, `.oat/projects/shared/web-mvp/handoff.md:145`). Reviewer non-mutating live checks also confirmed API `/health` returned 200 from `railway/us-east4-eqdc4a` with server timing headers and Vercel `/ping` returned 200. No new blocking issue was found.

## Requirements/Design Alignment

**Evidence sources used:** `.oat/projects/shared/web-mvp/spec.md`, `.oat/projects/shared/web-mvp/design.md`, `.oat/projects/shared/web-mvp/plan.md`, `.oat/projects/shared/web-mvp/implementation.md`, `.oat/projects/shared/web-mvp/handoff.md`, `.oat/projects/shared/web-mvp/state.md`, `.oat/projects/shared/web-mvp/reviews/p07-review-2026-06-13.md`, changed files in `2e10f64..d339810`, and non-mutating live endpoint checks.

### Requirements Coverage

| Requirement / Task | Status | Notes |
| --- | --- | --- |
| p07-t01 API Dockerfile + Railway config | implemented | Not changed in the review-fix range; prior p07 review accepted this surface. |
| p07-t02 Railway deploy | implemented | Handoff records current API URL, deployment IDs, current single `us-east4-eqdc4a` placement, predeploy migration success, healthcheck, and WS upgrade (`.oat/projects/shared/web-mvp/handoff.md:17`, `.oat/projects/shared/web-mvp/handoff.md:31`, `.oat/projects/shared/web-mvp/handoff.md:35`). Reviewer rechecked public `/health` successfully. |
| p07-t03 Vercel deploy | implemented | Handoff records Vercel deployment `dpl_3EgH16neQoi79NZmeHfHxarjgB2v`, current deployment URL, and production alias (`.oat/projects/shared/web-mvp/handoff.md:87`, `.oat/projects/shared/web-mvp/handoff.md:90`). Reviewer rechecked `https://sequence-cyan.vercel.app/ping` successfully. |
| p07-t04 Production smoke + checks | implemented with caveat | Functional smoke, forged-XFF check, tier audit, NFR2 server-timing smoke, and automated 375px viewport smoke are recorded. The only caveat is physical phone not performed. |
| p07-t05 Operator handoff notes | implemented | Handoff includes live URLs, env checklists, FR/NFR operator scripts, known limitations, and follow-ups without secrets. |
| NFR2 Real-time responsiveness | implemented | Server-side `game.makeMove` and versioned `game.concede` timings are recorded under 50ms after review-fix deploys, satisfying the under ~500ms server-processing target. |
| NFR3 Responsive design | implemented with caveat | Automated 375px viewport evidence satisfies the written NFR3 acceptance criterion; physical phone remains a minor caveat. |
| NFR5 Security hygiene | implemented | Review-fix retained cross-site cookie/CORS posture and auth cache invalidation on auth mutations (`packages/api/src/server.ts:78`, `packages/api/src/server.ts:143`, `packages/api/src/trpc.ts:78`). |
| NFR6 Hobby-tier cost envelope | implemented | Handoff records one Vercel Hobby project, one Railway API service, Neon Postgres, and no paid-tier-only dependency (`.oat/projects/shared/web-mvp/handoff.md:108`, `.oat/projects/shared/web-mvp/handoff.md:149`). |
| NFR7 Type safety | implemented | API and web typechecks passed during this review. |

### Original Blocking Finding

The NFR2 blocker is resolved:

- `packages/api/src/server.ts:78` exposes `Server-Timing` and `X-Sequence-Server-Duration-Ms` to the web origin, and `packages/api/src/server.ts:100` stamps per-request server duration.
- `packages/api/src/trpc.ts:69` adds a 10-second session-user cache, and `packages/api/src/server.ts:143` clears it on auth mutations so logout/revocation paths are not hidden by the cache.
- `packages/api/src/game/routes/make-move.ts:76` authorizes `game.makeMove` from a single joined state/player load instead of the generic repeated-read middleware path.
- `packages/api/src/game/state-mapping.ts:401` loads game state and player identity rows in one SQL round trip; `packages/api/src/game/state-mapping.ts:498` persists state and appends events in one atomic CTE.
- `packages/api/src/game/move-engine.ts:218` preserves the existing version guard and broadcasts post-commit events with the bumped version after the optimized persistence path.

The lifecycle regression found during the fix loop is also resolved:

- `packages/api/src/game/routes/save-and-exit.ts:27` and `packages/api/src/game/routes/concede.ts:27` require the caller's current `version`.
- Both routes pass that caller-supplied version into `persistLifecycleTransition` rather than using a fresh just-read DB version (`packages/api/src/game/routes/save-and-exit.ts:65`, `packages/api/src/game/routes/concede.ts:64`).
- The web active controls send `state.version` for both Save & exit and Concede (`apps/web/src/app/game/[id]/page.tsx:377`).
- `packages/api/src/game/routes/lifecycle.test.ts:165` races `game.makeMove(version: 1)` against `game.concede(version: 1)` and asserts exactly one success and one `CONFLICT`, preventing the lost-transition regression.

### Extra Work (not in declared requirements)

No significant scope creep. Server timing, the make-move hot-path optimization, session caching, and lifecycle version input are directly tied to closing the p07 NFR2 blocker and the review-fix regression.

## Verification Commands

Commands run during this rereview:

```bash
git status --short
git log --oneline --reverse 2e10f64..HEAD
git diff --name-only 2e10f64..HEAD
git diff --check 2e10f64..HEAD
curl -fsS -D - https://sequence-api-production-8687.up.railway.app/health -o /tmp/sequence-api-health.out
curl -fsS -D - https://sequence-cyan.vercel.app/ping -o /tmp/sequence-web-ping.out
pnpm --filter @sequence/api exec vitest run src/game/routes/lifecycle.test.ts
pnpm --filter @sequence/api exec vitest run src/game/routes/make-move.test.ts src/user/auth.test.ts
pnpm --filter @sequence/api exec vitest run src/test/full-game.e2e.test.ts
pnpm --filter @sequence/api typecheck
pnpm --filter @sequence/web typecheck
pnpm exec oxlint packages/api/src/server.ts packages/api/src/trpc.ts packages/api/src/game/routes/make-move.ts packages/api/src/game/move-engine.ts packages/api/src/game/state-mapping.ts packages/api/src/game/routes/concede.ts packages/api/src/game/routes/save-and-exit.ts packages/api/src/game/routes/lifecycle.test.ts packages/api/src/game/routes/make-move.test.ts packages/api/src/user/auth.test.ts 'apps/web/src/app/game/[id]/page.tsx'
pnpm test
```

Observed results:

- API `/health`: HTTP 200, body `{"status":"ok"}`, `server-timing: app;dur=0.1`, `x-sequence-server-duration-ms: 0.1`, `x-railway-edge: railway/us-east4-eqdc4a`.
- Vercel `/ping`: HTTP 200.
- `lifecycle.test.ts`: 9/9 passed.
- `make-move.test.ts` + `auth.test.ts`: 11/11 passed.
- Isolated `full-game.e2e.test.ts`: 1/1 passed.
- API typecheck: passed.
- Web typecheck: passed.
- Touched-file `oxlint`: passed.
- Full `pnpm test`: 58 files / 386 tests passed.

Verification not rerun during this rereview:

- Mutating production signup/login, guest join, full pass-and-play, two-browser realtime, `game.makeMove`, and `game.concede` were not rerun by the reviewer to avoid creating additional production game data. Review relied on the current `handoff.md` production smoke records for those mutating checks and independently rechecked only non-mutating live endpoints.
- Railway/Vercel deployment status was verified through recorded handoff evidence plus current live endpoints; the local `railway` and `vercel` CLIs were not available in this shell.

## Recommended Next Step

Update the p07 review row to passed and proceed to the configured final HiLL checkpoint / final review workflow.
