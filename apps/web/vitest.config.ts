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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
