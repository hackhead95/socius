#!/usr/bin/env node
// UI state permutations (Playwright, standalone; not part of `npm test`).
//
//   npx vite build --outDir /tmp/fuzz/dist --emptyOutDir     # build once
//   node scripts/fuzz/ui-permutations.mjs [--dist /tmp/fuzz/dist] [--full] [--seed 1]
//
// States: {no data, sample, sample+weight, sample+filter, sample+weight+filter} x value labels on/off x
// theme light/dark x viewport 1440/768/400, covered pairwise (all combinations with --full).
// Actions per state: open every menu, open Frequencies / Crosstabs / Independent T test / Linear
// Regression and run with the defaults (must show inline problems, not crash) and with one variable
// combination (must add an Output item), switch the main tabs, undo/redo, open the assistant, open search.
// Invariants: no page errors or console errors, no horizontal page overflow, menus and dialogs fit the
// viewport, results appear. Writes $FUZZ_OUT/ui.json (default /tmp/socius-fuzz) and exits 1 on failures.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const DIST = opt('--dist', '/tmp/fuzz/dist');
const FULL = args.includes('--full');
const ONLY = opt('--only', ''); // e.g. "sample+filter|off|dark|400"
const OUT = process.env.FUZZ_OUT ?? join(tmpdir(), 'socius-fuzz');
const CHROMIUM = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`No build at ${DIST}. Run: npx vite build --outDir ${DIST} --emptyOutDir`);
  process.exit(2);
}

// ---------- static server ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.sav': 'application/octet-stream', '.csv': 'text/csv', '.txt': 'text/plain', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let p = normalize(join(DIST, url));
  if (!p.startsWith(DIST)) return res.writeHead(403).end();
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) return res.writeHead(404).end('not found');
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// ---------- the state space ----------
const DATA = ['none', 'sample', 'sample+weight', 'sample+filter', 'sample+weight+filter'];
const LABELS = ['on', 'off'];
const THEMES = ['light', 'dark'];
const VIEWPORTS = [1440, 768, 400];

function pairwiseStates() {
  const params = [DATA, LABELS, THEMES, VIEWPORTS];
  const uncovered = new Set();
  for (let i = 0; i < params.length; i++) for (let j = i + 1; j < params.length; j++) for (const a of params[i]) for (const b of params[j]) uncovered.add(`${i}:${a}|${j}:${b}`);
  const rows = [];
  // Greedy over the full product (small): pick the row covering most uncovered pairs.
  const all = [];
  for (const d of DATA) for (const l of LABELS) for (const t of THEMES) for (const v of VIEWPORTS) all.push([d, l, t, v]);
  const gain = (r) => {
    let g = 0;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (uncovered.has(`${i}:${r[i]}|${j}:${r[j]}`)) g++;
    return g;
  };
  while (uncovered.size) {
    let best = all[0];
    let bg = -1;
    for (const r of all) {
      const g = gain(r);
      if (g > bg) {
        bg = g;
        best = r;
      }
    }
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) uncovered.delete(`${i}:${best[i]}|${j}:${best[j]}`);
    rows.push(best);
  }
  return rows;
}

const states = (FULL || ONLY ? DATA.flatMap((d) => LABELS.flatMap((l) => THEMES.flatMap((t) => VIEWPORTS.map((v) => [d, l, t, v])))) : pairwiseStates()).filter((s) => !ONLY || s.join('|') === ONLY);

// ---------- helpers ----------
const failures = [];
const IGNORE_CONSOLE = /Failed to load resource|fonts\.g(oogleapis|static)|net::ERR_/;

function stateName(s) {
  return `data=${s[0]} labels=${s[1]} theme=${s[2]} width=${s[3]}`;
}

async function withTimeout(p, ms, what) {
  let t;
  const timeout = new Promise((_, rej) => (t = setTimeout(() => rej(new Error(`timed out after ${ms} ms: ${what}`)), ms)));
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

async function overflow(page) {
  return page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    const over = el.scrollWidth - window.innerWidth;
    if (over <= 1) return null;
    // Find the widest offender for the report.
    let worst = null;
    for (const n of document.querySelectorAll('body *')) {
      const r = n.getBoundingClientRect();
      if (r.right > window.innerWidth + 1 && r.width > 0 && getComputedStyle(n).position !== 'fixed') {
        if (!worst || r.right > worst.right) worst = { right: Math.round(r.right), cls: `${n.tagName.toLowerCase()}.${String(n.className).split(' ').slice(0, 2).join('.')}` };
      }
    }
    return { over, worst };
  });
}

async function fits(page, selector) {
  const loc = page.locator(selector).first();
  if (!(await loc.count())) return null;
  const box = await loc.boundingBox();
  const vp = page.viewportSize();
  if (!box || !vp) return null;
  const probs = [];
  if (box.x < -1 || box.x + box.width > vp.width + 1) probs.push(`x ${Math.round(box.x)}..${Math.round(box.x + box.width)} outside 0..${vp.width}`);
  if (box.y < -1 || box.y + box.height > vp.height + 1) probs.push(`y ${Math.round(box.y)}..${Math.round(box.y + box.height)} outside 0..${vp.height}`);
  return probs.length ? probs.join(', ') : null;
}

async function palette(page, query) {
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  const dlg = page.getByRole('dialog', { name: 'Search Socius' });
  await dlg.waitFor({ timeout: 5000 });
  await dlg.getByRole('combobox').fill(query);
  await dlg.getByRole('option').first().waitFor({ timeout: 5000 });
  await page.keyboard.press('Enter');
}

async function addVar(page, slot, name) {
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill(name);
  await page.locator('.pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: `[${name}]` }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(slot).locator('button.pd-arrow').click();
  await search.fill('');
}

// ---------- one state ----------
async function runState(browser, s) {
  const [data, labels, theme, width] = s;
  const height = width === 400 ? 800 : width === 768 ? 1024 : 900;
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE_CONSOLE.test(m.text())) errors.push(`console.error: ${m.text().slice(0, 300)}`);
  });
  const fail = (action, check, detail) => failures.push({ area: 'ui', subject: action, check, detail, state: stateName(s), repro: `node scripts/fuzz/ui-permutations.mjs --only "${s.join('|')}"  # then: ${action}` });
  const step = async (action, fn) => {
    const before = errors.length;
    try {
      await withTimeout(fn(), 45_000, action);
    } catch (e) {
      fail(action, 'action-failed', String(e.message).split('\n')[0].slice(0, 300));
      await page.keyboard.press('Escape').catch(() => {});
      await page.keyboard.press('Escape').catch(() => {});
    }
    for (const e of errors.slice(before)) fail(action, 'error', e);
    const o = await overflow(page).catch(() => null);
    if (o) fail(action, 'overflow', `page scrolls sideways by ${o.over}px${o.worst ? ` (widest: ${o.worst.cls} reaching ${o.worst.right}px)` : ''}`);
  };

  await step('load', async () => {
    await page.goto(BASE);
    await page.locator('.welcome').waitFor({ timeout: 30_000 });
    if (data !== 'none') {
      await page.getByRole('button', { name: /Load sample survey/ }).click();
      await page.locator('.grid-scroll').waitFor({ timeout: 30_000 });
    }
  });

  if (data.includes('weight'))
    await step('set weight (Data > Weight cases)', async () => {
      await palette(page, 'Weight cases');
      await page.locator('.modal').waitFor();
      await page.locator('.modal label.check', { hasText: 'Weight cases by' }).click();
      await page.locator('.modal .varpicker-input').fill('wt');
      await page.locator('.modal .varpicker-item', { has: page.locator('.varpicker-name', { hasText: /^wt$/ }) }).click();
      await page.locator('.modal button', { hasText: /^OK$/ }).click();
      await page.locator('.modal').waitFor({ state: 'detached' });
    });
  if (data.includes('filter'))
    await step('set filter (Data > Select cases, age > 30)', async () => {
      await palette(page, 'Select cases');
      await page.locator('.modal').waitFor();
      await page.locator('.modal label.check', { hasText: 'Cases that meet a condition' }).click();
      await page.locator('.modal #sc-cond').fill('age > 30');
      await page.locator('.modal button', { hasText: /^OK$/ }).click();
      await page.locator('.modal').waitFor({ state: 'detached' });
    });
  if (labels === 'off' && data !== 'none')
    await step('value labels off (View menu)', async () => {
      await palette(page, 'Value labels in Data View');
    });

  // Every menu.
  await step('open every menu', async () => {
    const bar = page.locator('.menubar');
    if (await bar.isVisible()) {
      const n = await page.locator('.menubar-btn').count();
      for (let i = 0; i < n; i++) {
        const btn = page.locator('.menubar-btn').nth(i);
        const name = (await btn.innerText()).trim();
        await btn.click();
        await page.locator('.menu-dropdown').first().waitFor({ timeout: 5000 });
        const f = await fits(page, '.menu-dropdown');
        if (f) fail(`menu ${name}`, 'fit', `dropdown does not fit the viewport: ${f}`);
        await page.keyboard.press('Escape');
      }
    } else {
      await page.locator('.menu-sheet-btn').click();
      await page.locator('.menu-sheet').waitFor();
      const f = await fits(page, '.menu-sheet');
      if (f) fail('menu sheet', 'fit', `menu sheet does not fit: ${f}`);
      const n = await page.locator('.menu-sheet-title').count();
      for (let i = 0; i < n; i++) {
        await page.locator('.menu-sheet-title').nth(i).click();
        const o = await page.evaluate(() => {
          const b = document.querySelector('.menu-sheet');
          return b ? b.scrollWidth - b.clientWidth : 0;
        });
        if (o > 1) fail(`menu sheet section ${i}`, 'overflow', `menu sheet scrolls sideways by ${o}px`);
      }
      await page.keyboard.press('Escape');
    }
  });

  // Analysis dialogs.
  const dialogs = [
    { q: 'Frequencies', vars: [[0, 'educ']] },
    { q: 'Crosstabs', vars: [[0, 'civic_meet'], [1, 'migrant']] },
    { q: 'Independent-Samples T Test', vars: [[0, 'life_sat'], [1, 'migrant']] },
    { q: 'Linear Regression', vars: [[0, 'life_sat'], [1, 'age'], [1, 'educ']] },
  ];
  if (data !== 'none')
    for (const d of dialogs) {
      await step(`${d.q}: run with defaults`, async () => {
        await palette(page, d.q);
        await page.locator('.modal').waitFor({ timeout: 10_000 });
        const f = await fits(page, '.modal');
        if (f) fail(d.q, 'fit', `dialog does not fit: ${f}`);
        const hOver = await page.evaluate(() => {
          const m = document.querySelector('.modal .modal-body');
          return m ? m.scrollWidth - m.clientWidth : 0;
        });
        if (hOver > 1) fail(d.q, 'overflow', `dialog body scrolls sideways by ${hOver}px`);
        await page.locator('.modal .pd-run').click();
        // With no variables: inline problems, the dialog stays open.
        await page.locator('.modal .pd-problems, .modal .pd-error').first().waitFor({ timeout: 10_000 });
      });
      await step(`${d.q}: run with ${d.vars.map((v) => v[1]).join(', ')}`, async () => {
        if (!(await page.locator('.modal').count())) {
          await palette(page, d.q);
          await page.locator('.modal').waitFor();
        }
        const before = await page.locator('.ov-doc article').count();
        for (const [slot, name] of d.vars) await addVar(page, slot, name);
        await page.locator('.modal .pd-run').click();
        await page.locator('.modal').waitFor({ state: 'detached', timeout: 30_000 }).catch(async () => {
          const msg = await page.locator('.modal .pd-problems, .modal .pd-error').first().innerText().catch(() => '(no message)');
          throw new Error(`dialog stayed open: ${msg.slice(0, 200)}`);
        });
        await page.locator('.ov-doc article').nth(before).waitFor({ timeout: 15_000 });
        const art = page.locator('.ov-doc article').last();
        const txt = await art.innerText();
        if (/\bNaN\b|\bundefined\b|\[object Object\]/.test(txt)) fail(d.q, 'output-text', `output shows ${txt.match(/\bNaN\b|\bundefined\b|\[object Object\]/)[0]}`);
        const tw = await art.evaluate((a) => {
          let worst = 0;
          for (const t of a.querySelectorAll('table')) {
            const sc = t.closest('[class*="scroll"], .ob-table, .table-wrap') ?? t.parentElement;
            worst = Math.max(worst, t.getBoundingClientRect().right - (sc?.getBoundingClientRect().right ?? window.innerWidth));
          }
          return worst;
        });
        void tw;
      });
    }

  // Tabs.
  await step('switch tabs', async () => {
    const tabs = page.getByRole('tab');
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      const t = tabs.nth(i);
      if (await t.isDisabled()) continue;
      if (!(await t.isVisible())) continue;
      await t.click();
      await page.waitForTimeout(150);
      const o = await overflow(page);
      if (o) fail(`tab ${(await t.innerText()).trim()}`, 'overflow', `page scrolls sideways by ${o.over}px${o.worst ? ` (widest: ${o.worst.cls} reaching ${o.worst.right}px)` : ''}`);
    }
  });

  await step('undo / redo', async () => {
    await page.locator('body').click({ position: { x: 5, y: height - 5 } }).catch(() => {});
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+y');
    await page.keyboard.press('Control+Shift+z');
  });

  await step('open assistant (Ctrl+J)', async () => {
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+j');
    const panel = page.getByTestId('assistant-panel');
    await panel.waitFor({ timeout: 10_000 });
    const f = await fits(page, '[data-testid="assistant-panel"]');
    if (f) fail('assistant', 'fit', `assistant panel does not fit: ${f}`);
    await page.keyboard.press('Control+j');
  });

  await step('open search (Ctrl+K) and look for "chi square"', async () => {
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+k');
    const dlg = page.getByRole('dialog', { name: 'Search Socius' });
    await dlg.waitFor({ timeout: 5000 });
    const f = await fits(page, '.palette');
    if (f) fail('search', 'fit', `search palette does not fit: ${f}`);
    await dlg.getByRole('combobox').fill('chi square');
    await dlg.getByRole('option').first().waitFor({ timeout: 5000 });
    await page.keyboard.press('Escape');
  });

  // Results: the four analyses must all be in Output.
  if (data !== 'none') {
    await page.keyboard.press('Escape').catch(() => {});
    await page.getByRole('tab', { name: /Output/ }).first().click().catch(() => {});
    await page.waitForTimeout(300);
    const nOut = await page.locator('.ov-doc article').count().catch(() => 0);
    if (nOut < dialogs.length) fail('results', 'missing-output', `only ${nOut} of ${dialogs.length} analyses reached Output`);
  }
  await ctx.close();
}

// ---------- main ----------
const browser = await chromium.launch({ executablePath: CHROMIUM });
const t0 = Date.now();
for (const s of states) {
  const n0 = failures.length;
  await runState(browser, s);
  console.log(`${stateName(s)}: ${failures.length - n0} problem(s)`);
}
await browser.close();
server.close();

// De-duplicate by (subject, check, detail with numbers elided).
const seen = new Map();
for (const f of failures) {
  const key = `${f.subject}|${f.check}|${f.detail.replace(/\d+/g, '#')}`;
  if (!seen.has(key)) seen.set(key, { ...f, states: [] });
  seen.get(key).states.push(f.state);
}
const distinct = [...seen.values()];
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'ui.json'), JSON.stringify({ suite: 'ui', states: states.map(stateName), failures: distinct }, null, 1));
console.log(`\n[fuzz:ui] ${states.length} states in ${Math.round((Date.now() - t0) / 1000)} s; ${failures.length} problem(s), ${distinct.length} distinct`);
for (const f of distinct) console.log(`- [${f.subject}] ${f.check}: ${f.detail}\n  in ${f.states.length} state(s), e.g. ${f.states[0]}`);
process.exit(distinct.length ? 1 : 0);
