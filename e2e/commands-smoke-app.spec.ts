// Command smoke test, every menu except Analyze and Graphs (those are in commands-smoke-analyze.spec.ts):
// with the sample survey loaded, every command in File, Edit, View, Data, Transform, Text coding
// (with the worked example loaded), AI and Help is chosen from the live menubar, so a new command is
// included automatically. What each one must do:
// - saves and exports: a non-empty download;
// - Open data file / Open project: the browser's file chooser;
// - User guide: a new tab;
// - Close data and start fresh, Clear output: a confirmation (cancelled here);
// - commands ending in "...": a dialog, search or assistant panel opens (then it is closed);
// - Theme: the page theme changes; View tabs: that tab is selected;
// - everything else: runs.
// No command may cause a page error, a console error or an error in the error log.
import { expect, test, type Page } from '@playwright/test';
import { openWithSample } from './helpers';
import { errorLogErrors, invoke, menuTree, settle, watchErrors, type MenuNode } from './commands-smoke-helpers';

test.describe.configure({ mode: 'parallel' });

type Kind = 'download' | 'chooser' | 'popup' | 'confirm' | 'theme' | 'tab' | 'opens' | 'runs' | 'later';

function kindOf(path: string[]): Kind {
  const p = path.join(' > ');
  if (/^File > (Save project|Save data as > .+|Export codebook > .+|Export output report > .+)$/.test(p)) return 'download';
  if (/^File > (Open data file|Open project)\.\.\.$/.test(p)) return 'chooser';
  if (/^File > (New dataset|Load sample survey)$/.test(p)) return 'later';
  if (/^Help > User guide$/.test(p)) return 'popup';
  if (/^(File > Close data and start fresh|Edit > Clear output)\.\.\.$/.test(p)) return 'confirm';
  if (/^View > Theme > /.test(p)) return 'theme';
  if (/^View > (Data View|Variable View|Output|Text coding)$/.test(p)) return 'tab';
  if (/^Edit > (Find in data|Go to case)\.\.\.$/.test(p)) return 'runs';
  if (/\.\.\.$/.test(p) || /^Help > (Getting started|Keyboard shortcuts|Send feedback or report a problem|About Socius)$/.test(p)) return 'opens';
  return 'runs';
}

const OPENED = '.modal, .palette, .as-panel';

async function exercise(page: Page, node: MenuNode): Promise<void> {
  const kind = kindOf(node.path);
  const name = node.path.join(' > ');
  switch (kind) {
    case 'download': {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30_000 }), invoke(page, node.path)]);
      const file = await dl.path();
      const { statSync } = await import('node:fs');
      expect(statSync(file).size, `${name}: ${dl.suggestedFilename()} is empty`).toBeGreaterThan(0);
      break;
    }
    case 'chooser':
      await Promise.all([page.waitForEvent('filechooser', { timeout: 10_000 }), invoke(page, node.path)]);
      break;
    case 'popup': {
      const [popup] = await Promise.all([page.waitForEvent('popup', { timeout: 10_000 }), invoke(page, node.path)]);
      await popup.close();
      break;
    }
    case 'confirm': {
      await invoke(page, node.path);
      const dlg = page.locator('.modal');
      await expect(dlg, name).toBeVisible();
      await dlg.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(dlg).toHaveCount(0);
      break;
    }
    case 'theme': {
      await invoke(page, node.path);
      const want = node.path[2] === 'Dark' ? 'dark' : node.path[2] === 'Light' ? 'light' : null;
      if (want) await expect(page.locator('html'), name).toHaveAttribute('data-theme', want);
      else await expect(page.locator('html'), name).not.toHaveAttribute('data-theme', /./);
      break;
    }
    case 'tab': {
      await invoke(page, node.path);
      await expect(page.getByRole('tab', { name: new RegExp(`^${node.path[1]}`) }), name).toHaveAttribute('aria-selected', 'true');
      break;
    }
    case 'opens':
      await invoke(page, node.path);
      await expect(page.locator(OPENED).first(), `${name} opens a dialog or panel`).toBeVisible();
      break;
    case 'runs':
      await invoke(page, node.path);
      break;
    case 'later':
      return;
  }
  await page.waitForTimeout(100);
  await settle(page);
}

async function runAll(page: Page, tops: string[], errors: string[]): Promise<MenuNode[]> {
  const nodes = await menuTree(page, tops);
  const done: MenuNode[] = [];
  for (const n of nodes) {
    // Disabled items say why (checked by the navigation audit); here only Undo and Redo may be disabled.
    if (n.disabled) {
      expect(n.path[0] === 'Edit' && /^(Undo|Redo)/.test(n.path[1]), `${n.path.join(' > ')} is disabled: ${n.title}`).toBe(true);
      continue;
    }
    await test.step(n.path.join(' > '), async () => {
      await exercise(page, n);
      expect(errors, n.path.join(' > ')).toEqual([]);
    });
    done.push(n);
  }
  return done;
}

async function addOutput(page: Page) {
  await invoke(page, ['Analyze', 'Descriptive Statistics', 'Frequencies...']);
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill('gender');
  await page.locator('.modal .pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: '[gender]' }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(0).locator('button.pd-arrow').click();
  await page.locator('.modal .pd-run').click();
  await expect(page.locator('.modal')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('.ov-doc article')).not.toHaveCount(0);
}

test('File, Edit and View: every command does its job', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watchErrors(page);
  await openWithSample(page);
  await addOutput(page);
  // A data change, so Undo and Redo have something to do.
  await page.getByRole('tab', { name: 'Variable View' }).click();
  const done = await runAll(page, ['File', 'Edit', 'View'], errors);
  expect(done.length).toBeGreaterThan(25);

  // Last: the commands that replace the open data (they ask first, since there are unsaved changes).
  await test.step('File > New dataset', async () => {
    await invoke(page, ['File', 'New dataset']);
    const confirm = page.locator('.modal');
    if (await confirm.count()) await confirm.locator('.modal-footer .btn').last().click();
    await expect(page.locator('.dataset-size')).toBeVisible();
  });
  await test.step('File > Load sample survey', async () => {
    await invoke(page, ['File', 'Load sample survey']);
    const confirm = page.locator('.modal');
    if (await confirm.count()) await confirm.locator('.modal-footer .btn').last().click();
    await expect(page.locator('.dataset-size')).toContainText('640');
  });
  expect(await errorLogErrors(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('Data and Transform: every command opens, runs or turns off', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watchErrors(page);
  await openWithSample(page);
  // Weight and filter on, so "Turn weighting off" and "Turn filter off" are in the Data menu.
  await invoke(page, ['Data', 'Weight cases...']);
  await page.locator('.modal').getByLabel(/Weight cases by/).check();
  await page.locator('.modal').getByRole('listbox', { name: 'Weight variable', exact: true }).getByRole('option', { name: /^wt\b/ }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.chip-weight')).toBeVisible();
  await invoke(page, ['Data', 'Select cases...']);
  await page.locator('.modal label.check', { hasText: 'A random sample' }).locator('input').check();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.chip-filter')).toBeVisible();

  const done = await runAll(page, ['Data', 'Transform'], errors);
  const labels = done.map((n) => n.path.join(' > '));
  expect(labels).toContain('Data > Turn filter off (use all cases)');
  expect(labels).toContain('Data > Turn weighting off');
  await expect(page.locator('.chip-weight, .chip-filter')).toHaveCount(0);
  expect(await errorLogErrors(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('Text coding: every command works on the worked example', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watchErrors(page);
  await openWithSample(page);
  await page.getByRole('tab', { name: 'Text coding' }).click();
  await page.locator('.cw-welcome-card', { hasText: 'Explore a worked example' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Example loaded' })).toBeVisible();
  const done = await runAll(page, ['Text coding'], errors);
  expect(done.length).toBeGreaterThan(15);
  await expect(page.getByRole('tab', { name: 'Text coding' })).toHaveAttribute('aria-selected', 'true');
  expect(await errorLogErrors(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('AI and Help: every command opens its dialog, panel or page', async ({ page, context }) => {
  test.setTimeout(120_000);
  // The feedback form is on GitHub: answer locally.
  await context.route('https://github.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>GitHub</title>' }));
  const errors = watchErrors(page);
  await openWithSample(page);
  await addOutput(page);
  const done = await runAll(page, ['AI', 'Help'], errors);
  expect(done.length).toBeGreaterThanOrEqual(12);
  expect(await errorLogErrors(page)).toEqual([]);
  expect(errors).toEqual([]);
});
