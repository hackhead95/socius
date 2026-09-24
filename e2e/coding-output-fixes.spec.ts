// Regression checks for the Text coding, Output and chart bugs from the QA crawl (docs/qa/UI-BUGS.md):
// UI-002, UI-008, UI-016, UI-018/029, UI-019, UI-023, UI-026 and UI-030.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openWithSample } from './helpers';

async function workedExample(page: Page) {
  await openWithSample(page);
  await page.getByRole('tab', { name: 'Text coding', exact: true }).click();
  await page.locator('.cw-welcome-card', { hasText: 'Explore a worked example' }).click();
  await expect(page.locator('.cw-resp-tools .help')).toHaveText(/^630 shown/);
}

async function menu(page: Page, ...path: string[]) {
  await page.getByRole('menuitem', { name: path[0], exact: true }).click();
  for (const p of path.slice(1)) await page.getByRole('menuitem', { name: p, exact: true }).click();
}

/** "24 Sep 2026, 14:55" (en-GB order) or "Sep 24, 2026, 14:55" (en-US order): month as a word, 24-hour clock. */
const DATE_TIME = /^(\d{1,2} [A-Z][a-z]{2,3} \d{4}|[A-Z][a-z]{2,3} \d{1,2}, \d{4}), \d{2}:\d{2}$/;

test('UI-002: the Documents tab opens in a responses-only project and says how to add documents', async ({ page }) => {
  await workedExample(page);
  const docsTab = page.locator('.cw-viewtabs [role=tab]', { hasText: 'Documents' });
  await docsTab.click();
  await page.waitForTimeout(400);
  await expect(docsTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.cw-center')).toContainText('No documents yet');
  await expect(page.locator('.cw-center button', { hasText: 'Import documents...' })).toBeVisible();
  await page.locator('.cw-center button', { hasText: 'Go to Responses' }).click();
  await expect(page.locator('.cw-viewtabs [role=tab][aria-selected=true]')).toContainText('Responses');
});

for (const vp of [
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 400, height: 800 },
]) {
  test(`UI-008/UI-016: the Coder menu stays on screen at ${vp.width}px and its disabled item says why`, async ({ page }) => {
    await page.setViewportSize(vp);
    await workedExample(page);
    await page.locator('.cw-toolbar .cw-menu-trigger', { hasText: 'Coder:' }).click();
    const list = page.locator('.cw-toolbar .cw-menu-list');
    await expect(list).toBeVisible();
    await expect(list).toHaveAttribute('data-placement', /up|down/);
    const box = (await list.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    const current = list.getByRole('menuitem', { name: /coding now/ });
    await expect(current).toBeDisabled();
    await expect(current).toHaveAttribute('title', /already coding as/);
    // Every toolbar dropdown stays on screen too.
    await page.keyboard.press('Escape');
    for (const name of ['Import', 'Export']) {
      await page.locator('.cw-toolbar .cw-menu-trigger', { hasText: new RegExp(`^${name}`) }).click();
      const b = (await list.boundingBox())!;
      expect(b.x, name).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, name).toBeLessThanOrEqual(vp.width);
      await page.keyboard.press('Escape');
    }
  });
}

test('UI-023: on a phone the Text coding view tabs show that they scroll', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await workedExample(page);
  const wrap = page.locator('.cw-viewtabs-wrap');
  await expect(wrap).toHaveClass(/more-right/);
  const after = await wrap.evaluate((el) => getComputedStyle(el, '::after').content);
  expect(after).not.toBe('none');
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Memos' }).click();
  await expect(wrap).toHaveClass(/more-left/);
  const memos = (await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Memos' }).boundingBox())!;
  expect(memos.x + memos.width).toBeLessThanOrEqual(400);
});

test('UI-019: Code frequencies shows theme totals including sub-codes', async ({ page }) => {
  await workedExample(page);
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Analyse' }).click();
  await page.locator('.cw-analyse [role=tab]', { hasText: 'Code frequencies' }).click();
  const row = page.locator('.cw-ftable tbody tr', { hasText: 'Infrastructure and services' });
  await expect(row).toHaveClass(/cw-ftheme/);
  await expect(row).toContainText('theme total');
  const cells = await row.locator('td.num').allInnerTexts();
  expect(Number(cells[1])).toBeGreaterThan(100);
  expect(cells[2]).not.toBe('0.0%');
});

test('UI-030: memo dates use the same format as the Output', async ({ page }) => {
  await workedExample(page);
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Memos' }).click();
  const meta = await page.locator('.cw-memo-item .cw-docmeta').first().innerText();
  expect(meta.split(' · ').pop()!).toMatch(DATE_TIME);
  const foot = await page.locator('.cw-memo-editor .help').last().innerText();
  expect(foot.replace(/^.*last edited /, '')).toMatch(DATE_TIME);
  // An Output item's time, for comparison.
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Analyse' }).click();
  await page.locator('.cw-analyse button', { hasText: 'Send to Output' }).first().click();
  // Send to Output opens the Output tab.
  await expect(page.locator('.ov-doc .oi-meta').first()).toBeVisible();
  const outMeta = await page.locator('.ov-doc .oi-meta').first().innerText();
  expect(outMeta.split(' · ').find((p) => DATE_TIME.test(p))).toBeTruthy();
});

test('UI-026: charts are numbered APA figures with the title once, in Output and in the HTML export', async ({ page }) => {
  await openWithSample(page);
  await menu(page, 'Graphs', 'Bar Chart...');
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill('educ');
  await page.locator('.pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: '[educ]' }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(0).locator('button.pd-arrow').click();
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0, { timeout: 30_000 });
  const item = page.locator('.ov-doc article').last();
  const cap = item.locator('.ob-fig-caption');
  await expect(cap.locator('.ob-fig-number')).toHaveText(/^Figure \d+$/);
  await expect(cap.locator('.ob-fig-title')).toHaveText('Highest level of education completed');
  expect(await cap.locator('.ob-fig-title').evaluate((el) => getComputedStyle(el).fontStyle)).toBe('italic');
  // The title is not drawn again inside the chart, but the chart keeps it as its accessible name.
  await expect(item.locator('.chart-header text')).toHaveCount(0);
  await expect(item.locator('svg.chart-svg title')).toHaveText('Highest level of education completed');
  // Tables and figures are numbered separately, like the Word and HTML exports.
  await expect(item.locator('.ot-number').first()).toHaveText(/^Table \d+$/);

  await page.locator('button', { hasText: 'Export report' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('.ov-menu-item', { hasText: 'Web page' }).click()]);
  const html = readFileSync((await dl.path())!, 'utf8');
  expect(html).toMatch(/>Figure 1</);
  const svg = html.slice(html.indexOf('<svg'), html.indexOf('</svg>'));
  // No visible title inside the image under the "Figure 1" caption: the only <text> with these
  // words is the x-axis label (the accessible <title> stays).
  expect((svg.match(/Highest level of education completed<\/text>/g) ?? []).length).toBe(1);
  expect(svg).toContain('<title');
});

test('narrow screens: the stacked Sources and Codebook panels keep their contents clickable', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await workedExample(page);
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Documents' }).click();
  expect((await page.locator('.cw-sources').boundingBox())!.height).toBeGreaterThan(100);
  expect((await page.locator('.cw-codebook').boundingBox())!.height).toBeGreaterThan(100);
  const item = page.locator('.cw-docitem-resp');
  const b = (await item.boundingBox())!;
  const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.cw-docitem-resp'), [b.x + b.width / 2, b.y + b.height / 2]);
  expect(hit).toBe(true);
  await item.click();
  await expect(page.locator('.cw-viewtabs [role=tab][aria-selected=true]')).toContainText('Responses');
});
