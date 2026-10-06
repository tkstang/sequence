---
id: BL-260703-maestro-e2e-regression-suite
title: 'Maestro e2e regression suite for mobile'
status: open # open | in_progress | closed | wont_do
priority: medium # urgent | high | medium | low | none
scope: feature # idea | task | feature | initiative
scope_estimate: M # XS | S | M | L | XL | XXL
labels: [mobile, testing]
assignee: null
created: '2026-07-03T01:09:33Z'
updated: '2026-07-03T01:09:33Z'
associated_issues: [{ type: project, ref: 'mobile-mvp' }]
oat_template: true
oat_template_name: backlog-item
---

## Description

Add a Maestro YAML-flow e2e suite for `apps/mobile` on iOS Simulators — the
mobile analog of the web's Playwright gate. Deliberately deferred out of
`mobile-mvp` v1: while the UI is churning, interactive agent verification
(Expo MCP / Argent screenshots and taps) covers development verification;
Maestro earns its place as the regression gate once parity ships and the UI
stabilizes — the same sequencing Playwright had on web. Flows should lean on
the testID/accessibility identifiers designed during mobile-mvp.

## Acceptance Criteria

- Core flows automated: auth, create game, invite join, make a move, game over
- Suite runs against a local dev/release build on a booted simulator with one command
- CI/pre-handoff placement decided and documented in `docs/testing.md`
- Flows use stable accessibility/testID selectors, not coordinates
