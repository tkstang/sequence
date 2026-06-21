# OAT Backlog Index

> Generated backlog table lives inside the managed section below. Keep curated narrative updates in the overview section so CLI regeneration stays safe.

## Curated Overview

- `bl-821f` captures a follow-up visual exploration for a more physical-board-like game surface; keep it separate from the current card-cropping hotfix.
- `bl-d319` is a DX follow-up to add a dev-only UI playground for fast component iteration; deferred out of the web-mvp final PR to keep it focused. Cheap given components are already prop-driven with a single `GameSnapshotView` shape, and its fixtures would seed a future Storybook adoption.
- `bl-3fcf` migrates imports to absolute aliases (`@db/schema/games`) and drops file extensions. The blocker is a runtime decision, not the edits: the API runs `.ts` directly on native Node, which resolves neither tsconfig `@` aliases nor extensionless paths — so it needs `tsx` (recommended), a `tsc-alias` build step, or native `#`-imports. Until then the current explicit-`.ts`-extension convention is documented in the root `AGENTS.md`.

<!-- OAT BACKLOG-INDEX -->
| ID | Title | Status | Priority | Scope | Estimate |
| --- | --- | --- | --- | --- | --- |
| bl-d319 | Dev-only UI component playground for fast UI iteration | open | medium | task | S |
| bl-821f | Explore symbolic Sequence board rendering | open | medium | feature | M |
| bl-3fcf | Migrate to absolute path-alias imports (drop relative paths and file extensions) | open | medium | task | M |
<!-- END OAT BACKLOG-INDEX -->

## Notes

- Active item files live in `backlog/items/`
- Archived item files live in `backlog/archived/`
- Historical completions are summarized in `backlog/completed.md`
