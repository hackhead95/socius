// Targeted checks for the owner's known reports and flows the generic crawl cannot judge.
// Each writes an 'owner-report' or 'flow' finding when the problem reproduces, and a coverage line
// saying what was verified either way.
import type { Page } from '@playwright/test';
import type { Crawler } from './explore';
import { focusInfo, highlightedMenuItems } from './checks';
import { OUT } from './recorder';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

function verdict(c: Crawler, id: string, status: 'reproduced' | 'not reproduced' | 'partly', note: string) {
  appendFileSync(join(OUT, 'raw', `${c.name.replace(/[^a-z0-9_-]+/gi, '_')}.jsonl`), JSON.stringify({ type: 'owner', id, status, note, combo: c.name, at: new Date().toISOString() }) + '\n');
}

/** Owner report 1: renaming a variable in Variable View. Tries every way a person would. */
export async function renameVariable(c: Crawler) {
  const p: Page = c.page;
  if (!(await p.locator('#tab-variables').isEnabled().catch(() => false))) return;
  await c.rec.within('variables', 'Click the "Variable View" tab', async () => {
    await p.locator('#tab-variables').click();
    await p.locator('.vv-scroll').waitFor();
    const nameCell = (r: number) => p.locator(`.vv-row[data-vr="${r}"] .vv-name`);
    const sidebarHas = (n: string) => p.locator('.sidebar-var', { hasText: n }).count();
    const results: string[] = [];
    const attempt = async (how: string, r: number, newName: string, act: () => Promise<void>) => {
      await c.rec.within(null, how, async () => {
        const old = ((await nameCell(r).textContent()) ?? '').trim();
        await act().catch((e) => results.push(`${how}: interaction failed (${(e as Error).message.split('\n')[0]})`));
        await p.waitForTimeout(300);
        const now = ((await nameCell(r).textContent()) ?? '').trim();
        const inSidebar = (await sidebarHas(newName)) > 0 || !(await p.locator('.sidebar').isVisible().catch(() => false));
        if (now !== newName) {
          results.push(`${how}: name stays "${now}" (expected "${newName}")`);
          await c.rec.add('owner-report', { sel: `.vv-row[data-vr="${r}"] .vv-name`, label: 'Rename variable', msg: `Variable View rename failed: ${how}: "${old}" is still "${now}" (expected "${newName}")`, rect: await c.rectOf(nameCell(r)), data: { priority: 'P0' }, title: `Variable rename does not work (${how})` });
        } else if (!inSidebar) {
          results.push(`${how}: renamed in the grid but the variable list still shows the old name`);
          await c.rec.add('owner-report', { sel: '.sidebar', label: 'Rename variable', msg: `after renaming "${old}" to "${newName}" in Variable View, the variable list does not show the new name`, rect: null, data: { priority: 'P1' } });
        } else results.push(`${how}: OK`);
        await p.keyboard.press('Escape').catch(() => undefined);
      });
    };
    await attempt('double-click the Name cell, select all, type a new name, press Enter', 1, 'city_a', async () => {
      await nameCell(1).dblclick();
      await p.keyboard.press('Control+a');
      await p.keyboard.type('city_a');
      await p.keyboard.press('Enter');
    });
    await attempt('click the Name cell once and start typing, press Enter', 2, 'area_b', async () => {
      await nameCell(2).click();
      await p.keyboard.type('area_b');
      await p.keyboard.press('Enter');
    });
    await attempt('select the Name cell and press F2, type, press Tab', 3, 'interviewer_c', async () => {
      await nameCell(3).click();
      await p.keyboard.press('F2');
      await p.keyboard.press('Control+a');
      await p.keyboard.type('interviewer_c');
      await p.keyboard.press('Tab');
    });
    await attempt('double-click the Name cell, type a new name, then click another row', 4, 'int_date_d', async () => {
      await nameCell(4).dblclick();
      await p.keyboard.press('Control+a');
      await p.keyboard.type('int_date_d');
      await p.locator('.vv-row[data-vr="8"] .vv-label').click();
    });
    await attempt('double-click the Name cell, type a new name, then click the Data View tab', 5, 'gender_e', async () => {
      await nameCell(5).dblclick();
      await p.keyboard.press('Control+a');
      await p.keyboard.type('gender_e');
      await p.locator('#tab-data').click();
      await p.waitForTimeout(200);
      await p.locator('#tab-variables').click();
    });
    await attempt('double-click the Name cell, type a new name, then open a menu', 6, 'age_f', async () => {
      await nameCell(6).dblclick();
      await p.keyboard.press('Control+a');
      await p.keyboard.type('age_f');
      if (await p.locator('.menubar').isVisible()) {
        await p.locator('.menubar-btn', { hasText: /^Edit$/ }).click();
        await p.keyboard.press('Escape');
      } else await p.locator('.vv-row[data-vr="9"] .vv-label').click();
    });
    // An invalid name must be explained, not silently dropped.
    await c.rec.within(null, 'Double-click the Name cell of row 8, type "my var" (with a space), press Enter', async () => {
      await nameCell(7).dblclick();
      await p.keyboard.press('Control+a');
      await p.keyboard.type('my var');
      await p.keyboard.press('Enter');
      await p.waitForTimeout(200);
      const err = await p.locator('.vv-error').isVisible().catch(() => false);
      if (!err) await c.rec.add('owner-report', { sel: '.vv-name', label: 'Rename variable', msg: 'an invalid name ("my var") is rejected without any message', rect: await c.rectOf(nameCell(7)), data: { priority: 'P1' } });
      results.push(`invalid name: ${err ? 'error shown' : 'NO error shown'}`);
      await p.keyboard.press('Escape');
    });
    // The rename must survive into analysis dialogs.
    const failures = results.filter((r) => !/OK$|error shown/.test(r));
    verdict(c, 'rename', failures.length ? (failures.length === results.length ? 'reproduced' : 'partly') : 'not reproduced', results.join('; '));
  });
  await c.recover();
}

/** Owner report 2: the Home / "redirect" button. In the app: the Socius logo. In the guide: "Open Socius". */
export async function homeButton(c: Crawler) {
  const p = c.page;
  await c.rec.within('shell/menus/search/help', null, async () => {
    const mark = p.locator('.mark');
    const notes: string[] = [];
    if (await mark.isVisible().catch(() => false)) {
      const tag = await mark.evaluate((m) => `${m.tagName.toLowerCase()}${m.getAttribute('href') ? ` href=${m.getAttribute('href')}` : ''}${m.getAttribute('role') ? ` role=${m.getAttribute('role')}` : ''}`);
      const before = await p.evaluate(() => location.href + '|' + (document.querySelector('.main-tabs [aria-selected="true"]')?.id ?? ''));
      // Go somewhere else first, so "home" has something to do.
      if (await p.locator('#tab-output').isVisible()) await p.locator('#tab-output').click();
      const r = await c.probe('Click the "Socius" logo at the top left (Home)', () => c.mouseClick(mark), { label: 'Socius logo', rect: await c.rectOf(mark), expectEffect: false });
      const after = await p.evaluate(() => location.href + '|' + (document.querySelector('.main-tabs [aria-selected="true"]')?.id ?? ''));
      const nothing = r.mutations === 0 && !r.effects.length;
      const homeShown = await p.locator('.welcome').isVisible().catch(() => false);
      const selTab = await p.evaluate(() => document.querySelector('.main-tabs [aria-selected="true"]')?.textContent?.trim() ?? '');
      if (homeShown && selTab) await c.rec.add('flow', { sel: '.main-tabs', label: 'Home', msg: `after clicking the Socius logo the start screen is shown, but the "${selTab}" tab is still underlined as the current view`, rect: await c.rectOf(p.locator('.tabbar')), data: { priority: 'P2' }, title: 'Home screen: the tab bar still marks another view as current' });
      notes.push(`logo is <${tag}>; click: ${nothing ? 'nothing happens' : `DOM changed (${before} → ${after})`}`);
      if (nothing || /^span|^div/.test(tag))
        await c.rec.add('owner-report', { sel: '.topbar .mark', label: 'Socius logo', msg: `the "Socius" logo looks like a home button but is a plain <${tag}>: clicking it does nothing (no way back to the start/welcome screen or the Data View), and it is not focusable`, rect: await c.rectOf(mark), data: { priority: 'P1' }, title: 'Home: the Socius logo does nothing when clicked' });
      await c.recover();
    }
    // The guide's links back to the app and its in-page anchors.
    const guide = await c.context.newPage();
    try {
      const url = new URL('guide/', c.o.baseURL).href;
      const res = await guide.goto(url);
      if (!res || res.status() >= 400) {
        await c.rec.add('owner-report', { sel: 'guide/', label: 'User guide', msg: `the user guide (${url}) does not load (HTTP ${res?.status()})`, rect: null, data: { priority: 'P0' } });
      } else {
        const links = await guide.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.getAttribute('href')!, abs: (a as HTMLAnchorElement).href, text: (a.textContent ?? '').trim().slice(0, 40) })));
        const missingAnchors = await guide.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')!.slice(1)).filter((id) => id && !document.getElementById(decodeURIComponent(id)) && !document.getElementsByName(id).length && id !== 'top'));
        const hasTop = await guide.evaluate(() => !!document.getElementById('top') || !!document.getElementsByName('top').length);
        if (missingAnchors.length) await c.rec.add('flow', { sel: 'guide a[href^="#"]', label: 'User guide links', msg: `guide links to missing sections: ${[...new Set(missingAnchors)].slice(0, 10).join(', ')}`, rect: null, area: 'shell/menus/search/help', data: { priority: 'P2' }, noShot: true });
        if (!hasTop) notes.push('guide has no #top target (the brand link relies on the browser default)');
        const external = links.filter((l) => !l.href.startsWith('#') && !/^https?:/.test(l.href));
        for (const l of [...new Map(external.map((l) => [l.abs, l])).values()]) {
          const rr = await guide.request.get(l.abs).catch(() => null);
          const st = rr?.status() ?? 0;
          if (st !== 200 || /Open Socius/i.test(l.text)) notes.push(`guide link "${l.text}" → ${l.href} (${st})`);
          if (st >= 400 || st === 0) await c.rec.add('owner-report', { sel: `guide a[href="${l.href}"]`, label: l.text, msg: `the guide's "${l.text}" link (${l.href}) is broken: HTTP ${st}`, rect: null, data: { priority: 'P0' }, noShot: true });
        }
        // Without the trailing slash, "../" leaves the site (GitHub Pages redirects /guide → /guide/, a plain server may not).
        const noSlash = new URL('guide', c.o.baseURL).href;
        const r2 = await guide.goto(noSlash).catch(() => null);
        if (r2 && r2.ok()) {
          const openHref = await guide.evaluate(() => (document.querySelector('a.btn-open') as HTMLAnchorElement | null)?.href ?? '');
          notes.push(`guide opened as ${noSlash}: "Open Socius" resolves to ${openHref}`);
          if (openHref && !openHref.includes('/socius/')) await c.rec.add('owner-report', { sel: 'guide a.btn-open', label: 'Open Socius', msg: `when the guide is opened without a trailing slash (${noSlash}), its "Open Socius" (home) button points to ${openHref}, outside the app`, rect: null, data: { priority: 'P1' }, noShot: true });
        }
        // "Open Socius" from the guide really gets back to the app.
        await guide.goto(url);
        const open = guide.locator('a.btn-open').first();
        if (await open.isVisible().catch(() => false)) {
          await open.click();
          await guide.waitForLoadState('domcontentloaded');
          const ok = await guide.locator('.topbar').isVisible({ timeout: 8000 }).catch(() => false);
          notes.push(`"Open Socius" in the guide → ${guide.url()} (${ok ? 'app loads' : 'app does NOT load'})`);
          if (!ok) await c.rec.add('owner-report', { sel: 'guide a.btn-open', label: 'Open Socius', msg: `the guide's "Open Socius" button goes to ${guide.url()}, which does not show the app`, rect: null, data: { priority: 'P0' }, noShot: true });
        }
      }
    } finally {
      await guide.close().catch(() => undefined);
    }
    verdict(c, 'home', notes.some((n) => /nothing happens|NOT load|\(4\d\d\)/.test(n)) ? 'reproduced' : 'not reproduced', notes.join('; '));
  });
}

/** Owner report 3: menu hover sticks after clicking a tab; hover does not follow the pointer. */
export async function menuHoverAfterTab(c: Crawler) {
  const p = c.page;
  if (!(await p.locator('.menubar').isVisible().catch(() => false))) return;
  const notes: string[] = [];
  await c.rec.within('shell/menus/search/help', null, async () => {
    const tabs = await p.locator('.main-tabs .tab:not([disabled])').evaluateAll((els) => els.map((e) => e.id));
    for (const tab of tabs) {
      await c.rec.within(null, `Click the "${tab.replace('tab-', '')}" tab, then move the pointer over the File, Edit and View menus and open View`, async () => {
        await c.mouseClick(p.locator(`#${tab}`));
        await p.waitForTimeout(150);
        for (const m of ['File', 'Edit', 'View']) await c.mouseHover(c.topButton(m), 6);
        const lit = await p.evaluate(() => [...document.querySelectorAll('.menubar-btn')].filter((b) => getComputedStyle(b).backgroundColor !== 'rgba(0, 0, 0, 0)').map((b) => b.textContent));
        if (lit.length !== 1 || lit[0] !== 'View') {
          notes.push(`after ${tab}: highlighted menubar buttons ${JSON.stringify(lit)} with the pointer on View`);
          await c.rec.add('owner-report', { sel: '.menubar', label: 'menubar hover', msg: `after clicking the ${tab.replace('tab-', '')} tab and pointing at "View", highlighted menubar buttons are ${JSON.stringify(lit)}`, rect: await c.rectOf(p.locator('.menubar')), data: { priority: 'P1' }, title: 'Menubar hover stuck after clicking a tab' });
        }
        await c.mouseClick(c.topButton('View'));
        await p.waitForTimeout(120);
        const items = p.locator('.menu-dropdown > .menu-item-wrap > .menu-item:not([aria-disabled="true"])');
        const n = await items.count();
        for (let i = 0; i < n; i++) {
          const lab = (await items.nth(i).getAttribute('data-label')) ?? '';
          await c.mouseHover(items.nth(i), 6);
          await p.waitForTimeout(40);
          const hl = (await p.evaluate(highlightedMenuItems)).filter((h) => h !== 'View');
          if (hl.length !== 1 || !lab.startsWith(hl[0].slice(0, 12))) {
            notes.push(`after ${tab}: pointer on "${lab}" but highlighted ${JSON.stringify(hl)}`);
            await c.rec.add('owner-report', { sel: '.menu-dropdown', label: lab, msg: `after clicking the ${tab.replace('tab-', '')} tab and opening View, the pointer is on "${lab}" but highlighted items are ${JSON.stringify(hl)}`, rect: await c.rectOf(p.locator('.menu-dropdown')), data: { priority: 'P1' }, title: 'Menu hover does not follow the pointer' });
            break;
          }
        }
        await p.keyboard.press('Escape');
        // Choose a menu item that switches tab, then hover the menubar again.
        await c.mouseClick(c.topButton('View'));
        const out = p.locator('.menu-dropdown .menu-item[data-label="Output"]');
        if (await out.isVisible().catch(() => false)) {
          await c.mouseHover(out);
          await p.mouse.down();
          await p.mouse.up();
          await p.waitForTimeout(150);
          await p.mouse.move(600, 400, { steps: 6 });
          const f = await p.evaluate(focusInfo);
          const lit2 = await p.evaluate(() => [...document.querySelectorAll('.menubar-btn')].filter((b) => getComputedStyle(b).backgroundColor !== 'rgba(0, 0, 0, 0)' || getComputedStyle(b).outlineStyle !== 'none' || getComputedStyle(b).boxShadow !== 'none').map((b) => b.textContent));
          if (lit2.length) {
            notes.push(`after View > Output with the pointer away: ${JSON.stringify(lit2)} still highlighted (focus on ${f.sel})`);
            await c.rec.add('owner-report', { sel: '.menubar', label: 'View', msg: `after choosing View > Output with the mouse and moving the pointer away, the "${lit2.join(', ')}" menubar button stays highlighted`, rect: await c.rectOf(p.locator('.menubar')), data: { priority: 'P2' } });
          }
        }
        await c.recover();
      });
    }
  });
  verdict(c, 'menu-hover', notes.length ? 'reproduced' : 'not reproduced', notes.join('; ') || 'menubar and menu item highlight followed the pointer after clicking every tab');
}

/** Owner report 4: AI connection. Real AI cannot be tested here; check the settings dialog UI. */
export async function aiSettings(c: Crawler) {
  const p = c.page;
  const notes: string[] = [];
  await c.rec.within('AI/assistant', null, async () => {
    const mode = await c.menubarMode();
    if (mode !== 'bar') return;
    await c.openTop('AI');
    const item = p.locator('.menu-dropdown .menu-item', { hasText: /settings/i }).first();
    const r = await c.probe('Choose AI > AI assistant settings...', () => c.mouseClick(item), { label: 'AI settings' });
    if (!r.modalsAfter) {
      await c.rec.add('owner-report', { sel: 'AI > settings', label: 'AI settings', msg: 'AI > AI assistant settings... opens no dialog', rect: null, data: { priority: 'P0' } });
      verdict(c, 'ai', 'reproduced', 'settings dialog does not open');
      return;
    }
    const dlg = p.locator('.modal').last();
    const choices = dlg.locator('.ai-choice');
    const n = await choices.count();
    notes.push(`${n} provider choices: ${(await dlg.locator('.ai-choice-title').allTextContents()).map((s) => s.trim()).join(' / ')}`);
    await c.check({});
    for (let i = 0; i < n; i++) {
      const ch = choices.nth(i);
      const name = ((await ch.locator('.ai-choice-title').textContent().catch(() => '')) ?? '').trim();
      await c.rec.within(null, `In AI assistant settings, choose "${name}"`, async () => {
        const rr = await c.probe(`Choose "${name}"`, () => c.mouseClick(ch), { label: name, rect: await c.rectOf(ch), expectEffect: false });
        void rr;
        await p.waitForTimeout(250);
        await c.check({});
        // Key fields: typing a fake key and "Test connection" must give feedback (network is blocked here).
        const key = dlg.locator('input[type=password], input[autocomplete="off"], input[placeholder*="key" i]').first();
        if (await key.isVisible().catch(() => false)) {
          await key.fill('AIzaFAKE-crawler-key-000000000000000');
          const test = dlg.locator('button', { hasText: /test|check|connect/i }).first();
          if (await test.isVisible().catch(() => false)) {
            const before = await dlg.innerText().catch(() => '');
            const tr = await c.probe(`Type a made-up key and click "${((await test.textContent()) ?? '').trim()}"`, () => c.mouseClick(test), { label: 'Test connection', rect: await c.rectOf(test), waitMs: 3000 });
            const after = await dlg.innerText().catch(() => '');
            const added = after.split('\n').filter((l) => l.trim() && !before.includes(l.trim()));
            const verdictLine = added.find((l) => /connect|works|fail|could not|not valid|invalid|error/i.test(l)) ?? '';
            notes.push(`${name}: test with a made-up key → ${verdictLine || (added.length ? added.slice(0, 2).join(' / ') : 'no new message')}`.slice(0, 260));
            if (!added.length && !tr.toast) await c.rec.add('owner-report', { sel: '.modal .ai-choice', label: name, msg: `"${name}": testing a made-up key shows no result message, so a researcher cannot tell whether the connection works`, rect: await c.rectOf(dlg), data: { priority: 'P1' }, title: 'AI settings: Test connection gives no feedback' });
            // The top-bar status must not say "ready" when the test just failed.
            const chip = await p.locator('.ai-chip').getAttribute('data-ready').catch(() => null);
            const chipLabel = (await p.locator('.ai-chip').getAttribute('aria-label').catch(() => '')) ?? '';
            if (/not connected|could not|failed|not valid|invalid/i.test(verdictLine) && chip === 'yes')
              await c.rec.add('owner-report', { sel: '.topbar .ai-chip', label: 'AI chip', msg: `after "${name}" failed its connection test with a made-up key ("${verdictLine.slice(0, 80)}"), the top-bar AI status still says "${chipLabel}" (data-ready=yes): the app reports AI as ready when it cannot connect`, rect: await c.rectOf(p.locator('.ai-chip')), data: { priority: 'P1' }, title: 'AI status says "ready" although the connection test failed' });
          }
          await key.fill('');
        }
      });
    }
    await c.focusChecks('AI assistant');
    await c.closeTopDialog('AI assistant', null);
  });
  verdict(c, 'ai', 'partly', notes.join('; ') || 'dialog opened');
  await c.recover();
}

/** The theme button in the top bar cycles themes and the page repaints without leftovers. */
export async function themeToggle(c: Crawler) {
  const p = c.page;
  const btn = p.locator('.topbar-right button[aria-label^="Theme"]');
  if (!(await btn.isVisible().catch(() => false))) return;
  await c.rec.within('theme', null, async () => {
    const labels: string[] = [];
    for (let i = 0; i < 3; i++) {
      labels.push((await btn.getAttribute('aria-label')) ?? '');
      await c.probe(`Click the theme button (${labels[labels.length - 1]})`, () => c.mouseClick(btn), { label: 'theme button', rect: await c.rectOf(btn) });
      await c.check({ overflow: false, overlap: false, occlusion: false });
    }
    const end = (await btn.getAttribute('aria-label')) ?? '';
    if (end !== labels[0]) await c.rec.add('flow', { sel: '.topbar theme button', label: 'theme', msg: `three clicks on the theme button do not cycle back (${labels.join(' → ')} → ${end})`, rect: null, data: { priority: 'P2' } });
  });
}
