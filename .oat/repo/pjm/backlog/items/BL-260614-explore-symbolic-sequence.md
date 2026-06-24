---
id: BL-260614-explore-symbolic-sequence
title: Explore symbolic Sequence board rendering
status: open
priority: medium
scope: feature
scope_estimate: M
labels:
  - web
  - game-ui
  - visual-design
assignee: null
created: 2026-06-14T00:05:00.000Z
updated: 2026-06-14T00:05:00.000Z
associated_issues: []
legacy_id: bl-821f
---

## Description

Explore a board-cell rendering style inspired by physical and travel Sequence
boards, where the play surface uses compact rank/suit symbols or simplified card
marks instead of full playing-card SVG faces. The goal is to improve readability
and make the board feel more like the real table object without expanding the
current hotfix scope.

## Acceptance Criteria

- Compare the current full-card board rendering against at least one symbolic
  rank/suit board treatment in desktop and mobile game-route views.
- Preserve gameplay affordances: selectable cells, hover/valid-target states,
  chips, locked chips, winning-cell highlights, and edge/corner orientation.
- Document the recommended direction, including whether symbolic cells should
  fully replace card SVGs on the board or become an optional visual mode.
- If implemented, add focused component coverage and a browser screenshot pass
  covering the board, hand, and player rail together.
