---
id: BL-260703-adopt-eas-update-for-ota
title: 'Adopt EAS Update for OTA delivery'
status: open # open | in_progress | closed | wont_do
priority: medium # urgent | high | medium | low | none
scope: feature # idea | task | feature | initiative
scope_estimate: M # XS | S | M | L | XL | XXL
labels: [mobile]
assignee: null
created: '2026-07-03T01:09:33Z'
updated: '2026-07-03T01:09:33Z'
associated_issues: [{ type: project, ref: 'mobile-mvp' }]
oat_template: true
oat_template_name: backlog-item
---

## Description

Adopt EAS Update so JS/asset changes ship over-the-air to TestFlight and
production installs of `apps/mobile` without a new store build. Deferred from
the `mobile-mvp` project (its final phase ships TestFlight builds only) but
explicitly wanted. SDK 55+ Hermes bytecode diffing cuts update payloads ~75%,
making this cheap to run. Requires channel/branch strategy (e.g. preview vs
production), `expo-updates` runtime policy decisions, and a documented rollout
flow.

## Acceptance Criteria

- `expo-updates` configured with a channel strategy mapped to build profiles
- Runtime version policy chosen and documented (compatibility with native builds)
- An OTA update successfully delivered to a TestFlight build and verified
- Rollout/rollback flow documented in `docs/deployment.md`
