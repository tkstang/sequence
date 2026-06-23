import { createRequire } from 'node:module';

// This PostCSS config itself is ESM (it is a `.mjs` file), but the `apps/web`
// package is intentionally NOT `"type": "module"` — Next's Babel loader rejects
// `.cjs`/`.mjs` config, so the Babel config must stay CommonJS `babel.config.js`.
// Use `createRequire` to load that CommonJS Babel config from this ESM file so
// the PostCSS plugin extracts StyleX with the exact same plugin options Next uses.
const require = createRequire(import.meta.url);
const babelConfig = require('./babel.config.js');

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      babelConfig: {
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: babelConfig.plugins,
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};

export default config;
