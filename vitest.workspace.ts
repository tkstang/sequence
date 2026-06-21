import { defineWorkspace } from 'vitest/config';

// Workspace projects. Each package/app owns its own vitest config when it
// needs custom environment (e.g. jsdom for apps/web); the glob picks them up.
export default defineWorkspace(['packages/*', 'apps/*']);
