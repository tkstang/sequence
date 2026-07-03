# Project Learnings

This file captures durable execution and codebase learnings from the
`mobile-mvp` project that are not specific to Expo MCP. Use it at the end of the
project to distill reusable skills, OAT workflow improvements, and repo-level
agent instructions.

## OAT Orchestration

- Dispatch ceiling is a cap, not the default implementer effort. For implementer
  work, first classify the task (`low`, `medium`, `high`, `xhigh`), then select
  the lowest sufficient pinned role capped by the configured ceiling. A bounded
  chrome-kit task with preferred `medium` and ceiling `xhigh` should dispatch
  `oat-phase-implementer-medium`, not `oat-phase-implementer-xhigh`. Reviewer
  dispatch can still target the ceiling when the workflow calls for
  deterministic review quality.

## Codebase Patterns

- Keep route-adjacent tests out of `apps/mobile/src/app`; Expo Router can bundle
  route-local test files into Metro. Place mobile component and route tests in
  non-route test locations unless a later pattern explicitly proves otherwise.

## Open Follow-Ups

- Distill general OAT dispatch and subagent lessons into future agent
  instructions after this project completes.
- Distill Expo-specific simulator/MCP lessons from
  `using-expo-mcp-learnings.md` into the requested Expo MCP skill.
