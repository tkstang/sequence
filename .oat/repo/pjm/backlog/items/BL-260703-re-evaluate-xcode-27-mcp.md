---
id: BL-260703-re-evaluate-xcode-27-mcp
title: 'Re-evaluate Xcode 27 MCP server at GA'
status: open # open | in_progress | closed | wont_do
priority: low # urgent | high | medium | low | none
scope: task # idea | task | feature | initiative
scope_estimate: S # XS | S | M | L | XL | XXL
labels: [mobile, tooling, agents]
assignee: null
created: '2026-07-03T01:09:33Z'
updated: '2026-07-03T01:09:33Z'
associated_issues: [{ type: project, ref: 'mobile-mvp' }]
oat_template: true
oat_template_name: backlog-item
---

## Description

At Xcode 27 GA (expected ~Sept 2026), audit whether Apple's Xcode Tools MCP
server (`xcrun mcpbridge`) exposes the new simulator capabilities to external
clients like Claude Code. As of Xcode 27 beta 1, in-IDE agents can drive the
Simulator (boot, install, synthesize touches, screenshots, accessibility-tree
readback via Device Hub) but `mcpbridge` still exposed only the same 20 tools
as Xcode 26.3 — no simulator control. If GA closes that gap, parts of the
`mobile-mvp` agent-tooling stack (Argent's driving overlap; any lingering
XcodeBuildMCP temptation) can be simplified. The React-aware layer (React
component tree, Metro logs, network inspection, testID lookup) stays with
Expo MCP/Argent regardless. Note new requirements: macOS Tahoe 26.4+, Apple
Silicon.

## Acceptance Criteria

- `xcrun mcpbridge` tool list audited on Xcode 27 GA
- Decision recorded on adopting/retiring overlapping tooling
- Repo agent-tooling docs/config updated to match the decision
