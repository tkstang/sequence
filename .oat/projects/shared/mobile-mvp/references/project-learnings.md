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
- Resolvable subagent issues should be handled by the orchestrator without
  stopping implementation. If a subagent finishes with concerns that are
  locally diagnosable, inspect the worktree, apply the focused fix, re-run the
  relevant gates, and keep the task moving until the configured HiLL checkpoint
  or a true blocker.

## Codebase Patterns

- Keep route-adjacent tests out of `apps/mobile/src/app`; Expo Router can bundle
  route-local test files into Metro. Place mobile component and route tests in
  non-route test locations unless a later pattern explicitly proves otherwise.
- Treat React Strict DOM primitives as implementation details that still need
  device visual proof. In this app, native-backed chrome primitives (`View`,
  `Text`, `Pressable`, `ScrollView`) were more predictable for mobile layout
  than `html.*` wrappers when building reusable app chrome.
- When using React Native `StyleSheet` for layout, set direction explicitly on
  vertical stacks. The default flex direction differs from CSS expectations and
  can turn compact lists or headers into wide, stretched rows.

## Open Follow-Ups

- Distill general OAT dispatch and subagent lessons into future agent
  instructions after this project completes.
- Distill Expo-specific simulator/MCP lessons from
  `using-expo-mcp-learnings.md` into the requested Expo MCP skill.
