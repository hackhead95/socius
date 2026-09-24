// Regression tests for the owner's reports of September 2026: menus with real mouse movement, the
// Home button (Socius logo), renaming variables, Undo that follows the tab, and one
// "Load sample interviews..." command. The GitHub Pages sub-path checks are in subpath.spec.ts.
import { expect, test, type Page } from '@playwright/test';
import { loadSampleFromWelcome, openWithSample } from './helpers';

type Pt = { x: number; y: number };

/** Move the mouse in small steps, as a hand does (hover handlers see every step). */
async function glide(page: Page, from: Pt, to: Pt, steps = 12) {
  for (let i = 1; i <= steps; i++) await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
  return to;
}

async function centre(page: Page, selector: string): Promise<Pt> {
  const b = (await page.locator(selector).first().boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** Labels of everything drawn highlighted in the open menus (menubar buttons and items). */
async function highlighted(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.menu-item, .menubar-btn')]
      .filter((e) => {
        const bg = getComputedStyle(e).backgroundColor;
        return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      })
      .map((e) => (e.querySelector('.menu-label')?.textContent ?? e.textContent ?? '').trim()),
  );
}

const openMenus = (page: Page) => page.locator('.menubar .menu-dropdown');

test.describe('menus with a real mouse', () => {
  test('hover switches menus, the highlight follows the pointer, submenus survive a diagonal move, and a tab click leaves nothing open', async ({ page }) => {
    await openWithSample(page);
    let at = await centre(page, '.menubar-btn >> text=File');
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await page.mouse.up();
    await expect(openMenus(page)).toHaveCount(1);
    // Opened with the mouse: no item is highlighted yet, and the menu button does not keep focus.
    expect(await highlighted(page)).toEqual(['File']);
    expect(await page.evaluate(() => document.activeElement?.classList.contains('menubar-btn'))).toBe(false);

    // Once a menu is open, pointing at another menu opens it.
    at = await glide(page, at, await centre(page, '.menubar-btn >> text=Edit'));
    at = await glide(page, at, await centre(page, '.menubar-btn >> text=View'));
    await expect(page.locator('.menubar-btn[aria-expanded="true"]')).toHaveText('View');
    await expect(openMenus(page)).toHaveCount(1);

    // Down the items: exactly one item is highlighted, the one under the pointer.
    const items = page.locator('.menubar .menu-dropdown > .menu-item-wrap > .menu-item');
    for (let k = 0; k < 4; k++) {
      const b = (await items.nth(k).boundingBox())!;
      at = await glide(page, at, { x: b.x + 40, y: b.y + b.height / 2 }, 6);
      const label = (await items.nth(k).locator('.menu-label').innerText()).trim();
      expect(await highlighted(page)).toEqual(['View', label]);
    }
    // Keyboard continues from the item under the pointer.
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.menubar .menu-dropdown .menu-item:focus .menu-label')).toHaveText('Output');
    expect(await highlighted(page)).toEqual(['View', 'Output']);

    // Pointer leaves the menu into empty space: nothing stays highlighted.
    at = await glide(page, at, { x: at.x + 600, y: at.y + 250 });
    expect(await highlighted(page)).toEqual(['View']);

    // Click a main tab: the menu closes and nothing stays open or highlighted.
    at = await glide(page, at, await centre(page, '#tab-variables'));
    await page.mouse.down();
    await page.mouse.up();
    await expect(openMenus(page)).toHaveCount(0);
    await expect(page.locator('#tab-variables')).toHaveAttribute('aria-selected', 'true');
    at = await glide(page, at, { x: at.x + 300, y: at.y + 300 });
    expect(await highlighted(page)).toEqual([]);
    // With no menu open, passing over the menu bar opens nothing.
    at = await glide(page, at, await centre(page, '.menubar-btn >> text=Data'));
    await expect(openMenus(page)).toHaveCount(0);

    // Submenus open on hover after a short delay, and a diagonal move into them does not switch submenus.
    await page.mouse.down();
    await page.mouse.up();
    at = await glide(page, at, await centre(page, '.menubar-btn >> text=Analyze'));
    const ds = page.locator('.menubar .menu-dropdown .menu-item', { hasText: 'Descriptive Statistics' });
    const dsBox = (await ds.boundingBox())!;
    at = await glide(page, at, { x: dsBox.x + 30, y: dsBox.y + dsBox.height / 2 }, 8);
    await expect(page.locator('.menu-submenu[aria-label="Descriptive Statistics"]')).toBeVisible();
    const target = page.locator('.menu-submenu .menu-item').nth(3);
    const tb = (await target.boundingBox())!;
    // The straight line from the item to the 4th submenu item crosses the items below it.
    at = await glide(page, at, { x: tb.x + 30, y: tb.y + tb.height / 2 }, 10);
    await expect(page.locator('.menu-submenu')).toHaveAttribute('aria-label', 'Descriptive Statistics');
    await expect(page.locator('.menu-submenu .menu-item:focus .menu-label')).toHaveText((await target.locator('.menu-label').innerText()).trim());
    // Resting on another item switches to its submenu.
    const cm = page.locator('.menubar .menu-dropdown > .menu-item-wrap > .menu-item', { hasText: 'Compare Means' });
    const cmBox = (await cm.boundingBox())!;
    at = await glide(page, at, { x: cmBox.x + 30, y: cmBox.y + cmBox.height / 2 }, 12);
    await page.waitForTimeout(600);
    await expect(page.locator('.menu-submenu')).toHaveAttribute('aria-label', 'Compare Means');

    // Esc closes the submenu, then the menu.
    await page.keyboard.press('Escape');
    await expect(page.locator('.menu-submenu')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(openMenus(page)).toHaveCount(0);

    // Click outside closes too.
    await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
    await expect(openMenus(page)).toHaveCount(1);
    await page.mouse.click(700, 600);
    await expect(openMenus(page)).toHaveCount(0);
    // So does leaving the window (Alt-Tab) or the browser tab.
    await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(openMenus(page)).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Help', exact: true }).click();
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(openMenus(page)).toHaveCount(0);
  });

  test('choosing an item with the mouse leaves no menu button focused or highlighted', async ({ page }) => {
    await openWithSample(page);
    await page.locator('.grid-scroll').click({ position: { x: 200, y: 80 } });
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await page.locator('.menubar .menu-dropdown .menu-item', { hasText: 'Output' }).click();
    await expect(page.locator('#tab-output')).toHaveAttribute('aria-selected', 'true');
    await expect(openMenus(page)).toHaveCount(0);
    expect(await page.evaluate(() => !!document.activeElement?.closest('.menubar'))).toBe(false);
    await page.mouse.move(700, 600);
    expect(await highlighted(page)).toEqual([]);
  });

  test('keyboard navigation still works', async ({ page }) => {
    await openWithSample(page);
    await page.getByRole('menuitem', { name: 'File', exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.menubar .menu-dropdown .menu-item:focus .menu-label')).toHaveText('New dataset');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.menubar-btn[aria-expanded="true"]')).toHaveText('Edit');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.menubar-btn[aria-expanded="true"]')).toHaveText('Analyze');
    await page.keyboard.press('ArrowRight'); // opens the submenu of the first item
    await expect(page.locator('.menu-submenu .menu-item:focus')).toHaveCount(1);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.menu-submenu')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(openMenus(page)).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Analyze', exact: true })).toBeFocused();
  });

  test('the phone menu sheet opens, lists every menu and closes', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await openWithSample(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    const sheet = page.getByRole('dialog', { name: 'Menu' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'View' }).click();
    await sheet.getByRole('button', { name: 'Output' }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.locator('#tab-output')).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0);
  });
});

test.describe('Home', () => {
  test('the Socius logo shows the start screen over open data, and Back returns', async ({ page }) => {
    await openWithSample(page);
    const home = page.getByRole('button', { name: /Socius home/ });
    await home.click();
    await expect(page.locator('.welcome')).toBeVisible();
    await expect(page.getByRole('button', { name: /Open data file/ })).toBeVisible();
    await expect(page.locator('.sidebar')).toHaveCount(0);
    const back = page.getByRole('button', { name: 'Back to your data' });
    await expect(back).toBeFocused();
    await back.click();
    await expect(page.locator('.grid-scroll')).toBeVisible();
    // A tab also leaves the start screen.
    await home.click();
    await page.locator('#tab-variables').click();
    await expect(page.locator('.vv-scroll')).toBeVisible();
    // From Output or Text coding as well.
    await page.locator('#tab-coding').click();
    await home.click();
    await expect(page.locator('.welcome')).toBeVisible();
    await page.locator('#tab-coding').click();
    await expect(page.locator('.cw')).toBeVisible();
  });
});

test.describe('renaming variables', () => {
  test('rename in Variable View: fixing a typo with the mouse, invalid names, clicking away, and from a Data View heading', async ({ page }) => {
    await openWithSample(page);
    await page.locator('#tab-variables').click();
    const nameCell = (r: number) => page.locator(`.vv-row[data-vr="${r}"] .vv-name`);
    const input = page.locator('.vv-input');

    // Clicking inside the box to fix a typo keeps what you typed (it used to put the old name back).
    await nameCell(1).dblclick();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('tonw');
    await input.click({ position: { x: 12, y: 8 } });
    await expect(input).toHaveValue('tonw');
    await page.keyboard.press('End');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('wn');
    await page.keyboard.press('Enter');
    await expect(nameCell(1)).toHaveText('town');

    // Change of capitals only.
    await nameCell(1).dblclick();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Town');
    await page.keyboard.press('Enter');
    await expect(nameCell(1)).toHaveText('Town');

    // Bengali letters.
    await nameCell(2).dblclick();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText('এলাকা');
    await page.keyboard.press('Tab');
    await expect(nameCell(2)).toHaveText('এলাকা');

    // Invalid: a clear message, and Enter keeps you in the box.
    await nameCell(3).dblclick();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('age group');
    await page.keyboard.press('Enter');
    await expect(page.locator('.vv-error')).toHaveText('Names cannot contain spaces. Try age_group.');
    await expect(input).toBeFocused();
    // Clicking another cell is not blocked: the old name stays and a message says why.
    await nameCell(5).click();
    await expect(page.locator('.vv-error')).toHaveCount(0);
    await expect(page.locator('.toast', { hasText: 'not changed' })).toBeVisible();
    await expect(nameCell(3)).not.toHaveText('age group');
    await page.keyboard.press('ArrowDown'); // the grid has the keyboard again
    await expect(page.locator('.vv-row[data-vr="6"] .vv-name.active')).toHaveCount(1);

    // Duplicate (ignoring capitals).
    await nameCell(4).dblclick();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('TOWN');
    await page.keyboard.press('Enter');
    await expect(page.locator('.vv-error')).toContainText('already called Town');
    await page.keyboard.press('Escape');

    // Undo names the rename, in this tab.
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await expect(page.locator('.menubar .menu-dropdown .menu-item').first()).toContainText('Undo rename of');
    await page.keyboard.press('Escape');

    // Double-clicking a column heading in Data View opens the name for renaming.
    await page.locator('#tab-data').click();
    const head = page.locator('.grid-hcell', { hasText: /^age$/ });
    await head.dblclick();
    await expect(page.locator('.vv-scroll')).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('age');
    await page.keyboard.type('age_years');
    await page.keyboard.press('Enter');
    await page.locator('#tab-data').click();
    await expect(page.locator('.grid-hcell', { hasText: /^age_years$/ })).toBeVisible();
  });
});

test.describe('Undo follows the tab', () => {
  test('in Text coding, Ctrl+Z and Edit > Undo undo coding changes and leave the data alone', async ({ page }) => {
    await openWithSample(page);
    // A data change first.
    const col = await page.locator('.grid-hcell', { hasText: /^age$/ }).getAttribute('data-hc');
    const cell = page.locator(`.grid-cell[data-r="0"][data-c="${col}"]`);
    await cell.click();
    await page.keyboard.type('77');
    await page.keyboard.press('Enter');
    await expect(cell).toHaveText('77');

    // One command, same label, from the menu and from the toolbar.
    await page.getByRole('menuitem', { name: 'Text coding', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Load sample interviews...' }).click();
    const dialog = page.locator('.modal', { hasText: 'Import sources' });
    await expect(dialog).toBeVisible();
    const loadBtn = dialog.getByRole('button', { name: /^Load 3 interviews$/ });
    await expect(loadBtn).toBeEnabled();
    await loadBtn.click();
    await expect(page.locator('.toast', { hasText: 'Loaded 3 sample interviews' })).toBeVisible();
    await page.locator('.cw-toolbar button', { hasText: 'Import' }).click();
    await page.getByRole('menuitem', { name: 'Load sample interviews...' }).click();
    await expect(page.locator('.modal', { hasText: 'All the sample interviews are already loaded' })).toBeVisible();
    await expect(page.locator('.modal').getByRole('button', { name: /^Load 0 interviews$/ })).toBeDisabled();
    await page.keyboard.press('Escape');

    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await expect(page.locator('.menubar .menu-dropdown .menu-item').first()).toContainText('Undo load sample interviews');
    await page.keyboard.press('Escape');
    await page.locator('.cw-main').click({ position: { x: 5, y: 5 } }).catch(() => undefined);
    await page.keyboard.press('Control+z');
    await expect(page.locator('.cw-welcome')).toBeVisible();
    // Nothing more to undo in Text coding, although the data has a change.
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await expect(page.locator('.menubar .menu-dropdown .menu-item').first()).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+y');
    await expect(page.locator('.cw-welcome')).toHaveCount(0);

    // Back in Data View, Ctrl+Z undoes the data change.
    await page.locator('#tab-data').click();
    await expect(cell).toHaveText('77');
    await page.locator('.grid-scroll').focus();
    await page.keyboard.press('Control+z');
    await expect(cell).not.toHaveText('77');
  });
});
