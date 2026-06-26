# OAT Backlog Index

> Generated backlog table lives inside the managed section below. Keep curated narrative updates in the overview section so CLI regeneration stays safe.

## Curated Overview

- `BL-260614-explore-symbolic-sequence` captures a follow-up visual exploration for a more physical-board-like game surface; keep it separate from the current card-cropping hotfix.
- `BL-260621-dev-only-ui-component` is a DX follow-up to add a dev-only UI playground for fast component iteration; deferred out of the web-mvp final PR to keep it focused. Cheap given components are already prop-driven with a single `GameSnapshotView` shape, and its fixtures would seed a future Storybook adoption.
- `BL-260621-evaluate-and-adopt-storybook` is the deferred Storybook evaluation that `BL-260621-dev-only-ui-component` references — a planning/go-no-go item, not a commitment. Low priority while the `/dev` playground covers fast iteration; revisit if we want richer controls, a11y, or visual-regression testing. Designed to reuse the same `game-fixtures.ts` fixtures so there is no duplication if we adopt it.
- `BL-260621-migrate-to-absolute-path-alias` migrates imports to absolute aliases (`@db/schema/games`) and drops file extensions. The blocker is a runtime decision, not the edits: the API runs `.ts` directly on native Node, which resolves neither tsconfig `@` aliases nor extensionless paths — so it needs `tsx` (recommended), a `tsc-alias` build step, or native `#`-imports. Until then the current explicit-`.ts`-extension convention is documented in the root `AGENTS.md`.

<!-- OAT BACKLOG-INDEX -->
| ID | Title | Status | Priority | Scope | Estimate |
| --- | --- | --- | --- | --- | --- |
| BL-260621-dev-only-ui-component | Dev-only UI component playground for fast UI iteration | in_progress | medium | task | S |
| BL-260614-explore-symbolic-sequence | Explore symbolic Sequence board rendering | open | medium | feature | M |
| BL-260621-migrate-to-absolute-path-alias | Migrate to absolute path-alias imports (drop relative paths and file extensions) | open | medium | task | M |
| BL-260621-evaluate-and-adopt-storybook | Evaluate and adopt Storybook for web UI components | open | low | feature | M |
<!-- END OAT BACKLOG-INDEX -->

## Notes

- Active item files live in `backlog/items/`
- Archived item files live in `backlog/archived/`
- Historical completions are summarized in `backlog/completed.md`
