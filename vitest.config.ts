import { defineConfig } from 'vitest/config';

// Root Vitest config: lists the test projects. Each package/app owns its own
// vitest config when it needs custom environment (e.g. jsdom for apps/web).
// apps/mobile uses Jest.
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/web'],
  },
});
