#!/usr/bin/env node
// Root test runner. Drives the Vitest workspace (vitest.workspace.ts).
// Tolerates the empty-monorepo state: if no workspace project directories
// exist yet (early Phase 1), there is nothing to test and we exit 0.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const projectGlobRoots = ['packages', 'apps'];

const hasProjects = projectGlobRoots.some((dir) => {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return false;
  return fs.readdirSync(abs, { withFileTypes: true }).some((entry) => {
    if (!entry.isDirectory()) return false;
    return fs.existsSync(path.join(abs, entry.name, 'package.json'));
  });
});

if (!hasProjects) {
  console.log('No workspace projects found yet — skipping tests.');
  process.exit(0);
}

const result = spawnSync(
  'pnpm',
  ['exec', 'vitest', 'run', '--passWithNoTests'],
  { stdio: 'inherit', cwd: root },
);

process.exit(result.status ?? 1);
