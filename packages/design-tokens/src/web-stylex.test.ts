import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  webStylesDir,
  webStylexFileNames,
  writeWebStylexFiles,
} from '../scripts/web-stylex-files.ts';

describe('web StyleX generation', () => {
  it('keeps committed web StyleX files fresh', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'sequence-web-stylex-'));

    try {
      await writeWebStylexFiles(tempDir);

      for (const fileName of webStylexFileNames) {
        const [expected, actual] = await Promise.all([
          readFile(join(tempDir, fileName), 'utf8'),
          readFile(join(webStylesDir, fileName), 'utf8'),
        ]);

        expect(actual).toBe(expected);
      }
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
