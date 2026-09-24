import { defineConfig } from '@playwright/test';

// E2E_PORT / E2E_OUT let several test runs build and serve in parallel without clobbering dist/.
const port = Number(process.env.E2E_PORT || 4173);
const outDir = process.env.E2E_OUT || 'dist';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  use: {
    baseURL: `http://localhost:${port}`,
    launchOptions: { executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' },
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: `npx vite build --outDir ${outDir} --emptyOutDir && npx vite preview --outDir ${outDir} --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
