import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: true,
  include: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
    './utils/**/*.{ts,tsx,js,jsx}',
  ],
  exclude: ['node_modules', '.next', 'dist', '.turbo'],
  outdir: 'styled-system',
  theme: {
    extend: {
      tokens: {
        colors: {
          background: { value: '{colors.gray.950}' },
          foreground: { value: '{colors.gray.50}' },
          accent: { value: '{colors.emerald.500}' },
          accentMuted: { value: '{colors.emerald.600}' },
        },
        fonts: {
          body: { value: "'Inter', sans-serif" },
          heading: { value: "'Inter', sans-serif" },
        },
        radii: {
          sm: { value: '6px' },
          md: { value: '12px' },
          lg: { value: '20px' },
        },
        space: {
          xs: { value: '0.5rem' },
          sm: { value: '0.75rem' },
          md: { value: '1rem' },
          lg: { value: '1.5rem' },
          xl: { value: '2rem' },
        },
      },
    },
  },
});
