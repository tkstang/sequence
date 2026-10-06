import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  shadow,
  space,
  zIndex,
} from '../src/dimensions.ts';
import { palette } from '../src/palette.ts';

const execFileAsync = promisify(execFile);

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(scriptDir, '../../..');
export const webStylesDir = join(repoRoot, 'apps/web/src/styles');
export const webStylexFileNames = [
  'tokens.stylex.ts',
  'themes.stylex.ts',
] as const;

type WebStylexFileName = (typeof webStylexFileNames)[number];

function quote(value: string): string {
  return JSON.stringify(value);
}

function staticVars(name: string, values: Record<string, string>): string {
  const lines = Object.entries(values).map(
    ([key, value]) => `  ${key}: ${quote(value)},`,
  );
  return `export const ${name} = stylex.defineVars({\n${lines.join('\n')}\n});`;
}

function colorVars(): string {
  const lines = Object.keys(palette.light).map((key) => {
    const token = key as keyof typeof palette.light;
    return `  ${token}: { default: ${quote(palette.light[token])}, [DARK]: ${quote(
      palette.dark[token],
    )} },`;
  });
  return `export const color = stylex.defineVars({\n${lines.join('\n')}\n});`;
}

function shadowVars(): string {
  const lines = Object.keys(shadow.light).map((key) => {
    const token = key as keyof typeof shadow.light;
    return `  ${token}: { default: ${quote(shadow.light[token])}, [DARK]: ${quote(
      shadow.dark[token],
    )} },`;
  });
  return `export const shadow = stylex.defineVars({\n${lines.join('\n')}\n});`;
}

function themeVars(name: string, values: Record<string, string>): string {
  const lines = Object.entries(values).map(
    ([key, value]) => `  ${key}: ${quote(value)},`,
  );
  return `export const ${name} = stylex.createTheme(color, {\n${lines.join('\n')}\n});`;
}

const banner = `/**
 * Generated from @sequence/design-tokens.
 *
 * Do not edit token values here. Run:
 * pnpm --filter @sequence/design-tokens generate:web-stylex
 */
`;

export function createWebStylexFiles(): Record<WebStylexFileName, string> {
  return {
    'tokens.stylex.ts': `${banner}
import * as stylex from '@stylexjs/stylex';

const DARK = '@media (prefers-color-scheme: dark)';

${colorVars()}

${staticVars('space', space)}

${staticVars('radius', radius)}

${shadowVars()}

${staticVars('fontFamily', fontFamily)}

${staticVars('fontSize', fontSize)}

${staticVars('fontWeight', fontWeight)}

${staticVars('lineHeight', lineHeight)}

${staticVars('zIndex', zIndex)}
`,
    'themes.stylex.ts': `${banner}
import * as stylex from '@stylexjs/stylex';

import { color } from './tokens.stylex.ts';

${themeVars('lightTheme', palette.light)}

${themeVars('darkTheme', palette.dark)}
`,
  };
}

async function formatFiles(paths: string[]): Promise<void> {
  await execFileAsync('oxfmt', paths, { cwd: repoRoot });
}

export async function writeWebStylexFiles(
  targetDir = webStylesDir,
): Promise<void> {
  const files = createWebStylexFiles();
  await mkdir(targetDir, { recursive: true });
  const paths = webStylexFileNames.map((fileName) => join(targetDir, fileName));

  await Promise.all(
    webStylexFileNames.map((fileName) =>
      writeFile(join(targetDir, fileName), files[fileName]),
    ),
  );
  await formatFiles(paths);
}
