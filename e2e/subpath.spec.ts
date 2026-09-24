// Home links under the GitHub Pages sub-path (owner report: "Homepage redirect button doesn't work").
// Serves the production build the way GitHub Pages serves https://<owner>.github.io/socius/, and
// points hackhead95.github.io at it, so the real 404.html logic runs.
import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { loadSampleFromWelcome } from './helpers';

// The 404 page recognises a GitHub Pages project site by its host name.
test.use({
  launchOptions: {
    ...(existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' } : {}),
    args: ['--host-resolver-rules=MAP hackhead95.github.io 127.0.0.1'],
  },
});

test.describe('home links under the GitHub Pages sub-path', () => {
  // Serve the production build as GitHub Pages does for https://<owner>.github.io/socius/: under
  // /socius/, with folder redirects (/socius -> /socius/) and 404.html for unknown addresses.
  const outDir = resolve(process.env.E2E_OUT || 'dist');
  const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
  let server: Server;
  let port = 0;
  test.beforeAll(async () => {
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://x');
      const path = decodeURIComponent(url.pathname);
      const inProject = path === '/socius' || path.startsWith('/socius/');
      const file = inProject ? join(outDir, path.slice('/socius'.length)) : '';
      if (inProject && existsSync(file) && statSync(file).isDirectory()) {
        if (!path.endsWith('/')) {
          res.writeHead(301, { Location: `${path}/` });
          res.end();
          return;
        }
        res.writeHead(200, { 'Content-Type': types['.html'] });
        res.end(readFileSync(join(file, 'index.html')));
        return;
      }
      if (inProject && existsSync(file)) {
        res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
        res.end(readFileSync(file));
        return;
      }
      res.writeHead(404, { 'Content-Type': types['.html'] });
      res.end(readFileSync(join(outDir, '404.html')));
    });
    await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
    port = (server.address() as { port: number }).port;
  });
  test.afterAll(() => new Promise<void>((ok) => server.close(() => ok())));

  test('the app, the guide, their links, and unknown addresses all lead home', async ({ page }) => {
    const site = `http://hackhead95.github.io:${port}`;
    // Without the final slash.
    await page.goto(`${site}/socius`);
    await expect(page).toHaveURL(`${site}/socius/`);
    await loadSampleFromWelcome(page);
    await page.waitForTimeout(2000); // the session autosaves 1.5 s after a change
    // Help > User guide opens the guide under the sub-path.
    await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
    const [guide] = await Promise.all([page.waitForEvent('popup'), page.getByRole('menuitem', { name: 'User guide' }).click()]);
    await expect(guide).toHaveURL(`${site}/socius/guide/`);
    await guide.close();
    // The logo is the Home button here too.
    await page.getByRole('button', { name: /Socius home/ }).click();
    await expect(page.getByRole('button', { name: 'Back to your data' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to your data' }).click();

    // The guide, with and without the final slash: "Open Socius" goes to the app.
    for (const g of ['/socius/guide', '/socius/guide/', '/socius/guide/index.html']) {
      await page.goto(site + g);
      await expect(page).toHaveTitle(/guide/i);
      await page.locator('a.btn-open').first().click();
      await expect(page).toHaveURL(`${site}/socius/`);
      await expect(page.locator('.app')).toBeVisible();
    }
    // Refresh keeps the work (the app has one address).
    await page.reload();
    await expect(page.locator('.grid-scroll')).toBeVisible({ timeout: 15_000 });

    // Unknown addresses go to the app, or to the guide.
    await page.goto(`${site}/socius/data/view`);
    await expect(page).toHaveURL(`${site}/socius/`);
    await page.goto(`${site}/socius/Guide/chapter-3`);
    await expect(page).toHaveURL(`${site}/socius/guide/`);
  });
});
