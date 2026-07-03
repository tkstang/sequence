---
id: BL-260703-universal-links-for-game
title: 'Universal links for game invites'
status: open # open | in_progress | closed | wont_do
priority: medium # urgent | high | medium | low | none
scope: feature # idea | task | feature | initiative
scope_estimate: M # XS | S | M | L | XL | XXL
labels: [mobile, web]
assignee: null
created: '2026-07-03T01:09:33Z'
updated: '2026-07-03T01:09:33Z'
associated_issues: [{ type: project, ref: 'mobile-mvp' }]
oat_template: true
oat_template_name: backlog-item
---

## Description

Make https invite links open the mobile app directly: tapping a shared invite
URL (e.g. from iMessage) should deep-link into the app's join flow when
installed, and fall back to the web join page otherwise. Deferred from
`mobile-mvp` v1, which ships manual invite-code entry + app-scheme deep links
only. Requires an `apple-app-site-association` file served by the Vercel web
deployment, associated-domains entitlement in the Expo config, and route
handling shared with the scheme-link path.

## Acceptance Criteria

- AASA file served correctly from the production web origin
- Tapping an invite URL on iOS with the app installed opens the app join flow
- Without the app installed, the same URL lands on the web join page unchanged
- App-scheme deep links continue to work
