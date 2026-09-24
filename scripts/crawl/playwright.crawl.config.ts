// Playwright config for the UI crawler only (scripts/crawl/crawl.spec.ts). The normal e2e suite
// (playwright.config.ts, testDir e2e/) never sees this file.
//
// Usually started by `node scripts/crawl/run.mjs`, which builds the app, serves it under /socius/ and
// writes the report. Directly: build and serve yourself, then
//   CRAWL_URL=http://127.0.0.1:4391/socius/ npx playwright test -c scripts/crawl/playwright.crawl.config.ts
// Without CRAWL_URL this config builds into /tmp/crawl/dist and serves it itself.
import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const port = Number(process.env.CRAWL_PORT || 4391);
const url = process.env.CRAWL_URL || `http://127.0.0.1:${port}/socius/`;
const devUrl = process.env.CRAWL_DEV_URL;
const chromium = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export default defineConfig({
  testDir: '.',
  testMatch: /crawl\.spec\.ts$/,
  timeout: 40 * 60_000,
  workers: Number(process.env.CRAWL_WORKERS || 3),
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  outputDir: process.env.CRAWL_OUT ? `${process.env.CRAWL_OUT}/pw` : '/tmp/crawl/out/pw',
  use: {
    baseURL: url,
    launchOptions: chromium ? { executablePath: chromium } : {},
    actionTimeout: 8000,
    trace: 'off',
    screenshot: 'off',
  },
  projects: [
    { name: 'prod', use: { baseURL: url } },
    // Development React build: surfaces React warnings (keys, controlled inputs, act) that the
    // production build strips. Only used when run.mjs --react-dev builds and serves it.
    ...(devUrl ? [{ name: 'react-dev', use: { baseURL: devUrl }, grep: /@ 1440x900 light/ }] : []),
  ],
  webServer: process.env.CRAWL_URL
    ? undefined
    : {
        command: `npx vite build --outDir /tmp/crawl/dist --emptyOutDir && node scripts/crawl/serve.mjs --dir /tmp/crawl/dist --port ${port}`,
        url,
        reuseExistingServer: true,
        timeout: 180_000,
        cwd: '../..',
      },
});
