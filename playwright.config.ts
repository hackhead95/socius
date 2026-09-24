import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// E2E_PORT / E2E_OUT let several test runs build and serve in parallel without clobbering dist/.
const port = Number(process.env.E2E_PORT || 4173);
const outDir = process.env.E2E_OUT || 'dist';
// Use a pre-installed Chromium when one is available (cloud sandbox); otherwise Playwright's own browser.
const chromium = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  use: {
    baseURL: `http://localhost:${port}`,
    launchOptions: chromium ? { executablePath: chromium } : {},
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: `npx vite build --outDir ${outDir} --emptyOutDir && npx vite preview --outDir ${outDir} --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
