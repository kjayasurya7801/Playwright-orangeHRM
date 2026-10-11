import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

const isCI = !!process.env.CI;
const flakyHunt = process.env.FLAKY_HUNT === '1';

/**
 * Reporter strategy
 *  - local     : list + HTML + JSON
 *  - CI shard  : blob (merged into one HTML report in a later job) + junit
 *  - flaky hunt: JSON only (consumed by scripts/detect-flaky.js)
 */
const reporter = flakyHunt
  ? ([['list'], ['json', { outputFile: 'reports/results.json' }]] as const)
  : isCI
    ? ([
        ['list'],
        ['blob', { outputDir: 'blob-report' }],
        ['junit', { outputFile: 'reports/junit.xml' }],
      ] as const)
    : ([
        ['list'],
        ['html', { outputFolder: 'reports/html', open: 'never' }],
        ['json', { outputFile: 'reports/results.json' }],
      ] as const);

export default defineConfig({
  testDir: './tests',
  outputDir: 'reports/test-artifacts',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  // Retries are a safety net, not a fix: flaky results are surfaced by scripts/detect-flaky.js
  retries: flakyHunt ? 0 : isCI ? 2 : 0,
  // The public demo is shared; keep concurrency polite.
  workers: isCI ? 2 : undefined,
  reporter: reporter as any,
  use: {
    baseURL: env.baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      testMatch: /e2e\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
    },
    {
      // Pure API project: no browser is launched.
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
    },
  ],
});
