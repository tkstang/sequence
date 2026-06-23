# Styling (StyleX)

The web app (`apps/web`) styles its UI with [StyleX](https://stylexjs.com) —
typed, co-located, atomic styles compiled at build time. There is no Tailwind and
no global utility-class system; every component declares its styles with
`stylex.create` and applies them with `stylex.props`.

## Tokens and themes

Design values are StyleX **variables**, not hard-coded literals:

- [`apps/web/src/styles/tokens.stylex.ts`](../apps/web/src/styles/tokens.stylex.ts)
  — `defineVars` groups: `color`, `space`, `radius`, `shadow`, `fontFamily`,
  `fontSize`, `fontWeight`, `lineHeight`, `zIndex`. `color` carries surfaces,
  text, team colors, badges, and a semantic `highlight` token.
- [`apps/web/src/styles/themes.stylex.ts`](../apps/web/src/styles/themes.stylex.ts)
  — `lightTheme` / `darkTheme` as `createTheme(color, …)` overrides. Every color
  variable is listed in both themes.

When adding a color, add it to `tokens.stylex.ts` **and** to both themes in
`themes.stylex.ts`. Prefer an existing token over a new literal.

## Dark mode

Theming is layered:

- `defineVars` carries a `@media (prefers-color-scheme: dark)` default, so the
  app respects the OS preference out of the box.
- A manual override is applied by
  [`components/theme/theme-provider.tsx`](../apps/web/src/components/theme/theme-provider.tsx),
  which holds the mode (`light` / `dark` / `system`), persists it to
  `localStorage` (`sequence-theme`), and re-syncs across tabs (and the `/dev`
  playground's preview iframes) via the `storage` event. `useTheme()` returns a
  safe fallback when no provider is present, so components stay usable in tests.
- `components/theme/theme-toggle.tsx` is the segmented control (built on a
  `<fieldset>`).

## Build pipeline

StyleX compiles at build time through Babel + PostCSS:

- [`apps/web/babel.config.js`](../apps/web/babel.config.js) — `next/babel` plus
  `@stylexjs/babel-plugin`. It must be a **CommonJS `.js`** file: Next's Babel
  loader rejects `.cjs`/`.mjs` config, which is why `apps/web/package.json` does
  **not** set `"type": "module"`.
- [`apps/web/postcss.config.mjs`](../apps/web/postcss.config.mjs) —
  `@stylexjs/postcss-plugin` replaces the `@stylex;` directive in
  [`globals.css`](../apps/web/src/app/globals.css) with the generated atomic CSS
  (under CSS layers, so the base reset is overridden deterministically).

### Turbopack `rootDir` gotcha

Next.js 16 runs on Turbopack, which virtualizes `__dirname` to `/ROOT/*`. That
breaks StyleX's module resolution unless the StyleX `rootDir` is reconstructed
from the real `process.cwd()` (the Babel config walks up to the repo root). This
is the single most load-bearing piece of the setup — keep `rootDir` derived from
`process.cwd()`, not `__dirname`.

Replacing the Babel pipeline with the SWC-based `@stylexswc` compiler (which would
let `apps/web` restore `"type": "module"` and drop the `rootDir` workaround) is a
scoped spike, tracked as backlog `bl-2ae1`.

## Tests

StyleX's runtime helpers throw on uncompiled `defineVars` under jsdom, so the web
Vitest config aliases `@stylexjs/stylex` to a no-op stub
([`src/test/stylex-mock.ts`](../apps/web/src/test/stylex-mock.ts)) via
[`vitest.config.ts`](../apps/web/vitest.config.ts). Component tests therefore
render without real styles — styling is verified visually in the
[`/dev` playground](development.md#dev-ui-playground), not asserted in unit tests.

## Conventions

- Style with `stylex.create` + `stylex.props`; no inline style objects for static
  styling and no utility-class system.
- Pull values from the token groups; add new colors to both themes.
- Use semantic accent tokens (e.g. `color.highlight`) rather than raw hex.
- Keep explicit `.ts`/`.tsx` extensions on imports, including the token/theme
  files (the `@/styles/*.stylex.ts` alias works; bare extensionless or other
  unconfigured `@` aliases do not — see the root [`AGENTS.md`](../AGENTS.md) and
  `bl-3fcf`).

## See also

- [`development.md`](development.md#dev-ui-playground) — the `/dev` playground used
  to review components and themes.
- [`architecture.md`](architecture.md#ui-state-shape) — the web boundary and the
  `GameSnapshotView` shape the components render from.
