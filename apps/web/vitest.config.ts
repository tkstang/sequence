import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Web component-test config (p05-t03): jsdom environment + Testing Library
 * matchers. Picked up by the root `vitest.workspace.ts` glob. The `@` alias
 * mirrors `tsconfig.json` so component imports resolve in tests.
 */
export default defineConfig({
  // Use the automatic JSX runtime so component tests don't need a React import.
  esbuild: { jsx: 'automatic' },
  test: {
    name: 'web',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      // StyleX is compiled by @stylexjs/babel-plugin at build time; Vitest does
      // not run that plugin, so its uncompiled runtime throws on defineVars/
      // create. Component tests assert behavior, not CSS, so swap in a no-op
      // stub. See src/test/stylex-mock.ts.
      '@stylexjs/stylex': fileURLToPath(
        new URL('./src/test/stylex-mock.ts', import.meta.url),
      ),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
