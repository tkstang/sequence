import { defineConfig } from 'vitest/config';

// Vitest searches parent directories for a config. This package-local config
// keeps a per-package `vitest run` from resolving the root `projects` config.
export default defineConfig({});
