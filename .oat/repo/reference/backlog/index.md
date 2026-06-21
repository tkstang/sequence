# OAT Backlog Index

> Generated backlog table lives inside the managed section below. Keep curated narrative updates in the overview section so CLI regeneration stays safe.

## Curated Overview

- `bl-821f` captures a follow-up visual exploration for a more physical-board-like game surface; keep it separate from the current card-cropping hotfix.
- `bl-d319` is a DX follow-up to add a dev-only UI playground for fast component iteration; deferred out of the web-mvp final PR to keep it focused. Cheap given components are already prop-driven with a single `GameSnapshotView` shape, and its fixtures would seed a future Storybook adoption.
- `bl-b0e7` is the deferred Storybook evaluation that `bl-d319` references — a planning/go-no-go item, not a commitment. Low priority while the `/dev` playground covers fast iteration; revisit if we want richer controls, a11y, or visual-regression testing. Designed to reuse the same `game-fixtures.ts` fixtures so there is no duplication if we adopt it.

<!-- OAT BACKLOG-INDEX -->
| ID | Title | Status | Priority | Scope | Estimate |
| --- | --- | --- | --- | --- | --- |
| bl-d319 | Dev-only UI component playground for fast UI iteration | in_progress | medium | task | S |
| bl-821f | Explore symbolic Sequence board rendering | open | medium | feature | M |
| bl-b0e7 | Evaluate and adopt Storybook for web UI components | open | low | feature | M |
<!-- END OAT BACKLOG-INDEX -->

## Notes

- Active item files live in `backlog/items/`
- Archived item files live in `backlog/archived/`
- Historical completions are summarized in `backlog/completed.md`
