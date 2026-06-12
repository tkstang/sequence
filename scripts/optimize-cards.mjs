#!/usr/bin/env node
/**
 * One-shot card SVG optimization pipeline.
 *
 * Source: legacy `public/cards/` — the "Vectorized Playing Cards 1.3" set by
 *         Chris Aguilar (LGPL 3). See `apps/web/public/cards/ATTRIBUTION.md`.
 * Output: `apps/web/public/cards/` — SVGO-optimized 52 faces + 2 backs.
 *
 * Naming: ranks use `T` for ten (matching the board codes in
 * `@sequence/game-logic`'s BOARD_MAP); the legacy `10*.svg` aliases are
 * intentionally dropped.
 *
 * Re-run after any source change:  node scripts/optimize-cards.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

import { optimize } from 'svgo';

const root = path.resolve(import.meta.dirname, '..');
const sourceDir = path.join(root, 'public', 'cards');
const outDir = path.join(root, 'apps', 'web', 'public', 'cards');

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
const SUITS = ['C', 'D', 'H', 'S'];
const BACKS = ['BLUE_BACK', 'RED_BACK'];

const faceNames = RANKS.flatMap((rank) =>
  SUITS.map((suit) => `${rank}${suit}`),
);
const cardNames = [...faceNames, ...BACKS];

const svgoConfig = {
  multipass: true,
  plugins: [
    // preset-default already preserves the viewBox (removeViewBox is disabled
    // by default since SVGO 3), so cards scale cleanly into any cell size.
    'preset-default',
    // Drop width/height attributes so the viewBox drives sizing via CSS.
    'removeDimensions',
  ],
};

function run() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source card directory not found: ${sourceDir}`);
  }
  fs.mkdirSync(outDir, { recursive: true });

  let totalIn = 0;
  let totalOut = 0;
  const outliers = [];

  for (const name of cardNames) {
    const srcPath = path.join(sourceDir, `${name}.svg`);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing source card: ${srcPath}`);
    }

    const input = fs.readFileSync(srcPath, 'utf8');
    const { data } = optimize(input, { ...svgoConfig, path: srcPath });
    const outPath = path.join(outDir, `${name}.svg`);
    fs.writeFileSync(outPath, data);

    const inBytes = Buffer.byteLength(input);
    const outBytes = Buffer.byteLength(data);
    totalIn += inBytes;
    totalOut += outBytes;

    const reduction = 1 - outBytes / inBytes;
    if (reduction < 0.5) {
      outliers.push({ name, inBytes, outBytes, reduction });
    }
  }

  const kib = (bytes) => `${(bytes / 1024).toFixed(1)}KiB`;
  console.log(`Optimized ${cardNames.length} cards → ${outDir}`);
  console.log(
    `Total: ${kib(totalIn)} → ${kib(totalOut)} ` +
      `(${((1 - totalOut / totalIn) * 100).toFixed(1)}% smaller)`,
  );
  if (outliers.length > 0) {
    console.log('Outliers below the 50%/file reduction target:');
    for (const o of outliers) {
      console.log(
        `  ${o.name}: ${kib(o.inBytes)} → ${kib(o.outBytes)} ` +
          `(${(o.reduction * 100).toFixed(1)}%)`,
      );
    }
  } else {
    console.log('All cards met the 50%/file reduction target.');
  }
}

run();
