import { defineConfig, devices } from '@playwright/test';

/**
 * Browser-level acceptance tests.
 *
 * These run against a **production preview build**, not the dev server. The
 * defects these tests exist to catch — a route transition that leaves the
 * outlet empty, and a circular chunk graph that stopped the bundle booting at
 * all — were both invisible in `vitest` and one of them only existed in the
 * production bundle.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'http://localhost:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
