import { palette } from '@sequence/design-tokens';
import { css } from 'react-strict-dom';

const DARK = '@media (prefers-color-scheme: dark)';

export const rsdSpikeVars = css.defineVars({
  background: { default: palette.light.bg, [DARK]: palette.dark.bg },
  text: { default: palette.light.text, [DARK]: palette.dark.text },
});
