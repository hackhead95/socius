// Shared by the command smoke specs (e2e/commands-smoke*.spec.ts): walk the real menus, invoke a
// command by its menu path, and watch for page errors and error-log errors.
import { expect, type Page } from '@playwright/test';

export interface MenuNode {
  /** Menu path, e.g. ["Analyze", "Descriptive Statistics", "Crosstabs..."]. */
  path: string[];
  disabled: boolean;
  title: string | null;
  checkbox: boolean;
}

/** Collect uncaught page errors and console errors (fonts blocked by the sandbox are not app errors). */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/** Error-level entries in the error log (this browser context is fresh, so every entry is from this run). */
export async function errorLogErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    try {
      const o = JSON.parse(localStorage.getItem('socius.errorlog') ?? '{}') as { entries?: Array<{ level: string; area: string; message: string; context?: { op?: string } }> };
      return (o.entries ?? []).filter((e) => e.level === 'error').map((e) => `${e.area}: ${e.message}${e.context?.op ? ` (${e.context.op})` : ''}`);
    } catch {
      return ['could not read the error log'];
    }
  });
}

/** Close menus, dialogs and popups until the page is back to its normal state. */
export async function settle(page: Page): Promise<void> {
  for (let i = 0; i < 4; i++) {
    const open = await page.locator('.menu-dropdown, .modal, .palette, .as-panel').count();
    if (!open) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
  }
}

async function openTop(page: Page, label: string) {
  await settle(page);
  await page.locator('.menubar').getByRole('menuitem', { name: label, exact: true }).click();
  await expect(page.locator('.menu-dropdown')).toBeVisible();
}

async function readItems(page: Page, menu: ReturnType<Page['locator']>): Promise<Array<{ label: string; disabled: boolean; title: string | null; sub: boolean; checkbox: boolean }>> {
  return menu.evaluate((el) =>
    Array.from(el.querySelectorAll(':scope > .menu-item-wrap > [role^="menuitem"]')).map((b) => ({
      label: (b.querySelector('.menu-label')?.textContent ?? '').trim(),
      disabled: b.getAttribute('aria-disabled') === 'true',
      title: b.getAttribute('title'),
      sub: b.getAttribute('aria-haspopup') === 'menu',
      checkbox: b.getAttribute('role') === 'menuitemcheckbox',
    })),
  );
}

/** Every command in the given top-level menus, read from the live menubar (so new commands are included). */
export async function menuTree(page: Page, tops: string[]): Promise<MenuNode[]> {
  const out: MenuNode[] = [];
  for (const top of tops) {
    await openTop(page, top);
    const items = await readItems(page, page.locator('.menu-dropdown').first());
    for (const it of items) {
      if (!it.sub) {
        out.push({ path: [top, it.label], disabled: it.disabled, title: it.title, checkbox: it.checkbox });
        continue;
      }
      if (it.disabled) {
        out.push({ path: [top, it.label], disabled: true, title: it.title, checkbox: false });
        continue;
      }
      await openTop(page, top);
      await page.locator('.menu-dropdown').first().locator(`:scope > .menu-item-wrap > [data-label="${it.label}"]`).click();
      const sub = page.locator('.menu-dropdown .menu-submenu').last();
      await expect(sub).toBeVisible();
      for (const c of await readItems(page, sub)) out.push({ path: [top, it.label, c.label], disabled: c.disabled, title: c.title, checkbox: c.checkbox });
    }
    await settle(page);
  }
  return out;
}

/** Choose a command by its menu path, clicking through the menubar like a user. */
export async function invoke(page: Page, path: string[]): Promise<void> {
  await openTop(page, path[0]);
  for (let i = 1; i < path.length; i++) {
    const scope = i === 1 ? page.locator('.menu-dropdown').first() : page.locator('.menu-dropdown .menu-submenu').last();
    await scope.locator(`:scope > .menu-item-wrap > [data-label="${path[i]}"]`).click();
    if (i < path.length - 1) await expect(page.locator('.menu-dropdown .menu-submenu').last()).toBeVisible();
  }
}

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Text that must never appear in a result: numbers that failed to compute or leaked placeholders. */
export const BAD_OUTPUT = /\bNaN\b|\bundefined\b|\bn\/a\b|\[object Object\]/i;
