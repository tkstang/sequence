---
id: bl-821f
title: 'Explore symbolic Sequence board rendering'
status: open # open | in_progress | closed | wont_do
priority: medium # urgent | high | medium | low | none
scope: feature # idea | task | feature | initiative
scope_estimate: M # XS | S | M | L | XL | XXL
labels: [web, game-ui, visual-design]
assignee: null
created: '2026-06-14T00:05:00.000Z'
updated: '2026-06-14T00:05:00.000Z'
associated_issues: []
oat_template: false
oat_template_name: backlog-item
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
