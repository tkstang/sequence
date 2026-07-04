# `@sequence/design-tokens`

Shared design values for the web and mobile clients.

This package is framework-free TypeScript. It owns color palettes, spacing,
radius, shadows, typography, and z-index values that both clients consume. The
web app uses generated StyleX files; the mobile app imports the package
directly for native theme values and component styles.

## Responsibilities

- Export light and dark color palettes through `palette`.
- Export static dimensions through `space`, `radius`, `shadow`, `fontFamily`,
  `fontSize`, `fontWeight`, `lineHeight`, and `zIndex`.
- Generate web StyleX token/theme files under `apps/web/src/styles`.
- Keep light and dark palette keys in parity through tests.

## Public Surface

The package exports from `src/index.ts`:

```ts
import {
  fontSize,
  palette,
  radius,
  space,
  type ColorToken,
} from '@sequence/design-tokens';
```

## Web Generation

The web StyleX files are generated from this package:

- `apps/web/src/styles/tokens.stylex.ts`
- `apps/web/src/styles/themes.stylex.ts`

Regenerate them after token changes:

```bash
pnpm --filter @sequence/design-tokens generate:web-stylex
```

Generated web StyleX files are committed. Do not hand-edit token values in the
generated files.

## Mobile Usage

Mobile imports `palette` directly for:

- Native theme context values in `apps/mobile/src/theme/theme-provider.tsx` and
  `apps/mobile/src/theme/use-theme.ts`.
- Native component styles in `apps/mobile/src/components`.

When adding a token, update the shared source here first, then update the web
generated files and mobile consumers as needed.

## Commands

```bash
pnpm --filter @sequence/design-tokens generate:web-stylex
pnpm --filter @sequence/design-tokens test
```

The root `pnpm test` gate runs this package through the Vitest workspace.
