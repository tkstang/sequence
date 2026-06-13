import { defineConfig, devices } from '@playwright/test';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const webUrl = 'http://127.0.0.1:3000';
const apiUrl = 'http://127.0.0.1:3001';
const wsUrl = 'ws://127.0.0.1:3001';
const authSecret = 'sequence-playwright-test-secret-000000';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: webUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'mobile-375',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: hasTestDb
    ? [
        {
          command: `DATABASE_URL="$DATABASE_URL_TEST" DATABASE_URL_TEST="$DATABASE_URL_TEST" NODE_ENV=test BETTER_AUTH_SECRET=${authSecret} BETTER_AUTH_URL=${apiUrl} WEB_ORIGIN=${webUrl} PORT=3001 pnpm --filter @sequence/api start`,
          url: `${apiUrl}/health`,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
        },
        {
          command: `NEXT_PUBLIC_API_URL=${apiUrl} NEXT_PUBLIC_WS_URL=${wsUrl} pnpm --filter @sequence/web dev -- --hostname 127.0.0.1 --port 3000`,
          url: webUrl,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
        },
      ]
    : undefined,
});
