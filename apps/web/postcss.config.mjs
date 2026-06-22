import { createRequire } from 'node:module';

// `apps/web` is an ESM package; bridge to the CommonJS Babel config so the
// PostCSS plugin extracts StyleX with the exact same plugin options Next uses.
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
