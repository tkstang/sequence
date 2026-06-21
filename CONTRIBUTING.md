# Contributing

This guide covers the prerequisites, quality gates, commit convention, and code
rules for contributing to Sequence Online. For full local setup see
`docs/development.md`; for environment variables see `docs/configuration.md`.

## Prerequisites

- Node `v24` from `.nvmrc`
- pnpm `10.17.0` or newer

Install dependencies:

```bash
pnpm install
```

The root `prepare` script installs local git hooks on every `pnpm install`. To
skip hook installation (CI or Docker), set `GIT_HOOKS=0` or run with
`--ignore-scripts`:

```bash
GIT_HOOKS=0 pnpm install
pnpm install --ignore-scripts
```

## Project Layout

See the Repository Layout table in `README.md` for what lives in `apps/web`,
`packages/api`, `packages/game-logic`, and the supporting directories.

## Quality Gates Before a PR

Run the full gate sequence when code changes are involved:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

For UI or gameplay-flow changes, also run the relevant web tests and the web
end-to-end suite. Playwright only starts its API and web servers when
`DATABASE_URL_TEST` is available:

```bash
pnpm --filter @sequence/web test
pnpm --filter @sequence/web e2e
```

See `docs/testing.md` for the test layers and `docs/development.md` for the full
command list.

## Commit Messages

The `commit-msg` hook validates a conventional-commit shape (no `commitlint`
dependency). The subject must be:

```
<type>(<scope>): <description>
```

The scope is optional, so `<type>: <description>` is also valid. An optional `!`
may precede the colon to mark a breaking change.

Allowed types:

```
feat | fix | chore | docs | test | refactor | perf | build | ci | style | revert
```

When a scope is present and looks like a phase-task reference (it starts with
`p` followed by a digit), it must match the `pNN-tNN` shape:

```bash
chore(p01-t11): adapt git hooks and worktree env scripts
```

Other scope shapes are accepted as long as they use lowercase letters, digits,
`.`, `_`, `/`, or `-`. Merge, revert, `fixup!`, `squash!`, and comment-only
messages are skipped by the hook.

## Git Hooks

Hooks are symlinked from `tools/git-hooks/` during `pnpm install`. Four hooks
run locally:

- `pre-commit`: runs `oxlint` and `oxfmt --check` on staged source files.
- `commit-msg`: validates the conventional-commit shape and `pNN-tNN` scope
  convention described above.
- `pre-push`: runs the full lint across all workspaces (`pnpm run lint`).
- `post-checkout`: runs `pnpm install --frozen-lockfile` when switching branches
  with lockfile changes.

Manage hooks with the `pnpm hooks:*` scripts:

```bash
pnpm hooks:status        # show status of all hooks
pnpm hooks:enable-all    # enable all hooks
pnpm hooks:disable-all   # disable all hooks
pnpm hooks enable pre-commit    # enable a specific hook
pnpm hooks disable pre-commit   # disable a specific hook
```

See `tools/git-hooks/README.md` for installation internals and skip options.

## Code Conventions

- Keep `@sequence/game-logic` framework-free. Do not add React, Next, Fastify,
  database, network, or DOM imports there.
- `oxlint` is the linter and `oxfmt` is the formatter (configured in
  `.oxlintrc.json` and `.oxfmtrc.json`). Run `pnpm lint` and `pnpm format:check`
  before opening a PR.
- Treat `packages/api` as the authority for auth, persistence, move validation,
  version guards, redaction, timers, and realtime subscriptions.

See `AGENTS.md` for the full project guidance.

## Constraints

Do not document not-yet-built features as if they exist:

- There is no `/dev` UI playground yet; it is backlog work.
- The board renders full card SVGs today. The symbolic/physical-board direction
  is backlog work, not current behavior.
