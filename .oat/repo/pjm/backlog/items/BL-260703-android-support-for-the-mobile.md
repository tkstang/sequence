---
id: BL-260703-android-support-for-the-mobile
title: 'Android support for the mobile app'
status: open # open | in_progress | closed | wont_do
priority: medium # urgent | high | medium | low | none
scope: feature # idea | task | feature | initiative
scope_estimate: L # XS | S | M | L | XL | XXL
labels: [mobile, android]
assignee: null
created: '2026-07-03T01:09:33Z'
updated: '2026-07-03T01:09:33Z'
associated_issues: [{ type: project, ref: 'mobile-mvp' }]
oat_template: true
oat_template_name: backlog-item
---

## Description

Bring `apps/mobile` to verified Android support. `mobile-mvp` is deliberately
iOS-first: Expo keeps Android structurally close (same codebase, prebuild
handles the native project), but nothing is verified there in v1. This item
covers emulator/device verification, Android-specific UI polish (edge-to-edge,
back gesture, keyboard behavior), theming parity, and triage of any
platform-specific issues in auth (SecureStore), WebSockets, or gestures.
Play Store distribution is a separate decision once this lands.

## Acceptance Criteria

- App builds and runs on an Android emulator via the standard dev workflow
- Full gameplay parity verified (auth, join, realtime play, pass-and-play)
- Android-specific UI issues triaged and fixed or explicitly waived
- Platform caveats documented in the mobile workspace docs
