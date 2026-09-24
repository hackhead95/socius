// Regression tests for the QA crawl of September 2026 (docs/qa/UI-BUGS.md), shell side: toasts that
// covered dialog buttons, focus after dialogs, the nested Error log dialog, the assistant panel over
// the top bar, the assistant button over content, menubar hover intent, search on a command that
// needs data, focus rings, contrast, truncated text, the start screen tab, backdrop clicks, the
// tablet status line and variable list, deleting a result, and Select Cases' first focus.
import { expect, test, type Page } from '@playwright/test';
import { loadSampleFromWelcome, openWithSample } from './helpers';

type Pt = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };

async function centre(page: Page, selector: string): Promise<Pt> {
  const b = (await page.locator(selector).first().boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** What a click at the centre of `selector` would hit (its closest button, or the element). */
async function hitAt(page: Page, selector: string): Promise<string> {
  const c = await centre(page, selector);
  return page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const b = el?.closest('button') ?? el;
    return (b?.getAttribute('aria-label') || b?.textContent || '').trim();
  }, c);
}

async function focused(page: Page): Promise<string> {
  return page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    if (!a || a === document.body) return 'BODY';
    return `${a.className}|${(a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 40)}`;
  });
}

async function chooseFromMenu(page: Page, top: string, ...path: string[]) {
  await page.getByRole('menuitem', { name: top, exact: true }).click();
  for (const [i, label] of path.entries()) {
    const menu = i === 0 ? page.locator('.menubar .menu-dropdown') : page.locator('.menu-submenu').last();
    const item = menu.locator(':scope > .menu-item-wrap > .menu-item', { hasText: label }).first();
    if (i < path.length - 1) await item.hover();
    else await item.click();
  }
}

test.describe('overlays never cover controls', () => {
  test('UI-001: a toast shown while a dialog is open sits beside it, and clicks reach the Run button', async ({ page }) => {
    await openWithSample(page);
    // The "Loaded ... sample" toast is still showing when the dialog opens.
    await expect(page.locator('.toast')).toHaveCount(1);
    await chooseFromMenu(page, 'Analyze', 'Descriptive Statistics', 'Frequencies');
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('.toasts')).toHaveClass(/toasts-by-modal/);
    const toast = (await page.locator('.toast').first().boundingBox())!;
    const box = (await modal.boundingBox())!;
    expect(overlaps(toast, box)).toBe(false);
    expect(await hitAt(page, '.modal-footer .btn-primary')).toMatch(/Run|OK/);
    // The toast body lets clicks through; only its own buttons take them.
    expect(await page.locator('.toast').first().evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('none');
    expect(await page.locator('.toast .btn').first().evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('auto');
  });

  test('UI-001 (phone): with a full-screen dialog the toast lets every click through', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await openWithSample(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    const sheet = page.getByRole('dialog', { name: 'Menu' });
    await sheet.getByRole('button', { name: 'Data' }).click();
    await sheet.getByRole('button', { name: /^Select cases/ }).click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.evaluate(() => document.querySelector('.modal-body')?.scrollTo(0, 0));
    await expect(page.locator('.toasts')).toHaveClass(/toasts-passive/);
    expect(await hitAt(page, '.modal [data-close]')).toBe('Close');
  });

  test('UI-007: the assistant panel opens below the top bar and tabs; Undo, theme and the menus stay usable', async ({ page }) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(vp);
      await openWithSample(page);
      await page.keyboard.press('Control+j');
      const panel = page.getByTestId('assistant-panel');
      await expect(panel).toBeVisible();
      const top = (await panel.boundingBox())!.y;
      const tabsBottom = await page.locator('.tabbar').evaluate((e) => e.getBoundingClientRect().bottom);
      expect(top).toBeGreaterThanOrEqual(tabsBottom - 1);
      // Wide windows make room for it: the page's content ends where the panel begins.
      if (vp.width >= 1000) {
        const ws = (await page.locator('.workspace').boundingBox())!;
        expect(ws.x + ws.width).toBeLessThanOrEqual((await panel.boundingBox())!.x + 1);
      }
      expect(await hitAt(page, '.topbar-right button[aria-label^="Theme"]')).toMatch(/^Theme/);
      expect(await hitAt(page, '.menubar-btn >> text=Help')).toBe('Help');
      // A menu opened while the panel is showing is drawn above it.
      await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
      const item = page.locator('.menubar .menu-dropdown .menu-item').first();
      expect(await hitAt(page, '.menubar .menu-dropdown .menu-item >> nth=0')).toBe((await item.textContent())!.trim());
      await page.keyboard.press('Escape');
    }
  });

  test('UI-009: the assistant button is docked in the tab bar instead of floating over content', async ({ page }) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 400, height: 800 }]) {
      await page.setViewportSize(vp);
      await openWithSample(page);
      const fab = (await page.getByTestId('assistant-fab').boundingBox())!;
      const tabbar = (await page.locator('.tabbar').boundingBox())!;
      expect(fab.y).toBeGreaterThanOrEqual(tabbar.y - 1);
      expect(fab.y + fab.height).toBeLessThanOrEqual(tabbar.y + tabbar.height + 1);
      // The tabs keep clear of it.
      const lastTab = (await page.locator('.main-tabs .tab').last().boundingBox())!;
      expect(overlaps(lastTab, fab)).toBe(false);
      // Text coding: the codebook's actions at the bottom right are not under it.
      await page.locator('#tab-coding').click();
      expect(overlaps(fab, (await page.locator('.main').boundingBox())!)).toBe(false);
    }
  });
});

test.describe('focus after dialogs', () => {
  test('UI-005: dialogs chosen from a menu give focus back to the menu button, never the body or the assistant button', async ({ page }) => {
    await openWithSample(page);
    // Opening and closing the assistant first leaves focus on its button (the old bug sent Help dialogs there).
    await page.keyboard.press('Control+j');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('assistant-fab')).toBeFocused();
    const cases: Array<[string, string[]]> = [
      ['Analyze', ['Descriptive Statistics', 'Frequencies']],
      ['Transform', ['Compute Variable']],
      ['Help', ['Keyboard shortcuts']],
      ['Help', ['About Socius']],
      ['AI', ['AI assistant settings']],
      ['File', ['Recent projects']],
    ];
    for (const [top, path] of cases) {
      await chooseFromMenu(page, top, ...path);
      await expect(page.locator('.modal')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.modal')).toHaveCount(0);
      await expect(page.getByRole('menuitem', { name: top, exact: true }), `${top} > ${path.join(' > ')}`).toBeFocused();
    }
    // Where the user was working wins: a Data View cell keeps its place.
    await page.locator('.grid-cell[data-r="2"][data-c="3"]').click();
    await chooseFromMenu(page, 'Data', 'Sort cases');
    await expect(page.locator('.modal')).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await focused(page)).not.toBe('BODY');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.dataview'))).toBe(true);
  });

  test('UI-006: the Error log opened from About takes focus and keeps Tab inside', async ({ page }) => {
    await openWithSample(page);
    await chooseFromMenu(page, 'Help', 'About Socius');
    await page.getByRole('button', { name: 'Help > Error log' }).click();
    await expect(page.locator('.modal h2')).toHaveText('Error log');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.modal'))).toBe(true);
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('.modal'))).toBe(true);
    }
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('.modal'))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Help', exact: true })).toBeFocused();
  });

  test('UI-028: Select Cases opens with focus on the chosen option, so Space does not change it', async ({ page }) => {
    await openWithSample(page);
    await chooseFromMenu(page, 'Data', 'Select cases');
    // The dialog starts on "Cases that meet a condition": that option has the focus, not "All cases".
    const cond = page.getByRole('radio', { name: /Cases that meet a condition/ });
    await expect(cond).toBeChecked();
    await expect(cond).toBeFocused();
    await page.keyboard.press('Space');
    await expect(cond).toBeChecked();
    await expect(page.getByRole('radio', { name: /All cases/ })).not.toBeChecked();
    await page.locator('#sc-cond').fill('age > 30');
    await page.locator('.modal-footer .btn-primary').click();
    await expect(page.locator('.chip-filter')).toBeVisible();
    // Reopened with a filter on, the chosen option still has the focus.
    await page.locator('.chip-filter .chip-main').click();
    await expect(page.locator('.modal')).toBeVisible();
    const checked = page.locator('.modal input[type=radio][name=sc]:checked');
    await expect(checked).toBeFocused();
  });

  test('UI-022: a click on the dimmed area keeps a dialog with choices open, and closes an information dialog', async ({ page }) => {
    await openWithSample(page);
    await chooseFromMenu(page, 'Analyze', 'Descriptive Statistics', 'Frequencies');
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    await page.mouse.click(8, 890);
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await chooseFromMenu(page, 'Help', 'Keyboard shortcuts');
    await expect(modal).toBeVisible();
    await page.mouse.click(8, 890);
    await expect(modal).toHaveCount(0);
  });
});

test.describe('menus and search', () => {
  test('UI-004: after the arrow keys, pointing at an item leaves exactly one item highlighted', async ({ page }) => {
    await openWithSample(page);
    await page.getByRole('menuitem', { name: 'Analyze', exact: true }).click();
    const items = page.locator('.menubar .menu-dropdown > .menu-item-wrap > .menu-item:not([aria-disabled="true"])');
    // Pointing down the items opens their submenus on the way.
    for (let i = 0; i < 5; i++) {
      await items.nth(i).hover();
      await page.waitForTimeout(160);
    }
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await items.nth(3).hover();
    const lit = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.menubar .menu-dropdown > .menu-item-wrap > .menu-item')]
        .filter((e) => {
          const bg = getComputedStyle(e).backgroundColor;
          return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
        })
        .map((e) => e.dataset.label),
    );
    expect(lit).toEqual([await items.nth(3).getAttribute('data-label')]);
  });

  test('UI-011: moving diagonally from a menu title to its items does not switch menus; resting on the next title does', async ({ page }) => {
    await openWithSample(page);
    const file = await centre(page, '.menubar-btn >> text=File');
    await page.mouse.move(file.x, file.y);
    await page.mouse.down();
    await page.mouse.up();
    const first = (await page.locator('.menubar .menu-dropdown > .menu-item-wrap > .menu-item').first().boundingBox())!;
    await page.mouse.move(first.x + first.width * 0.6, first.y + first.height / 2, { steps: 12 });
    await page.waitForTimeout(100);
    await expect(page.locator('.menubar-btn[aria-expanded="true"]')).toHaveText('File');
    // Pointing at Edit and staying there opens Edit.
    const edit = await centre(page, '.menubar-btn >> text=Edit');
    await page.mouse.move(edit.x, edit.y, { steps: 4 });
    await expect(page.locator('.menubar-btn[aria-expanded="true"]')).toHaveText('Edit');
    // Moving along the bar switches at once.
    const view = await centre(page, '.menubar-btn >> text=View');
    await page.mouse.move(view.x, view.y, { steps: 6 });
    await expect(page.locator('.menubar-btn[aria-expanded="true"]')).toHaveText('View', { timeout: 150 });
  });

  test('UI-012: Enter on a command that needs data explains why and offers a way forward', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.welcome')).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox', { name: 'Search Socius' }).fill('frequencies');
    await page.keyboard.press('Enter');
    const note = page.locator('.palette-blocked');
    await expect(note).toContainText('Open or create a dataset first');
    await expect(note.getByRole('button', { name: 'Open data file...' })).toBeVisible();
    await note.getByRole('button', { name: 'Load sample survey' }).click();
    await expect(page.locator('.palette')).toHaveCount(0);
    await expect(page.locator('.grid-scroll')).toBeVisible();
  });
});

test.describe('data views and look', () => {
  test('UI-013: the variable search boxes show focus', async ({ page }) => {
    await openWithSample(page);
    await chooseFromMenu(page, 'Transform', 'Compute Variable');
    const input = page.locator('.modal .varpicker-input').first();
    const before = await input.evaluate((e) => getComputedStyle(e).backgroundColor + getComputedStyle(e.parentElement!).borderColor);
    await input.focus();
    const after = await input.evaluate((e) => getComputedStyle(e).backgroundColor + getComputedStyle(e.parentElement!).borderColor);
    expect(after).not.toBe(before);
  });

  test('UI-014: secondary text colours pass 4.5:1 in both themes', async ({ page }) => {
    await openWithSample(page);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      const worst = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement);
        const hex = (v: string) => {
          let h = v.trim().replace('#', '');
          if (h.length === 3) h = h.replace(/./g, (c) => c + c);
          return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
        };
        const lum = (c: number[]) => {
          const f = (x: number) => ((x /= 255) <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
          return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
        };
        const ratio = (a: string, b: string) => {
          const x = lum(hex(cs.getPropertyValue(a)));
          const y = lum(hex(cs.getPropertyValue(b)));
          return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
        };
        let min = 99;
        for (const fg of ['--faint', '--muted']) for (const bg of ['--bg', '--surface', '--surface-2', '--surface-3', '--accent-soft', '--grid-sel', '--grid-rownum']) min = Math.min(min, ratio(fg, bg));
        return min;
      });
      expect(worst, theme).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('UI-015: a Data View cell cut short shows its full text on hover', async ({ page }) => {
    await openWithSample(page);
    const cut = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.grid-cell')].filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => ({ text: c.textContent, title: c.title })),
    );
    expect(cut.length).toBeGreaterThan(0);
    for (const c of cut) expect(c.title).toContain(c.text!);
  });

  test('UI-017: on the start screen no view tab is marked as current', async ({ page }) => {
    await openWithSample(page);
    await page.locator('#tab-output').click();
    await page.getByRole('button', { name: /Socius home/ }).click();
    await expect(page.locator('.welcome')).toBeVisible();
    await expect(page.locator('.main-tabs [aria-selected="true"]')).toHaveCount(0);
    await page.locator('#tab-output').click();
    await expect(page.locator('#tab-output')).toHaveAttribute('aria-selected', 'true');
  });

  test('UI-024 and UI-025: at tablet width the status shortens with a tooltip, and View > Variable list opens a drawer', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await openWithSample(page);
    const status = page.locator('.dataview .toolbar-status');
    await expect(status).toHaveAttribute('title', /Case 1 of 640 · resp_id Respondent ID/);
    const box = (await status.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(768);
    expect(await status.evaluate((e) => getComputedStyle(e).textOverflow)).toBe('ellipsis');

    await expect(page.locator('.sidebar')).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    const item = page.locator('.menubar .menu-dropdown [data-item-id="v-side"]');
    await expect(item).toHaveAttribute('aria-checked', 'false');
    await item.click();
    const drawer = page.locator('.sidebar-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('.varpicker-input')).toBeFocused();
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await expect(page.locator('.menubar .menu-dropdown [data-item-id="v-side"]')).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    // Choosing a variable closes the drawer and shows it in the grid.
    await drawer.getByRole('option', { name: /^age/ }).click();
    await expect(drawer).toHaveCount(0);
    await expect(page.locator('.toolbar-status')).toContainText('age');
    // Escape closes it too.
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await page.locator('.menubar .menu-dropdown [data-item-id="v-side"]').click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
  });

  test('UI-027: deleting a result says so with Undo, the same step as Edit > Undo', async ({ page }) => {
    await openWithSample(page);
    for (const q of ['frequencies', 'descriptives']) {
      await page.keyboard.press('Control+k');
      await page.getByRole('combobox', { name: 'Search Socius' }).fill(q);
      await page.keyboard.press('Enter');
      await expect(page.locator('.modal')).toBeVisible();
      await page.locator('.modal [role=option]').nth(6).dblclick();
      await page.locator('.modal-footer .btn-primary').click();
      await expect(page.locator('.modal')).toHaveCount(0);
    }
    const items = page.locator('article[data-item-id]');
    await expect(items).toHaveCount(2);
    await page.locator('.oi-delete').first().click();
    await expect(items).toHaveCount(1);
    const toast = page.locator('.toast', { hasText: 'Deleted' });
    await expect(toast).toContainText('Edit > Undo');
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(items).toHaveCount(2);
    // Edit > Undo has nothing left to bring back (the toast's Undo was that step).
    await page.locator('.oi-delete').first().click();
    await expect(items).toHaveCount(1);
    await page.keyboard.press('Control+z');
    await expect(items).toHaveCount(2);
  });

  test('Recode and Compute: the toast offers "Show" for the new variable', async ({ page }) => {
    await openWithSample(page);
    await chooseFromMenu(page, 'Transform', 'Compute Variable');
    await page.locator('#cv-target').fill('age10');
    await page.locator('#cv-expr').fill('age / 10');
    await page.locator('.modal-footer .btn-primary').click();
    const toast = page.locator('.toast', { has: page.getByRole('button', { name: 'Show' }) });
    await expect(toast).toBeVisible();
    await page.locator('#tab-output').click();
    await toast.getByRole('button', { name: 'Show' }).click();
    await expect(page.locator('#tab-data')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.toolbar-status')).toContainText('age10');
  });
});

test('first visit: the welcome screen still loads the sample', async ({ page }) => {
  await page.goto('/');
  await loadSampleFromWelcome(page);
});
