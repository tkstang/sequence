---
oat_current_task: null
oat_last_commit: null
oat_blockers: []
associated_issues: [] # [{type: backlog|project|jira|linear, ref: "identifier"}]
oat_kind: implementation # implementation | coordination; coordination parents may use oat_phase: decomposition
oat_parent: null # optional child-only coordination parent slug
oat_siblings: [] # optional child-only sibling slugs
oat_depends_on: [] # optional child-only sibling dependencies
oat_children: [] # optional coordination-parent child slugs
oat_hill_checkpoints: [final] # Configured: which phases require human-in-the-loop lifecycle approval
oat_hill_completed: [] # Progress: which HiLL checkpoints have been completed
oat_parallel_execution: false
oat_phase: discovery # Current phase: discovery | spec | design | plan | implement | decomposition
oat_phase_status: complete # Status: in_progress | complete | pr_open
# oat_orchestration_retry_limit: 2  # optional; override fix-loop retry limit (range 0-5)
# oat_dispatch_ceiling: # optional project override for provider-aware dispatch ceilings
#   provider: codex # codex | claude
#   value: high # codex: low|medium|high|xhigh; claude: haiku|sonnet|opus
#   source: project-state
oat_workflow_mode: spec-driven # spec-driven | quick | import
oat_workflow_origin: native # native | imported
oat_docs_updated: null # null | skipped | complete — documentation sync status
oat_pr_status: null # null | ready | open | closed | merged — actual PR state for the current project
oat_pr_url: null # null | string — tracked PR URL when a PR exists
oat_project_created: "2026-06-12T02:41:28.504Z" # ISO 8601 UTC timestamp — set once at project creation
oat_project_completed: null # ISO 8601 UTC timestamp — set when project is completed/archived
oat_project_state_updated: "2026-06-12T03:00:00.000Z" # ISO 8601 UTC timestamp — updated on every state.md mutation
oat_generated: false
---

# Project State: web-mvp

**Status:** Discovery
**Started:** 2026-06-12
**Last Updated:** 2026-06-12

## Current Phase

Discovery — **complete**. Seeded from the 2026-06-11 brainstorm session; canonical detail in `.oat/repo/reference/planning/2026-rewrite/` (`discovery.md`, `rules-and-flows.md`, `code-organization.md`). Ready for `oat-project-design`.

## Artifacts

- **Discovery:** `discovery.md` (complete — ready for oat-project-design)
- **Spec:** `spec.md` (scaffolded template — authored inline by `oat-project-design`)
- **Design:** `design.md` (scaffolded template — not started)
- **Plan:** `plan.md` (scaffolded template — not started)
- **Implementation:** `implementation.md` (scaffolded template — not started)

## Progress

- ✓ Discovery started
- ✓ Downstream lifecycle files scaffolded
- ✓ Discovery completed (seeded from brainstorm: requirements + stack validation)

## Blockers

None

## Next Milestone

Design phase (`oat-project-design`): data model, API surface, screen wireframes. Operator pre-flight checklist (see planning `discovery.md`) completes before implementation.
