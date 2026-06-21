---
bundle_version: 1
analysis_artifact: ../agent-instructions-2026-06-21-1640.md
manifest: recommendations.yaml
pack_count: 11
generated_at: 2026-06-21
---

# Agent Instructions Analysis Bundle Summary

Companion bundle for `../agent-instructions-2026-06-21-1640.md`.

## Purpose

This bundle is the machine-oriented handoff for `oat-agent-instructions-apply`.
The markdown analysis artifact remains the reviewer-facing summary. If they diverge, the bundle wins for generation.

## Recommendation Index

| ID        | Action | Target                          | Provider / Format            | Pack               | Notes                                                                 |
| --------- | ------ | ------------------------------- | ---------------------------- | ------------------ | --------------------------------------------------------------------- |
| `rec-001` | update | `AGENTS.md`                     | agents_md / AGENTS.md        | `packs/rec-001.md` | Snapshot + canonical commands + import convention + References        |
| `rec-002` | create | `CLAUDE.md`                     | claude / import shim         | `packs/rec-002.md` | `@AGENTS.md` — claude provider has no shim (High)                     |
| `rec-003` | create | `bruno/CLAUDE.md`               | claude / import shim         | `packs/rec-003.md` | `@AGENTS.md` for bruno subtree                                        |
| `rec-004` | create | `apps/web/AGENTS.md`            | agents_md / AGENTS.md        | `packs/rec-004.md` | Web delta: test split, type-only AppRouter, prop-driven leaves        |
| `rec-005` | create | `apps/web/CLAUDE.md`            | claude / import shim         | `packs/rec-005.md` | Chained with rec-004                                                  |
| `rec-006` | create | `packages/api/AGENTS.md`        | agents_md / AGENTS.md        | `packs/rec-006.md` | API delta: redaction, version guards, IP rule, routes, migrations     |
| `rec-007` | create | `packages/api/CLAUDE.md`        | claude / import shim         | `packs/rec-007.md` | Chained with rec-006                                                  |
| `rec-008` | create | `packages/game-logic/AGENTS.md` | agents_md / AGENTS.md        | `packs/rec-008.md` | Thin delta linking README Design Rules                                |
| `rec-009` | create | `packages/game-logic/CLAUDE.md` | claude / import shim         | `packs/rec-009.md` | Chained with rec-008                                                  |
| `rec-010` | update | `bruno/AGENTS.md`               | agents_md / AGENTS.md        | `packs/rec-010.md` | Add `bruno/README.md` link (Criterion 14 polish)                      |
| `rec-011` | create | `.claude/rules/` + `.cursor/rules/` | claude+cursor / glob-rule | `packs/rec-011.md` | ask_user — optional test-authoring glob rules                         |

## Validation Rules

- Every recommendation in `recommendations.yaml` appears in this table.
- Every listed pack file exists under `packs/`.
- Recommendation IDs match across the markdown artifact, the manifest, and the pack filename.
- Apply may use this summary for quick context, but it should load the manifest and matching pack before generating output.
- `rec-011` requires user confirmation (`disclosure: ask_user`) before any provider glob rule is generated.
