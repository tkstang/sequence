# Git Hooks

Automated git hooks for code quality and consistency.

## Features

- **Automatic Setup**: Hooks are installed automatically on `pnpm install`
- **Silent When Ready**: No output if hooks are already configured
- **Skippable in CI/Docker**: Set `GIT_HOOKS=0` to skip installation
- **Individually Controllable**: Enable/disable specific hooks as needed

## Available Hooks

- `pre-commit`: Runs `oxlint` + `oxfmt --check` on staged source files (no
  `lint-staged` dependency)
- `commit-msg`: Validates the conventional-commit shape and the `pNN-tNN`
  scope convention (no `commitlint` dependency)
- `pre-push`: Runs the full lint across all workspaces before pushing
- `post-checkout`: Runs `pnpm install --frozen-lockfile` when switching
  branches with lockfile changes

## Usage

### Automatic (Recommended)

Hooks are automatically installed when you run `pnpm install`. If they're already installed, the setup is silent.

### Manual Control

```bash
# View status of all hooks
pnpm hooks:status

# Enable all hooks
pnpm hooks:enable-all

# Disable all hooks
pnpm hooks:disable-all

# Enable specific hook
pnpm hooks enable pre-commit

# Disable specific hook
pnpm hooks disable pre-commit
```

## Skipping Hooks

### In Docker/CI

Skip the `prepare` lifecycle script (which installs hooks) entirely:

```dockerfile
RUN pnpm install --ignore-scripts
```

### Locally (Permanent)

```bash
# Disable all hooks
pnpm hooks:disable-all
```

Disabled hooks are tracked in `.git/hooks/.disabled-hooks` and won't be re-enabled by `pnpm install`.

## How It Works

1. The `prepare` script in `package.json` runs `manage-hooks.js setup` after every `pnpm install`
2. If all hooks are already installed or intentionally disabled, it exits silently
3. Otherwise, it installs missing hooks and reports what was done

## Troubleshooting

### Hooks not running

```bash
# Check hook status
pnpm hooks:status

# Re-enable all hooks
pnpm hooks:enable-all
```

### Hooks running when they shouldn't

```bash
# Disable specific hook
pnpm hooks disable pre-push

# Or disable all
pnpm hooks:disable-all
```

### Hooks failing in CI

Run `pnpm install --ignore-scripts` in your CI environment or Dockerfile to
skip hook installation.

## Implementation Details

- Hooks are symlinked from `tools/git-hooks/` to Git's resolved hooks directory
- Disabled hooks are tracked in `.disabled-hooks` inside Git's resolved hooks directory
- The `setup` action respects intentionally disabled hooks
- Git's `core.hooksPath` is unset so Git uses its default resolved hooks directory
