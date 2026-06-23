---
oat_status: complete
oat_ready_for: oat-project-implement
oat_blockers: []
oat_last_updated: 2026-06-22
oat_phase: plan
oat_phase_status: complete
oat_plan_hill_phases: []
oat_plan_parallel_groups: []
oat_plan_source: quick
oat_import_reference: null
oat_import_source_path: null
oat_import_provider: null
oat_generated: false
---

# Implementation Plan: stylex-ui-refresh

> **Captured project.** Created retroactively with `oat-project-capture` from the
> `stylex` branch; the original 14-task / 3-phase work is recorded in
> **`implementation.md`** and **`design.md`** (not re-authored here). The only
> forward plan below is the **Review Fixes** phase, added from the final code
> review (`oat-project-review-receive`).

**Commit Convention:** `{type}({scope}): {description}`

---

## Phase p-rev1: Review Fixes (final code review)

Source: `reviews/archived/final-review-2026-06-22.md` (final / code).

### Task prev1-t01: (review) Exclude the `/dev` playground from the production bundle

**Files:**

- Modify: `apps/web/src/app/dev/layout.tsx` (and/or the `/dev` + `/dev-frame`
  route entrypoints / playground shell imports)

**Step 1: Understand the issue**

Review finding (I1): The production guard lives in the `/dev` **layout**, which
runs after the playground pages and their static imports are already in the route
graph. `next start` returns `404` for `/dev`, `/dev/board`, and `/dev-frame/board`,
but the 404 response body still includes the playground Flight payload
(`Component playground`, section links) and route chunks — contradicting the
"development-only / never ships to users" claim in `design.md` and `AGENTS.md`.
Location: `apps/web/src/app/dev/layout.tsx:107`.

**Step 2: Implement fix**

Move the production guard ahead of any playground module import. A practical shape:
a minimal server layout/page that checks `process.env.NODE_ENV === 'production'`
and calls `notFound()` **before** dynamically importing the playground shell /
stories (so the playground modules are not statically pulled into the production
route graph), or move the playground out of the production `app` route tree and
expose it through a dev-only entry. Apply to both `/dev` and `/dev-frame`.

**Step 3: Verify**

```bash
pnpm --filter @sequence/web typecheck
pnpm --filter @sequence/web test
pnpm --filter @sequence/web build
pnpm --filter @sequence/web exec next start --port 3210
curl -i -s http://localhost:3210/dev | sed -n '1,40p'
curl -i -s http://localhost:3210/dev/board | sed -n '1,40p'
curl -i -s http://localhost:3210/dev-frame/board | sed -n '1,40p'
```

Expected: `/dev*` return `404` AND the response bodies contain only the generic
404 payload — no playground text (`Component playground`, section links) or
playground chunks. Dev (`next dev`) still serves the playground normally.

**Step 4: Commit**

```bash
git commit -m "fix(prev1-t01): exclude /dev playground from the production bundle"
```

---

### Task prev1-t02: (review) Fix the misleading PostCSS config comment

**Files:**

- Modify: `apps/web/postcss.config.mjs`

**Step 1: Understand the issue**

Review finding (m1): the comment says "`apps/web` is an ESM package," but
`package.json` intentionally removed `"type": "module"` for the Babel-config
workaround. The file is ESM because it is `postcss.config.mjs`; the package is
not. Location: `apps/web/postcss.config.mjs:3`.

**Step 2: Implement fix**

Reword the comment to state that the PostCSS config itself is ESM (`.mjs`) and
uses `createRequire` to load the CommonJS Babel config — and that the package is
intentionally not `"type": "module"`.

**Step 3: Verify**

```bash
pnpm --filter @sequence/web build
```

Expected: build still compiles (comment-only change).

**Step 4: Commit**

```bash
git commit -m "docs(prev1-t02): clarify PostCSS/Babel module-mode comment"
```

---

## Reviews

| Scope  | Type     | Status          | Date       | Artifact                                    |
| ------ | -------- | --------------- | ---------- | ------------------------------------------- |
| final  | code     | fixes_completed | 2026-06-22 | reviews/archived/final-review-2026-06-22.md |
| spec   | artifact | n/a         | -          | - (quick mode — no spec)                      |
| design | artifact | n/a         | -          | -                                             |

**Status values:** `pending` → `received` → `fixes_added` → `fixes_completed` → `passed`

---

## Implementation Complete

**Summary:**

- Original captured work: 14 tasks across 3 phases (see `implementation.md`).
- Review Fixes (`p-rev1`): 2 tasks — `prev1-t01` (prod `/dev` exclusion),
  `prev1-t02` (PostCSS comment).

**Total: 16 tasks** (14 captured + 2 review fixes)

---

## References

- Design: `design.md`
- Discovery: `discovery.md`
- Implementation: `implementation.md`
- Review: `reviews/archived/final-review-2026-06-22.md`
