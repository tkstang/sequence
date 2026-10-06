---
id: BL-260703-adopt-sentry-crash-reporting
title: 'Adopt Sentry crash reporting for mobile'
status: open # open | in_progress | closed | wont_do
priority: medium # urgent | high | medium | low | none
scope: task # idea | task | feature | initiative
scope_estimate: S # XS | S | M | L | XL | XXL
labels: [mobile, observability]
assignee: null
created: '2026-07-03T01:51:30Z'
updated: '2026-07-03T01:51:30Z'
associated_issues: [{ type: project, ref: 'mobile-mvp' }]
oat_template: true
oat_template_name: backlog-item
---

## Description

Add crash/error reporting to `apps/mobile` with `@sentry/react-native` after
`mobile-mvp` ships. The mobile-mvp design deliberately defers client-side
monitoring (TestFlight's crash organizer covers the final phase); this item is
the follow-up. Decision recorded during design review: **Sentry only, no
Crashlytics** — Crashlytics requires the Firebase SDK, which Sequence does not
otherwise use (vox-mobile-app carries it because Firebase is already its
auth/messaging backbone); Sentry covers native crashes, JS errors, release
health, and source-map upload in one vendor with a good Expo config plugin.

## Acceptance Criteria

- `@sentry/react-native` integrated via its Expo config plugin; DSN treated as
  public config (per Sentry guidance), enabled only in release/TestFlight
  builds
- Source maps uploaded for symbolicated JS stack traces on EAS builds
- Error boundary and realtime/mutation error paths report with useful context
  (no PII, no hand/card data)
- Operator runbook updated with the Sentry project setup steps
