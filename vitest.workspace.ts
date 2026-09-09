import { defineWorkspace } from 'vitest/config';

// Workspace projects. Each package/app owns its own vitest config when it
// needs custom environment (e.g. jsdom for apps/web). apps/mobile uses Jest.
export default defineWorkspace(['packages/*', 'apps/web']);
