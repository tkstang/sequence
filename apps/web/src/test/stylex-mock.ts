/**
 * No-op StyleX runtime for Vitest (jsdom) component tests.
 *
 * The real StyleX transforms happen at build time via `@stylexjs/babel-plugin`
 * (see babel.config.js / postcss.config.mjs). Vitest does not run that plugin,
 * and the uncompiled runtime intentionally throws on `defineVars`/`create` to
 * catch a missing build step. Component tests assert behavior and markup — not
 * actual CSS — so we alias `@stylexjs/stylex` to this stub in vitest.config.ts.
 *
 * Each function mirrors the shape the compiled runtime returns closely enough
 * for components to render: `props()` yields { className, style }, `defineVars`
 * yields `var(--key)` references, etc.
 */

type Dict = Record<string, unknown>;

export function create<T extends Dict>(styles: T): T {
  return styles;
}

export function props(..._styles: unknown[]): {
  className: string;
  style: Record<string, unknown>;
} {
  return { className: '', style: {} };
}

export function defineVars<T extends Dict>(
  vars: T,
): { [K in keyof T]: string } {
  const out = {} as { [K in keyof T]: string };
  for (const key of Object.keys(vars)) {
    (out as Dict)[key] = `var(--${key})`;
  }
  return out;
}

export function createTheme(_vars: unknown, _overrides: unknown): string {
  return 'stylex-theme-stub';
}

export function keyframes(_frames: unknown): string {
  return 'stylex-keyframes-stub';
}

export function defineConsts<T extends Dict>(consts: T): T {
  return consts;
}

export function firstThatWorks(...values: unknown[]): unknown {
  return values[0];
}

const stylex = {
  create,
  props,
  defineVars,
  createTheme,
  keyframes,
  defineConsts,
  firstThatWorks,
};

export default stylex;
