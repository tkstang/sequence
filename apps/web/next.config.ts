import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // tsgo (TypeScript native preview) owns type-checking via the root
  // `pnpm typecheck` gate; Next's own bundled tsc would duplicate it and
  // does not understand the side-by-side tsgo setup. Per design.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
