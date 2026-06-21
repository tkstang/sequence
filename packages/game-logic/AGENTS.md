# @sequence/game-logic

The framework-free, authoritative Sequence rules engine shared by the API and
web. Inherits the root `AGENTS.md`; this file adds only the engine delta. The
package README's **Design Rules** are the canonical reference.

## Conventions

- **Framework-free:** no React, Next, Fastify, database, network, or DOM imports
  (the only runtime dependency is `zod`). This keeps the domain contract
  shareable across the API, web, tests, and future clients.
- Return typed `RuleViolation`s for expected illegal moves — do not throw.
- Keep functions deterministic; thread an injected `Rng` through any
  non-deterministic operation so tests can control it.
- Add public APIs via `src/index.ts`; other workspaces import the package
  surface, not deep module paths.
- New rule module → pure function(s) plus a co-located `*.test.ts`.

## References

- `packages/game-logic/README.md` — full Design Rules and public surface
