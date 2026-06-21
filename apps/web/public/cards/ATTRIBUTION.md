# Card SVG Attribution

The playing-card SVG assets in this directory are derived from the
**Vectorized Playing Cards 1.3** graphics library.

- **Author:** Chris Aguilar (`webmaster@totalnonsense.com`)
- **Source:** http://code.google.com/p/vectorized-playing-cards/
- **Copyright:** © 2011 Chris Aguilar
- **License:** GNU Lesser General Public License, version 3 (LGPL-3.0-or-later)

## License terms

The Vectorized Playing Cards 1.3 Graphics Library is free software: you can
redistribute it and/or modify it under the terms of the GNU Lesser General
Public License as published by the Free Software Foundation, either version 3
of the License, or (at your option) any later version.

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE. See the GNU Lesser General Public License for more details:
<http://www.gnu.org/licenses/>.

## Modifications in this repository

- 52 card faces + 2 card backs (`BLUE_BACK`, `RED_BACK`) were optimized with
  [SVGO](https://github.com/svg/svgo) via `scripts/optimize-cards.mjs`
  (preset-default + `removeDimensions`; `viewBox` preserved for responsive
  scaling).
- The ten cards use the `T` naming convention (`TC.svg`, `TD.svg`, …) to match
  the board position codes in `@sequence/game-logic`. The legacy `10*.svg`
  aliases (byte-identical duplicates) were dropped.

No artwork was altered; only metadata/whitespace were stripped during
optimization.
