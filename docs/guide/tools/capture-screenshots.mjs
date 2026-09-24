// Captures the screenshots for the beginner's guide from a running Socius build.
//
//   npx vite build --outDir /tmp/guide-agent/dist --emptyOutDir
//   npx vite preview --outDir /tmp/guide-agent/dist --port 4251 --strictPort &
//   node docs/guide/tools/capture-screenshots.mjs [--base http://localhost:4251/] [--out /tmp/guide-agent/raw] [section ...]
//
// Writes full-resolution PNGs (1440x900 viewport, device scale factor 2, light theme) to --out.
// Then run docs/guide/tools/process-images.py to crop/compress them into public/guide/img/.
// Numbered callouts are drawn into the page before each screenshot, so they stay sharp.

import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  if (i < 0) return d;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const BASE = opt('--base', 'http://localhost:4251/');
const OUT = opt('--out', '/tmp/guide-agent/raw');
const EXE = opt('--chromium', process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined));
const only = new Set(args);
mkdirSync(OUT, { recursive: true });

const W = 1440;
const H = 900;
const ORANGE = '#d9480f';

// ---------------------------------------------------------------- helpers
let BROWSER = null;

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: 'light', acceptDownloads: true });
  // Web fonts come from locally installed copies (see README); do not wait for Google Fonts.
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await mockGemini(context);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  return { context, page };
}

async function launch() {
  const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
  BROWSER = browser;
  const { context, page } = await newPage(browser);
  return { browser, context, page };
}

// ---------------------------------------------------------------- mocked Gemini
// No request ever reaches Google: the Gemini API is answered here (see e2e/ai-features.spec.ts and
// e2e/assistant.spec.ts). The AI text is written by hand from the sample survey's real results, and
// the assistant's tool calls run on the live data in the page. The guide marks these answers as examples.
const GEMINI_MODEL = 'gemini-3.6-flash';

const EXPLAIN_TEXT = [
  '## What was tested\nWhether men, women and people of other genders differ in how safe they feel walking alone in their neighbourhood after dark. The chi-square test asks whether the answers could be independent of gender.\n\n',
  '## What the numbers mean\n- Men were more likely to feel safe: **44.8%** agreed or strongly agreed, against **29.3%** of women.\n- Women were more likely to strongly disagree (14.5% against 5.3% of men).\n',
  '- χ²(8, N = 630) = 35.02, p < .001: a difference this large is very unlikely if gender and feeling safe were unrelated.\n- Cramér\'s V = .17: the relationship is real but **weak**.\n\n',
  '## Assumptions and warnings\n3 cells (20.0%) have an expected count below 5. They are in the small "Other / prefer to self-describe" group (19 people). That is at the usual 20% limit, so the test is acceptable, but do not read much into the percentages for that group.\n\n',
  '## How to report it\nA chi-square test of independence showed a significant association between gender and feeling safe walking alone after dark, χ²(8, N = 630) = 35.02, p < .001, Cramér\'s V = .17. Men were more likely than women to agree that they felt safe (44.8% vs. 29.3%).\n\n',
  '## Cautions\n- This is an association, not a cause. Experiences of harassment, street lighting or daily routines may lie behind it.\n- The answers are self-reported, from one point in time.',
];

/** The Socius assistant: round 1 asks Socius to run tools, round 2 answers from their real output. */
function assistantParts(body) {
  const contents = body.contents ?? [];
  const last = contents[contents.length - 1]?.parts ?? [];
  const question = contents
    .filter((c) => c.role === 'user')
    .flatMap((c) => c.parts ?? [])
    .map((p) => p.text ?? '')
    .filter(Boolean)
    .pop() ?? '';
  const results = last.filter((p) => p.functionResponse).map((p) => p.functionResponse);
  const trust = /trust scale/i.test(question);
  if (!results.length) {
    return trust
      ? [
          { text: 'Let me look at the five trust items first.' },
          { functionCall: { name: 'describe_variables', args: { names: ['trust1', 'trust2', 'trust3', 'trust4', 'trust5'] } } },
          { functionCall: { name: 'propose_transform', args: { kind: 'reverse', items: ['trust3'] } } },
        ]
      : [
          { text: 'Let me check both variables and run the test.' },
          { functionCall: { name: 'describe_variables', args: { names: ['life_sat', 'migrant'] } } },
          { functionCall: { name: 'run_analysis', args: { procedure_id: 'ttest-independent', variables: { variables: ['life_sat'], group: ['migrant'] } } } },
        ];
  }
  if (trust)
    return [
      {
        text:
          '## First, reverse one item\n`trust3` ("You have to be very careful with people in this neighbourhood") is worded the other way round: agreeing means **less** trust. If you add it as it is, it pulls the scale apart and lowers Cronbach\'s alpha.\n\n' +
          'I prepared **trust3_r** below: 1 becomes 5, 2 becomes 4, and so on. The missing codes 8 and 9 stay missing.\n\n' +
          '## Next steps\n1. Check the preview and click **Apply**.\n2. Then ask me to build the scale from trust1, trust2, trust3_r, trust4 and trust5. I will check its alpha.',
      },
    ];
  const out = results.map((r) => String(r.response?.result ?? '')).join('\n');
  const apa = /APA sentence: (.*)/.exec(out)?.[1]?.trim();
  if (!apa || !apa.includes('t(628) = 4.51')) console.log('  [warn] unexpected t-test result:', (apa ?? out).slice(0, 300));
  return [
    {
      text:
        '## Short answer\nUse an **independent-samples t-test**. `life_sat` is a 0 to 10 score and `migrant` has two groups, so you are comparing two means.\n\n' +
        '## What your data show\n| Group | N | Mean | SD |\n|---|--:|--:|--:|\n| Born in this city | 366 | 6.37 | 1.80 |\n| Migrated | 264 | 5.70 | 1.85 |\n\n' +
        'People born in the city are somewhat more satisfied with life. The difference is statistically significant and small to medium: t(628) = 4.51, p < .001, d = 0.36. Levene\'s test (p = .595) is not significant, so read the row *Equal variances assumed*.\n\n' +
        '## Next steps\n1. Click **Add this analysis to Output** to keep the tables and the APA sentence.\n2. Check these numbers against the tables in Output.\n3. To take age or education into account as well, ask me about a linear regression.',
    },
  ];
}

async function mockGemini(context) {
  await context.route('https://generativelanguage.googleapis.com/**', async (route) => {
    const req = route.request();
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (req.method() === 'GET')
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ models: [{ name: `models/${GEMINI_MODEL}`, supportedGenerationMethods: ['generateContent'] }] }) });
    const reply = (parts) => ({ candidates: [{ content: { role: 'model', parts }, finishReason: 'STOP' }] });
    if (!req.url().includes('streamGenerateContent'))
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(reply([{ text: 'OK' }])) });
    const body = req.postDataJSON();
    await new Promise((r) => setTimeout(r, 300));
    const events = body.tools ? [assistantParts(body)] : EXPLAIN_TEXT.map((t) => [{ text: t }]);
    const sse = events.map((parts) => `data: ${JSON.stringify(reply(parts))}\r\n\r\n`).join('');
    return route.fulfill({ status: 200, headers: { ...cors, 'Content-Type': 'text/event-stream' }, body: sse }).catch(() => undefined);
  });
}

async function ready(page) {
  await page.goto(BASE);
  // A first visit shows the welcome screen; photograph it, then load the sample survey from it.
  await page.locator('.welcome, .grid-scroll').first().waitFor({ timeout: 30000 });
  if (await page.locator('.welcome').count()) {
    await page.waitForTimeout(400);
    await mark(page, [{ n: 1, loc: page.getByRole('button', { name: /Load sample survey/ }), at: 'l' }]);
    await shot(page, 'welcome', { x: 0, y: 0, width: W, height: 680 });
    await unmark(page);
    await page.getByRole('button', { name: /Load sample survey/ }).click();
  }
  await page.locator('.grid-scroll').waitFor({ timeout: 30000 });
  await page.locator('.dataset-size').waitFor();
  await page.waitForTimeout(600);
}

async function dismissBanner(page) {
  const b = page.locator('.sample-banner button').last();
  if (await b.count()) await b.click().catch(() => {});
  await page.waitForTimeout(150);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A menu item by its label; the accessible name may also carry a shortcut ("Open data file... Ctrl+O"). */
const item = (page, label) =>
  page.locator('[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio]').filter({ hasText: new RegExp(`^\\s*${esc(label)}(?![a-z])`) }).first();

async function closeMenus(page) {
  for (let i = 0; i < 4 && (await page.locator('[role=menu]').count()); i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
}

async function menu(page, ...path) {
  await closeMenus(page);
  await page.getByRole('menuitem', { name: path[0], exact: true }).click();
  for (const p of path.slice(1)) await item(page, p).click();
  await page.waitForTimeout(350);
}

/** Open a menu path without clicking the last item (to photograph an open menu). */
async function hoverMenu(page, ...path) {
  await closeMenus(page);
  await page.getByRole('menuitem', { name: path[0], exact: true }).click();
  for (const p of path.slice(1)) await item(page, p).hover();
  await page.waitForTimeout(350);
}

async function addVar(page, slot, name) {
  const search = page.locator('.modal input[aria-label="Search variables"]');
  await search.fill(name);
  await page.locator('.pd-list .pd-var').filter({ has: page.locator('.vl-name', { hasText: `[${name}]` }) }).first().click();
  await page.locator('.modal .pd-slot-row').nth(slot).locator('button.pd-arrow').click();
  await search.fill('');
}

async function run(page) {
  await page.locator('.modal .pd-run').click();
  await page.locator('.modal').waitFor({ state: 'detached', timeout: 30000 });
  await page.waitForTimeout(700);
}

async function ok(page) {
  await page.locator('.modal').getByRole('button', { name: 'OK', exact: true }).click();
  await page.locator('.modal').waitFor({ state: 'detached', timeout: 15000 });
  await page.waitForTimeout(400);
}

const lastItem = (page) => page.locator('.ov-doc article').last();

async function box(loc) {
  await loc.first().waitFor({ state: 'visible', timeout: 10000 });
  const b = await loc.first().boundingBox();
  if (!b) throw new Error('no bounding box');
  return b;
}

function union(...bs) {
  const x = Math.min(...bs.map((b) => b.x));
  const y = Math.min(...bs.map((b) => b.y));
  const r = Math.max(...bs.map((b) => b.x + b.width));
  const btm = Math.max(...bs.map((b) => b.y + b.height));
  return { x, y, width: r - x, height: btm - y };
}

function pad(b, p = 12, vw = W, vh = H) {
  const x = Math.max(0, b.x - p);
  const y = Math.max(0, b.y - p);
  return { x, y, width: Math.min(vw - x, b.width + 2 * p), height: Math.min(vh - y, b.height + 2 * p) };
}

/**
 * Draw numbered callouts. items: { n, box | loc, at: 'l'|'r'|'t'|'b'|'tl'|'tr'|'bl'|'br'|'c', ring, dx, dy }.
 */
async function mark(page, items) {
  const specs = [];
  for (const it of items) specs.push({ n: String(it.n), b: it.box ?? (await box(it.loc)), at: it.at ?? 'l', ring: it.ring ?? true, dx: it.dx ?? 0, dy: it.dy ?? 0 });
  await page.evaluate(
    ({ specs, color }) => {
      document.getElementById('guide-marks')?.remove();
      const layer = document.createElement('div');
      layer.id = 'guide-marks';
      layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
      const D = 26;
      for (const s of specs) {
        const { x: bx, y: by, width: w, height: h } = s.b;
        if (s.ring) {
          const r = document.createElement('div');
          r.style.cssText = `position:absolute;left:${bx - 3}px;top:${by - 3}px;width:${w + 6}px;height:${h + 6}px;border:2.5px solid ${color};border-radius:7px;box-shadow:0 0 0 1.5px rgba(255,255,255,.9)`;
          layer.append(r);
        }
        let x = 0;
        let y = 0;
        const g = 7;
        switch (s.at) {
          case 'l': x = bx - D - g; y = by + h / 2 - D / 2; break;
          case 'r': x = bx + w + g; y = by + h / 2 - D / 2; break;
          case 't': x = bx + w / 2 - D / 2; y = by - D - g; break;
          case 'b': x = bx + w / 2 - D / 2; y = by + h + g; break;
          case 'tl': x = bx - D / 2 - 2; y = by - D / 2 - 2; break;
          case 'tr': x = bx + w - D / 2 + 2; y = by - D / 2 - 2; break;
          case 'ri': x = bx + w - D - 5; y = by + h / 2 - D / 2; break;
          case 'li': x = bx + 5; y = by + h / 2 - D / 2; break;
          case 'bl': x = bx - D / 2 - 2; y = by + h - D / 2 + 2; break;
          case 'br': x = bx + w - D / 2 + 2; y = by + h - D / 2 + 2; break;
          default: x = bx + w / 2 - D / 2; y = by + h / 2 - D / 2;
        }
        const c = document.createElement('div');
        c.textContent = s.n;
        c.style.cssText = `position:absolute;left:${x + s.dx}px;top:${y + s.dy}px;width:${D}px;height:${D}px;border-radius:50%;background:${color};color:#fff;font:700 14px/${D}px 'IBM Plex Sans',Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(0,0,0,.35)`;
        layer.append(c);
      }
      document.body.append(layer);
    },
    { specs, color: ORANGE },
  );
}

async function unmark(page) {
  await page.evaluate(() => document.getElementById('guide-marks')?.remove());
}

const manifest = {};
async function shot(page, name, clip, note = '', { fab = !clip } = {}) {
  const path = `${OUT}/${name}.png`;
  // Toasts are transient; keep them out of the pictures. The floating Assistant button shows only in
  // full-screen pictures (it would cover the corner of a cropped dialog or result).
  await page.evaluate((fab) => {
    document.querySelectorAll('.toast').forEach((t) => (t.style.visibility = 'hidden'));
    document.querySelectorAll('.as-fab').forEach((b) => (b.style.visibility = fab ? '' : 'hidden'));
  }, fab);
  await page.screenshot({ path, clip: clip ?? undefined });
  await page.evaluate(() => document.querySelectorAll('.as-fab').forEach((b) => (b.style.visibility = '')));
  manifest[name] = { note, clip: clip ?? null };
  console.log('  saved', name);
}

/** Photograph the open dialog (the .modal element), optionally with callouts already drawn. */
async function shotModal(page, name, p = 0) {
  const b = await box(page.locator('.modal'));
  await shot(page, name, pad(b, p));
}

/** Make the window tall so a long output item is fully rendered, run fn, then restore. */
async function tall(page, height, fn) {
  await page.setViewportSize({ width: W, height });
  await page.waitForTimeout(400);
  try {
    await fn(height);
  } finally {
    await page.setViewportSize({ width: W, height: H });
    await page.waitForTimeout(200);
  }
}

/** Screenshot part of the latest output item: from its top (or `from`) to the bottom of `to`. */
async function shotOutput(page, name, { from, to, height = 2400, p = 14 } = {}) {
  await tall(page, height, async (vh) => {
    const item = lastItem(page);
    await item.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const a = [...document.querySelectorAll('.ov-doc article')].pop();
      a?.scrollIntoView({ block: 'start' });
    });
    await page.waitForTimeout(300);
    const top = from ? await box(from(item)) : await box(item.locator('.oi-head'));
    const bottom = to ? await box(to(item)) : await box(item);
    const art = await box(item);
    const right = from ? Math.max(top.x + top.width, bottom.x + bottom.width) + 8 : art.x + art.width;
    const b = { x: art.x, y: top.y, width: Math.min(art.width, right - art.x), height: bottom.y + bottom.height - top.y };
    await shot(page, name, pad(b, p, W, vh));
    manifest[name].text = await item.innerText();
  });
}

// ---------------------------------------------------------------- sections
const sections = {};

sections.tour = async (page) => {
  await dismissBanner(page);
  await page.getByRole('tab', { name: 'Data View' }).click();
  await page.waitForTimeout(300);
  const menubar = union(await box(page.getByRole('menuitem', { name: 'File', exact: true })), await box(page.getByRole('menuitem', { name: 'Help', exact: true })));
  const search = await box(page.locator('.topbar-search'));
  const dsbar = await box(page.locator('.datasetbar'));
  const tabs = union(await box(page.getByRole('tab', { name: 'Data View' })), await box(page.getByRole('tab', { name: /Text coding/ })));
  const side = await box(page.locator('.sidebar, aside').first());
  const toolbar = await box(page.locator('.view-toolbar').first());
  const grid = await box(page.locator('.grid-scroll'));
  const right = union(await box(page.locator('.ai-chip')), await box(page.getByRole('button', { name: /^Theme/ })));
  const fab = await box(page.locator('.as-fab'));
  await mark(page, [
    { n: 1, box: menubar, at: 'b', dx: 260 },
    { n: 2, box: search, at: 'b' },
    { n: 3, box: right, at: 'l' },
    { n: 4, box: { ...dsbar, width: 470 }, at: 'r' },
    { n: 5, box: tabs, at: 'r' },
    { n: 6, box: side, at: 'c', ring: true, dy: 120 },
    { n: 7, box: toolbar, at: 'c', ring: true, dx: 80 },
    { n: 8, box: { ...grid, y: grid.y + 4, height: grid.height - 90 }, at: 'ri', ring: true },
    { n: 9, box: fab, at: 'l' },
  ]);
  await shot(page, 'tour', null);
  await unmark(page);
};

sections.open = async (page) => {
  await dismissBanner(page);
  await hoverMenu(page, 'File');
  const m = await box(page.locator('[role=menu]').last());
  await mark(page, [
    { n: 1, loc: page.getByRole('menuitem', { name: 'Open data file...' }), at: 'r', ring: true },
    { n: 2, loc: page.getByRole('menuitem', { name: 'Load sample survey' }), at: 'r', ring: true },
  ]);
  await shot(page, 'file-menu', pad(union({ x: 0, y: 0, width: 10, height: 10 }, m, { x: m.x, y: m.y, width: m.width + 60, height: m.height }), 12));
  await unmark(page);
  await page.keyboard.press('Escape');

  // CSV import preview
  const csv = 'id,gender,age,city,satisfaction\n1,Woman,34,Kolkata,7\n2,Man,51,Delhi,6\n3,Woman,27,Mumbai,8\n4,Man,45,Chennai,5\n5,Woman,62,Kolkata,9\n';
  const file = `${OUT}/my-survey.csv`;
  writeFileSync(file, csv);
  // The app opens a hidden <input type=file>; fill it directly (works whether or not a chooser event fires).
  page.once('filechooser', (fc) => fc.setFiles(file).catch(() => {}));
  await menu(page, 'File', 'Open data file...');
  await page.waitForTimeout(500);
  const input = page.locator('input[type=file]');
  if (await input.count()) await input.last().setInputFiles(file).catch(() => {});
  await page.waitForTimeout(800);
  // Opening another file may first ask to replace the open data.
  const replace = page.locator('.modal button', { hasText: /Open|Replace|Continue|Discard/ });
  if ((await page.locator('.modal').count()) && !(await page.locator('.modal').innerText()).includes('Separator') && (await replace.count())) {
    console.log('  confirm dialog:', (await page.locator('.modal').innerText()).slice(0, 200).replace(/\n/g, ' | '));
  }
  if (await page.locator('.modal').count()) {
    console.log('  csv dialog text:', (await page.locator('.modal').innerText()).slice(0, 600).replace(/\n+/g, ' | '));
    await shotModal(page, 'csv-preview');
    await page.keyboard.press('Escape');
  }
};

sections.variables = async (page) => {
  await dismissBanner(page);
  await page.getByRole('tab', { name: 'Variable View' }).click();
  await page.waitForTimeout(300);
  // Hide the variable list so Measure fits on screen.
  await menu(page, 'View', 'Variable list');
  await page.waitForTimeout(300);
  const head = (t) => page.locator('.vv-hcell', { hasText: new RegExp(`^${t}$`) });
  await mark(page, [
    { n: 1, loc: head('Name'), at: 'ri', ring: true },
    { n: 2, loc: head('Label'), at: 'ri', ring: true },
    { n: 3, loc: head('Values'), at: 'ri', ring: true },
    { n: 4, loc: head('Missing'), at: 'ri', ring: true },
    { n: 5, loc: head('Measure'), at: 'ri', ring: true },
  ]);
  const grid = await box(page.locator('.vv, .vv-scroll, [role=grid]').first());
  const hb = await box(head('Name'));
  await shot(page, 'variable-view', { x: 0, y: hb.y - 8, width: W, height: 470 });
  await unmark(page);

  // Value labels dialog for trust1: open the "..." button in the Values cell of row trust1.
  const openCell = async (label) => {
    await page.getByRole('button', { name: label }).first().click();
    await page.waitForTimeout(400);
  };
  await openCell('Edit value labels of trust1').catch(async () => {
    console.log('  value-label button not found by that name');
  });
  if (await page.locator('.modal').count()) {
    console.log('  value labels:', (await page.locator('.modal').innerText()).slice(0, 400).replace(/\n+/g, ' | '));
    await shotModal(page, 'value-labels');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await openCell('Edit missing values of trust1');
  if (await page.locator('.modal').count()) {
    console.log('  missing:', (await page.locator('.modal').innerText()).slice(0, 400).replace(/\n+/g, ' | '));
    await shotModal(page, 'missing-values');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await menu(page, 'View', 'Variable list');
  await page.getByRole('tab', { name: 'Data View' }).click();
};


const opt_ = (page, listbox, n) => page.locator('.modal').getByRole('listbox', { name: listbox, exact: true }).getByRole('option', { name: new RegExp(`^${n}\\b`) }).first();
const check = (page, label) => page.locator('.modal label.check', { hasText: label }).first().locator('input');

sections.prepare = async (page) => {
  await dismissBanner(page);
  // Recode age into groups
  await menu(page, 'Transform', 'Recode into different variables...');
  await opt_(page, 'Variables', 'age').click();
  await page.getByLabel('New name for age').fill('agegrp');
  await page.getByLabel('Label for new age').fill('Age group');
  const rule = async (kind, a, b, toKind, to) => {
    await page.getByLabel('Old value type').selectOption({ label: kind });
    await page.waitForTimeout(150);
    if (a !== undefined) await page.locator('.modal').getByLabel(kind === 'Range' ? 'From' : 'Value', { exact: true }).fill(String(a));
    if (b !== undefined) await page.locator('.modal').getByLabel('To', { exact: true }).fill(String(b));
    await page.getByLabel('New value type').selectOption({ label: toKind });
    if (to !== undefined) await page.getByLabel('New value', { exact: true }).fill(String(to));
    await page.locator('.modal button', { hasText: /^\s*Add\s*$/ }).click();
    await page.waitForTimeout(150);
  };
  await rule('System- or user-missing', undefined, undefined, 'System-missing');
  await rule('Lowest through', 29, undefined, 'Value', 1);
  await rule('Range', 30, 44, 'Value', 2);
  await rule('Range', 45, 64, 'Value', 3);
  await rule('through Highest', 65, undefined, 'Value', 4);
  await page.waitForTimeout(500);
  const labels = { 1: '18-29', 2: '30-44', 3: '45-64', 4: '65 and over' };
  for (const [v, l] of Object.entries(labels)) await page.getByLabel(`Label for ${v}`, { exact: true }).fill(l);
  await shotModal(page, 'recode');
  await ok(page);

  // Reverse-code trust3
  await menu(page, 'Transform', 'Reverse-code items...');
  await opt_(page, 'Items', 'trust3').click();
  await page.waitForTimeout(300);
  await shotModal(page, 'reverse');
  await ok(page);

  // Build the trust scale
  await menu(page, 'Transform', 'Create scale / index...');
  for (const n of ['trust1', 'trust2', 'trust3_r', 'trust4', 'trust5']) await opt_(page, 'Items', n).click();
  await page.locator('#sc-name').fill('trust');
  await page.locator('#sc-label').fill('Neighbourhood trust (mean of 5 items)');
  await page.waitForTimeout(300);
  console.log('  scale callout:', (await page.locator('.modal .callout').first().innerText()).replace(/\n+/g, ' | '));
  await mark(page, [{ n: 1, loc: page.locator('.modal .callout').first(), at: 'tl' }]);
  await shotModal(page, 'scale');
  await unmark(page);
  await ok(page);

  // Select cases (photographed, then cancelled)
  await menu(page, 'Data', 'Select cases...');
  await page.locator('.modal label.check', { hasText: 'Cases that meet a condition' }).click();
  await page.locator('#sc-cond').fill('gender = 2 AND age >= 30');
  await page.waitForTimeout(400);
  await shotModal(page, 'select-cases');
  await page.locator('.modal button', { hasText: 'Cancel' }).click();
  await page.waitForTimeout(300);

  // Weight cases
  await menu(page, 'Data', 'Weight cases...');
  await page.locator('.modal').getByLabel(/Weight cases by/).check();
  await page.locator('.modal').getByRole('listbox', { name: 'Weight variable', exact: true }).getByRole('option', { name: /^wt\b/ }).click();
  await page.waitForTimeout(300);
  await shotModal(page, 'weight');
  await ok(page);
  const chip = await box(page.locator('.chip-weight'));
  const ds = await box(page.locator('.datasetbar'));
  await mark(page, [{ n: 1, box: chip, at: 'r' }]);
  await shot(page, 'weight-chip', { x: 0, y: ds.y - 6, width: 760, height: ds.height + 12 });
  await unmark(page);
  await page.getByRole('button', { name: 'Turn weighting off' }).click();
  await page.waitForTimeout(300);
};

sections.analyses = async (page) => {
  await dismissBanner(page);
  await page.getByRole('tab', { name: /^Output/ }).click();
  const clear = page.locator('.ov-toolbar button', { hasText: 'Clear output' });
  if (await clear.count() && await clear.isEnabled()) {
    await clear.click();
    const c = page.locator('.modal button', { hasText: 'Clear output' });
    if (await c.count()) await c.click();
  }
  // Frequencies
  await menu(page, 'Analyze', 'Descriptive Statistics', 'Frequencies...');
  await addVar(page, 0, 'educ');
  await mark(page, [
    { n: 1, loc: page.locator('.modal .pd-list'), at: 'tl', ring: false },
    { n: 2, loc: page.locator('.modal button.pd-arrow').first(), at: 'b' },
    { n: 3, loc: page.locator('.modal .pd-slot-row').first(), at: 'tr', ring: false },
    { n: 4, loc: page.locator('.modal .pd-run'), at: 't' },
  ]);
  await shotModal(page, 'freq-dialog');
  await unmark(page);
  await run(page);
  await shotOutput(page, 'freq-result', { to: (it) => it.locator('.ob-apa') });

  // Crosstabs gender x trust5
  await menu(page, 'Analyze', 'Descriptive Statistics', 'Crosstabs...');
  await addVar(page, 0, 'gender');
  await addVar(page, 1, 'trust5');
  await shotModal(page, 'crosstab-dialog');
  await page.locator('.modal [role=tab]', { hasText: 'Statistics' }).click();
  await page.waitForTimeout(200);
  await shotModal(page, 'crosstab-stats');
  await run(page);
  await shotOutput(page, 'crosstab-table', { from: (it) => it.locator('figure.ot').nth(1), to: (it) => it.locator('figure.ot').nth(1) });
  await shotOutput(page, 'crosstab-tests', { from: (it) => it.locator('figure.ot').nth(2), to: (it) => it.locator('figure.ot').nth(3) });
  await shotOutput(page, 'crosstab-reading', { from: (it) => it.locator('.ob-interp'), to: (it) => it.locator('.ob-apa') });

  // Independent t test
  await menu(page, 'Analyze', 'Compare Means', 'Independent-Samples T Test...');
  await addVar(page, 0, 'life_sat');
  await addVar(page, 1, 'migrant');
  await page.waitForTimeout(300);
  await shotModal(page, 'ttest-dialog');
  await run(page);
  await shotOutput(page, 'ttest-tables', { from: (it) => it.locator('figure.ot').nth(0), to: (it) => it.locator('figure.ot').nth(1) });
  await shotOutput(page, 'ttest-reading', { from: (it) => it.locator('.ob-interp'), to: (it) => it.locator('.ob-apa') });

  // One-way ANOVA
  await menu(page, 'Analyze', 'Compare Means', 'One-Way ANOVA...');
  await addVar(page, 0, 'life_sat');
  await addVar(page, 1, 'educ');
  await page.locator('.modal [role=tab]', { hasText: 'Post hoc' }).click();
  await check(page, /^\s*Tukey/).check();
  await shotModal(page, 'anova-dialog');
  await run(page);
  await shotOutput(page, 'anova-tables', { from: (it) => it.locator('figure.ot').nth(0), to: (it) => it.locator('figure.ot').nth(2), height: 4200 });
  await shotOutput(page, 'anova-posthoc', { from: (it) => it.locator('figure.ot').nth(5), to: (it) => it.locator('figure.ot').nth(5), height: 4200 });
  await shotOutput(page, 'anova-reading', { from: (it) => it.locator('.ob-interp'), to: (it) => it.locator('.ob-apa'), height: 4200 });

  // Correlations
  await menu(page, 'Analyze', 'Correlate', 'Bivariate Correlations...');
  for (const v of ['age', 'yrs_nbhd', 'life_sat', 'trust']) await addVar(page, 0, v);
  await run(page);
  await shotOutput(page, 'corr-table', { from: (it) => it.locator('figure.ot').nth(0), to: (it) => it.locator('figure.ot').nth(0) });
  await shotOutput(page, 'corr-reading', { from: (it) => it.locator('.ob-interp'), to: (it) => it.locator('.ob-apa') });

  // Simple linear regression
  await menu(page, 'Analyze', 'Regression', 'Linear Regression...');
  await addVar(page, 0, 'life_sat');
  await addVar(page, 1, 'trust');
  await shotModal(page, 'regression-dialog');
  await run(page);
  await shotOutput(page, 'regression-tables', { from: (it) => it.locator('figure.ot').nth(1), to: (it) => it.locator('figure.ot').nth(3), height: 4200 });
  await shotOutput(page, 'regression-reading', { from: (it) => it.locator('.ob-interp'), to: (it) => it.locator('.ob-apa'), height: 4200 });
};

sections.charts = async (page) => {
  await dismissBanner(page);
  await menu(page, 'Graphs', 'Bar Chart...');
  await addVar(page, 0, 'city');
  await addVar(page, 1, 'vote');
  await page.locator('.modal').getByLabel('Bars show').selectOption('percent');
  await page.locator('.modal').getByLabel('Percentages within').selectOption('category');
  await page.waitForTimeout(200);
  await shotModal(page, 'bar-dialog');
  await run(page);
  await shotOutput(page, 'bar-result', { to: (it) => it.locator('.ob-actions').first() });
  await menu(page, 'Graphs', 'Histogram...');
  await addVar(page, 0, 'age');
  await run(page);
  const item = lastItem(page);
  await mark(page, [{ n: 1, loc: item.locator('.ob-actions').first(), at: 'r' }]);
  await shotOutput(page, 'histogram-result', { to: (it) => it.locator('.ob-actions').first() });
  await unmark(page);
};

sections.report = async (page) => {
  await dismissBanner(page);
  await page.getByRole('tab', { name: /^Output/ }).click();
  await page.waitForTimeout(300);
  // scroll to the crosstab item
  const art = page.locator('.ov-doc article', { hasText: 'Crosstabs' }).first();
  await art.scrollIntoViewIfNeeded();
  await page.evaluate(() => [...document.querySelectorAll('.ov-doc article')].find((a) => a.textContent.includes('Crosstabs'))?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await mark(page, [
    { n: 1, loc: page.locator('.ov-seg'), at: 'b' },
    { n: 2, loc: page.locator('.ov-toolbar label.check', { hasText: 'Interpretations' }), at: 'b' },
    { n: 3, loc: page.locator('.ov-menu button', { hasText: 'Export report' }), at: 'l' },
    { n: 4, loc: art.locator('.oi-actions button', { hasText: 'Copy' }).first(), at: 'l' },
    { n: 5, loc: page.locator('.ov-outline-list'), at: 'tr', ring: false, dx: -24, dy: 30 },
  ]);
  await shot(page, 'output-toolbar', { x: 0, y: 0, width: W, height: 560 });
  await unmark(page);
  await page.locator('.ov-menu button', { hasText: 'Export report' }).click();
  await page.waitForTimeout(300);
  const em = union(await box(page.locator('.ov-menu button', { hasText: 'Export report' })), await box(page.locator('.ov-menu-list')));
  await shot(page, 'export-menu', pad(em, 12));
  await page.keyboard.press('Escape');
  // APA vs SPSS: photograph the Frequencies table in SPSS style.
  await page.locator('.ov-seg button', { hasText: 'SPSS tables' }).click();
  await page.waitForTimeout(300);
  const f = page.locator('.ov-doc article', { hasText: 'Frequencies' }).first();
  await page.evaluate(() => [...document.querySelectorAll('.ov-doc article')].find((a) => a.textContent.includes('Frequencies'))?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  const t = f.locator('figure.ot').nth(1);
  await shot(page, 'spss-style', pad(await box(t), 14));
  await page.locator('.ov-seg button', { hasText: 'APA tables' }).click();
  await page.waitForTimeout(200);
  const ta = f.locator('figure.ot').nth(1);
  await shot(page, 'apa-style', pad(await box(ta), 14));
};

sections.saving = async (page) => {
  await dismissBanner(page);
  await hoverMenu(page, 'File', 'Save data as');
  await page.waitForTimeout(300);
  const menus = page.locator('[role=menu]');
  const b = union(await box(menus.first()), await box(menus.last()));
  await mark(page, [{ n: 1, loc: item(page, 'Save project'), at: 'l', dx: 30, ring: true }]);
  await shot(page, 'save-menu', pad(union({ x: 0, y: 0, width: 10, height: 10 }, b), 12));
  await unmark(page);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
};

sections.search = async (page) => {
  await dismissBanner(page);
  await closeMenus(page);
  await page.getByRole('tab', { name: 'Data View' }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+k');
  const pal = page.getByRole('dialog', { name: 'Search Socius' });
  await pal.waitFor();
  await page.keyboard.type('chi square');
  await page.waitForTimeout(400);
  console.log('  palette:', (await pal.innerText()).replace(/\n+/g, ' | ').slice(0, 600));
  const opt = (t) => pal.getByRole('option').filter({ hasText: t }).first();
  const pb = await box(pal);
  await mark(page, [
    { n: 1, loc: pal.getByRole('combobox', { name: 'Search Socius' }), at: 'l', ring: false, dx: -6 },
    { n: 2, loc: opt('Crosstabs'), at: 'r', ring: false, dx: -60 },
    { n: 3, loc: opt('Crosstabs with chi-square'), at: 'r', ring: false, dx: -60 },
    { n: 4, loc: opt('Ask the assistant'), at: 'r', ring: false, dx: -60 },
  ]);
  await shot(page, 'search-palette', pad({ x: pb.x - 30, y: 0, width: pb.width + 60, height: pb.y + pb.height }, 10));
  await unmark(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
};

sections.help = async (page) => {
  await dismissBanner(page);
  await hoverMenu(page, 'Help');
  const m = await box(page.locator('[role=menu]').last());
  const help = await box(page.getByRole('menuitem', { name: 'Help', exact: true }));
  console.log('  help menu:', (await page.locator('[role=menu]').last().innerText()).replace(/\n+/g, ' | '));
  await shot(page, 'help-menu', pad(union(help, m, { x: m.x, y: m.y, width: m.width + 20, height: m.height }), 14));
  await page.keyboard.press('Escape');
};


// ---------- text coding helpers (from e2e/qual.spec.ts)
async function phraseRect(page, phrase) {
  await page.evaluate((p) => [...document.querySelectorAll('.cw-para')].find((el) => el.textContent.includes(p))?.scrollIntoView({ block: 'center' }), phrase);
  await page.waitForTimeout(200);
  return page.evaluate((phrase) => {
    const spans = Array.from(document.querySelectorAll('.cw-reader-body [data-s]'));
    let text = '';
    const map = [];
    for (const sp of spans) {
      const s = Number(sp.dataset.s);
      text = text.padEnd(s, '\n').slice(0, s) + (sp.textContent ?? '');
      if (sp.firstChild) map.push({ s, node: sp.firstChild, len: (sp.textContent ?? '').length });
    }
    const i = text.indexOf(phrase);
    if (i < 0) return null;
    const at = (off) => map.find((m) => off >= m.s && off < m.s + m.len);
    const rect = (off) => {
      const m = at(off);
      const rg = document.createRange();
      rg.setStart(m.node, off - m.s);
      rg.setEnd(m.node, off - m.s + 1);
      return rg.getBoundingClientRect();
    };
    const ra = rect(i);
    const rb = rect(i + phrase.length - 1);
    return { x0: ra.left + 1, y0: ra.top + ra.height / 2, x1: rb.right - 1, y1: rb.top + rb.height / 2 };
  }, phrase);
}

async function dragSelect(page, phrase) {
  const r = await phraseRect(page, phrase);
  if (!r) throw new Error(`phrase not found: ${phrase}`);
  await page.mouse.move(r.x0, r.y0);
  await page.mouse.down();
  await page.mouse.move(r.x1, r.y1, { steps: 6 });
  await page.mouse.up();
  await page.locator('.cw-qc').waitFor();
}

async function codeTab(page, label) {
  await page.locator('.cw-viewtabs [role=tab]', { hasText: label }).click();
  await page.waitForTimeout(400);
}

// The Text coding menu (non-AI coding commands only; the AI helpers live in the AI menu).
sections.codingmenu = async (page) => {
  await dismissBanner(page);
  await hoverMenu(page, 'Text coding');
  const m = await box(page.locator('[role=menu]').last());
  const top = await box(page.getByRole('menuitem', { name: 'Text coding', exact: true }));
  console.log('  text coding menu:', (await page.locator('[role=menu]').last().innerText()).replace(/\n+/g, ' | '));
  await shot(page, 'coding-menu', pad(union(top, m, { x: m.x, y: m.y, width: m.width + 20, height: m.height }), 14));
  await page.keyboard.press('Escape');
};

sections.coding = async (page) => {
  await dismissBanner(page);
  await page.getByRole('tab', { name: /^Text coding/ }).click();
  await page.waitForTimeout(500);
  const center = await box(page.locator('.cw-center'));
  await mark(page, [{ n: 1, loc: page.locator('.cw-welcome-card', { hasText: 'Explore a worked example' }), at: 'tl' }]);
  void center;
  await shot(page, 'coding-welcome', pad(await box(page.locator('.cw-welcome')), 24));
  await unmark(page);

  // Import answers dialog (photographed, then cancelled: the worked example imports the same answers)
  await page.locator('.cw-welcome-card', { hasText: 'Open-ended answers' }).click();
  await page.waitForTimeout(400);
  const sel = page.locator('#cw-svar');
  const opts = await sel.locator('option').allInnerTexts();
  await sel.selectOption({ index: opts.findIndex((o) => o.includes('q_challenge')) });
  const idSel = page.locator('.modal select').nth(1);
  const idOpts = await idSel.locator('option').allInnerTexts().catch(() => []);
  if (idOpts.some((o) => o.includes('resp_id'))) await idSel.selectOption({ index: idOpts.findIndex((o) => o.includes('resp_id')) });
  const boxes = page.locator('.modal .cw-checkgrid label.check');
  for (let i = 0; i < (await boxes.count()); i++) {
    const name = (await boxes.nth(i).innerText()).split(/\s/)[0];
    const cb = boxes.nth(i).locator('input');
    if ((await cb.isChecked()) !== ['gender', 'city', 'area', 'migrant'].includes(name)) await cb.click();
  }
  console.log('  import dialog:', (await page.locator('.modal').innerText()).slice(0, 700).replace(/\n+/g, ' | '));
  await shotModal(page, 'import-answers');
  console.log('  import buttons:', await page.locator('.modal button').allInnerTexts());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Worked example
  await page.locator('.cw-welcome-card', { hasText: 'Explore a worked example' }).click();
  await page.waitForTimeout(1500);
  await page.locator('.toast button[aria-label]').first().click().catch(() => {});
  await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => (t.style.display = 'none')));
  console.log('  example note:', (await page.locator('.cw-example-note').innerText()).replace(/\n+/g, ' | '));
  console.log('  keys:', (await page.locator('.cw-resp-keys').innerText()).replace(/\n+/g, ' | '));
  console.log('  codebook:', (await page.locator('.cw-codebook').innerText()).replace(/\n+/g, ' | ').slice(0, 800));
  await page.locator('.cw-resp-scroll').focus();
  await page.keyboard.press('Home');
  await page.waitForTimeout(300);
  await mark(page, [
    { n: 1, box: union(await box(page.locator('.cw-viewtabs [role=tab]').first()), await box(page.locator('.cw-viewtabs [role=tab]').last())), at: 'r' },
    { n: 2, loc: page.locator('.cw-resp-search'), at: 'tr', ring: true },
    { n: 3, loc: page.locator('.cw-resp-keys'), at: 'tr', ring: true },
    { n: 4, loc: page.locator('.cw-resp-row').first(), at: 'tr', ring: true },
    { n: 5, loc: page.locator('.cw-codebook'), at: 'tl', ring: false },
  ]);
  await shot(page, 'responses', null);
  await unmark(page);

  // Code definition dialog
  const row = page.locator('.cw-code', { hasText: 'Water supply' }).first();
  await row.hover();
  await row.locator('.cw-rowmenu').click();
  await page.locator('.cw-menu-list [role=menuitem]', { hasText: 'Edit definition and rules' }).click();
  await page.waitForTimeout(400);
  console.log('  code edit:', (await page.locator('.modal').innerText()).slice(0, 600).replace(/\n+/g, ' | '));
  await shotModal(page, 'code-definition');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Auto-code dialog
  await page.locator('.cw-toolbar button', { hasText: 'Auto-code' }).click();
  await page.waitForTimeout(400);
  await page.locator('.cw-autocode-code', { hasText: /^Safety at night/ }).first().click().catch(() => console.log('  no Safety code row'));
  await page.waitForTimeout(200);
  console.log('  rules:', await page.locator('#cw-rules').inputValue().catch(() => '?'));
  console.log('  autocode:', (await page.locator('.modal').innerText()).slice(0, 900).replace(/\n+/g, ' | '));
  await shotModal(page, 'autocode');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if (await page.locator('.modal').count()) await page.locator('.modal button', { hasText: /Cancel|Close/ }).first().click();

  // Export codes to the dataset
  await menu(page, 'Text coding', 'Export codes to dataset...');
  await page.waitForTimeout(400);
  const exText = await page.locator('.modal').innerText();
  console.log('  export:', exText.slice(0, 900).replace(/\n+/g, ' | '));
  await shotModal(page, 'export-codes');
  await page.locator('.modal .btn-primary').click();
  await page.waitForTimeout(600);
  if (await page.locator('.modal').count()) await page.keyboard.press('Escape');

  // Crosstab gender x the safety code variable
  const safety = 'c_safety_at_night';
  console.log('  safety var:', safety);
  await menu(page, 'Analyze', 'Descriptive Statistics', 'Crosstabs...');
  await page.locator('.modal button', { hasText: /^Reset$/ }).click();
  await addVar(page, 0, 'gender');
  await addVar(page, 1, safety);
  await run(page);
  await page.getByRole('tab', { name: /^Output/ }).click();
  await page.waitForTimeout(400);
  await shotOutput(page, 'code-crosstab', { from: (it) => it.locator('figure.ot').nth(1), to: (it) => it.locator('figure.ot').nth(2) });
  await page.getByRole('tab', { name: /^Text coding/ }).click();
  await page.waitForTimeout(300);

  // Codes by attribute
  await codeTab(page, 'Analyse');
  await page.locator('.cw-analyse [role=tab]', { hasText: 'Codes by attribute' }).click();
  await page.waitForTimeout(300);
  await page.locator('#cw-attr').selectOption('gender').catch(() => {});
  await page.waitForTimeout(400);
  const cba = await box(page.locator('.cw-center'));
  await shot(page, 'codes-by-attribute', { ...cba, height: 640 });
};

sections.interviews = async (page) => {
  await dismissBanner(page);
  await page.getByRole('tab', { name: /^Text coding/ }).click();
  await menu(page, 'Text coding', 'Import documents...');
  await page.waitForTimeout(400);
  console.log('  import docs:', (await page.locator('.modal').innerText()).slice(0, 600).replace(/\n+/g, ' | '));
  await shotModal(page, 'import-documents');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if (await page.locator('.modal').count()) await page.locator('.modal button', { hasText: /Cancel|Close/ }).first().click();

  await menu(page, 'Text coding', 'Load sample interviews');
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => (t.style.display = 'none')));
  await codeTab(page, 'Documents');
  await page.locator('.cw-docitem', { hasText: 'Interview 01' }).first().locator('button').first().click();
  await page.waitForTimeout(500);
  await dragSelect(page, 'it is not a place I live, it is who I am');
  await page.locator('.cw-qc-input').fill('Belonging');
  await page.waitForTimeout(300);
  await shot(page, 'quick-code', null);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await dragSelect(page, 'So this para [neighbourhood] is... it is not a place I live');
  await page.locator('.cw-qc-input').fill('Place identity');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const p = await phraseRect(page, 'not a place I live');
  await page.mouse.click(p.x0 + 20, p.y0);
  await page.waitForTimeout(300);
  await page.locator('.cw-segpop-memo').first().fill('Identity fused with place: she speaks of the para as part of who she is.');
  await page.waitForTimeout(200);
  await shot(page, 'segment-memo', null);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.mouse.click(5, 850);
  await mark(page, [
    { n: 1, loc: page.locator('.cw-sources'), at: 'tr', ring: false },
    { n: 2, box: { ...(await phraseRect(page, 'not a place I live')), width: 10, height: 10 }, at: 'c', ring: false },
    { n: 3, loc: page.locator('.cw-codebook'), at: 'tl', ring: false },
  ]).catch((e) => console.log('  mark failed', e.message));
  await unmark(page);
  const pr = await phraseRect(page, 'not a place I live');
  await mark(page, [
    { n: 1, loc: page.locator('.cw-sources'), at: 'tr', ring: false },
    { n: 2, box: { x: (await box(page.locator('.cw-reader-body'))).x + 20, y: pr.y0 - 5, width: 10, height: 10 }, at: 'c', ring: false },
    { n: 3, loc: page.locator('.cw-codebook'), at: 'tl', ring: false },
  ]);
  await shot(page, 'documents', null);
  await unmark(page);

  // Retrieve
  await codeTab(page, 'Retrieve');
  await page.locator('.cw-retrieve select[aria-label="Code"]').selectOption({ label: 'Safety at night' }).catch(() => {});
  await page.waitForTimeout(400);
  const rb = await box(page.locator('.cw-center'));
  await shot(page, 'retrieve', { ...rb, height: 520 });

  // Memos
  await codeTab(page, 'Memos');
  const mb = await box(page.locator('.cw-center'));
  await shot(page, 'memos', { ...mb, height: 440 });

  // Intercoder reliability: a second coder (Priya) codes the first 20 answers by keyboard.
  // She agrees with Coder 1 on most codes and differs on a few, so the numbers look realistic.
  await codeTab(page, 'Responses');
  await page.locator('.cw-resp-scroll').focus();
  await page.keyboard.press('Home');
  const N = 20;
  const theirs = [];
  for (let i = 0; i < N; i++) {
    const row = page.locator('.cw-resp-row').nth(i);
    theirs.push(await row.locator('.cw-chip').evaluateAll((els) => els.map((e) => e.getAttribute('title') || e.textContent.trim())));
  }
  console.log('  coder 1 codes:', JSON.stringify(theirs));
  await page.locator('.cw-toolbar .cw-menu-trigger', { hasText: 'Coder:' }).click();
  await page.locator('.cw-menu-list [role=menuitem]', { hasText: 'Coders...' }).click();
  await page.locator('input[aria-label="New coder name"]').fill('Priya');
  await page.locator('.modal button', { hasText: 'Add coder' }).click();
  await page.waitForTimeout(200);
  await shotModal(page, 'coders');
  await page.locator('.modal button', { hasText: 'Code as Priya' }).click();
  await page.locator('.modal button', { hasText: 'Done' }).click();
  await codeTab(page, 'Responses');
  const keyNames = (await page.locator('.cw-resp-keys .cw-keychip').allInnerTexts()).map((t) => t.replace(/^\d+\s*/, '').trim());
  await page.locator('.cw-resp-scroll').focus();
  await page.keyboard.press('Home');
  for (let i = 0; i < N; i++) {
    let codes = theirs[i].filter((c) => keyNames.includes(c));
    if (i === 4 || i === 13) codes = codes.slice(1); // she leaves one code out
    if (i === 8) codes = [...codes, keyNames[5]]; // and adds one Coder 1 did not use
    for (const c of codes) await page.keyboard.press(String(keyNames.indexOf(c) + 1));
    await page.keyboard.press('j');
  }
  await codeTab(page, 'Reliability');
  await page.waitForTimeout(500);
  const warnBox = page.locator('.cw-reliability .callout-warn input[type=checkbox]');
  console.log('  reliability:', (await page.locator('.cw-center').innerText()).slice(0, 900).replace(/\n+/g, ' | '));
  await shot(page, 'reliability', pad(await box(page.locator('.cw-center')), 0));
  void warnBox;
};


// The AI chapter runs in a fresh browser context (a first visit, no AI set up yet) with Gemini mocked.
sections.ai = async () => {
  const { context, page } = await newPage(BROWSER);
  try {
    await page.goto(BASE);
    await page.getByRole('button', { name: /Load sample survey/ }).click();
    await page.locator('.grid-scroll').waitFor({ timeout: 30000 });
    await page.waitForTimeout(800);
    await dismissBanner(page);

    // The AI menu
    await hoverMenu(page, 'AI');
    const am = await box(page.locator('[role=menu]').last());
    const at = await box(page.getByRole('menuitem', { name: 'AI', exact: true }));
    console.log('  ai menu:', (await page.locator('[role=menu]').last().innerText()).replace(/\n+/g, ' | '));
    await shot(page, 'ai-menu', pad(union(at, am, { x: am.x, y: am.y, width: am.width + 20, height: am.height }), 14));

    // Settings: Google Gemini with a free key
    await item(page, 'AI assistant settings...').click();
    const dlg = page.getByRole('dialog', { name: 'AI assistant' });
    await dlg.waitFor();
    await dlg.getByRole('radio', { name: /Google Gemini/ }).check();
    await page.locator('#ai-gemini-key').fill('AIzaSyD-example-key-for-the-guide-0000');
    await page.waitForTimeout(400);
    await tall(page, 1500, async (vh) => {
      await mark(page, [
        { n: 1, loc: dlg.locator('label.ai-choice', { hasText: 'Google Gemini' }), at: 'li', ring: true, dx: -40 },
        { n: 2, loc: dlg.getByRole('link', { name: 'Google AI Studio' }), at: 'r', dx: 262 },
        { n: 3, loc: page.locator('#ai-gemini-key'), at: 'tr' },
        { n: 4, loc: page.locator('#ai-gemini-model'), at: 'tr' },
        { n: 5, loc: dlg.getByRole('button', { name: 'Test connection' }), at: 'r' },
      ]);
      await shot(page, 'ai-gemini', pad(await box(page.locator('.modal')), 0, W, vh));
      await unmark(page);
    });
    await dlg.getByRole('button', { name: 'Test connection' }).click();
    await page.locator('.ai-ready').waitFor({ timeout: 15000 });
    await page.waitForTimeout(300);
    console.log('  test:', (await page.locator('.ai-test').innerText()).replace(/\n+/g, ' | '));
    await tall(page, 1500, async (vh) => {
      await page.locator('.ai-ready').scrollIntoViewIfNeeded();
      const mb = await box(page.locator('.modal'));
      const rb = union(await box(page.locator('.ai-test')), await box(page.locator('.ai-ready')));
      await mark(page, [
        { n: 1, loc: page.locator('.ai-ok'), at: 'r' },
        { n: 2, loc: page.locator('.ai-ready'), at: 'tr', ring: false, dx: -30, dy: 12 },
      ]);
      await shot(page, 'ai-ready', { x: mb.x + 1, y: rb.y - 14, width: mb.width - 2, height: rb.height + 28 });
      await unmark(page);
    });
    await dlg.getByRole('button', { name: 'Done' }).click();
    await page.waitForTimeout(400);

    // The AI chip in the top bar
    await page.locator('.ai-chip').click();
    const pop = page.getByRole('dialog', { name: 'AI help' });
    await pop.waitFor();
    await page.waitForTimeout(300);
    const cb = union(await box(page.locator('.ai-chip')), await box(pop));
    await mark(page, [{ n: 1, loc: page.locator('.ai-chip'), at: 'l' }]);
    await shot(page, 'ai-chip', pad({ ...cb, x: cb.x - 40, width: cb.width + 40 }, 12));
    await unmark(page);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Explain a result: Crosstabs gender by trust5, then Explain with AI
    await page.getByRole('tab', { name: /^Output/ }).click();
    await menu(page, 'Analyze', 'Descriptive Statistics', 'Crosstabs...');
    await addVar(page, 0, 'gender');
    await addVar(page, 1, 'trust5');
    await run(page);
    const it = lastItem(page);
    await page.evaluate(() => [...document.querySelectorAll('.ov-doc article')].pop()?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(300);
    await page.locator('.ov-doc').evaluate((el) => (el.scrollTop -= 60));
    await page.waitForTimeout(200);
    await mark(page, [{ n: 1, loc: it.locator('.oi-explain'), at: 't' }]);
    const hb = await box(it.locator('.oi-head'));
    await shot(page, 'explain-button', pad({ ...hb, y: hb.y - 36, height: hb.height + 36 }, 10));
    await unmark(page);
    await it.locator('.oi-explain').click();
    const panel = it.locator('.ai-explain');
    await panel.waitFor();
    await panel.locator('.ai-preview summary').click();
    await page.waitForTimeout(300);
    await tall(page, 1800, async (vh) => {
      await panel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await mark(page, [
        { n: 1, loc: panel.locator('.ai-note'), at: 'l', ring: false },
        { n: 2, loc: panel.locator('.ai-preview summary'), at: 'l', ring: false },
        { n: 3, loc: panel.getByRole('button', { name: 'Explain', exact: true }), at: 'l' },
      ]);
      const b0 = await box(panel);
      const b = { ...b0, x: b0.x - 30, width: b0.width + 30 };
      const pre = await box(panel.locator('.ai-preview-text'));
      console.log('  preview height', Math.round(pre.height));
      await shot(page, 'explain-confirm', pad(b, 16, W, vh));
      await unmark(page);
    });
    await panel.getByRole('button', { name: 'Explain', exact: true }).click();
    await panel.getByRole('button', { name: 'Add to output' }).waitFor({ timeout: 20000 });
    await page.waitForTimeout(500);
    await tall(page, 1800, async (vh) => {
      await panel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await mark(page, [
        { n: 1, loc: panel.locator('.ai-explain-label'), at: 'r' },
        { n: 2, loc: panel.getByRole('button', { name: 'Add to output' }), at: 'b' },
        { n: 3, loc: panel.getByRole('button', { name: 'Discuss with the assistant' }), at: 't' },
      ]);
      const b = await box(panel);
      await shot(page, 'explain-done', pad({ ...b, height: b.height + 30 }, 16, W, vh));
      await unmark(page);
    });
    await panel.getByRole('button', { name: 'Add to output' }).click();
    await page.waitForTimeout(400);

    // The Socius assistant (Ctrl+J), on the Data View
    await page.getByRole('tab', { name: 'Data View' }).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+j');
    const ap = page.getByTestId('assistant-panel');
    await ap.waitFor();
    await page.waitForTimeout(500);
    console.log('  starters:', (await ap.locator('.as-starters').innerText()).replace(/\n+/g, ' | '));
    await mark(page, [
      { n: 1, loc: ap.locator('.as-provider'), at: 'b', dx: 60, dy: -4 },
      { n: 2, loc: ap.getByRole('button', { name: 'What the assistant can see' }), at: 'b' },
      { n: 3, loc: ap.locator('.as-starters'), at: 'l' },
      { n: 4, loc: ap.locator('.as-compose'), at: 'l' },
    ]);
    await shot(page, 'assistant-start', null, '', { fab: false });
    await unmark(page);

    await ap.getByRole('button', { name: 'What the assistant can see' }).click();
    const see = page.getByRole('dialog', { name: 'What the assistant can see' });
    await see.waitFor();
    await page.waitForTimeout(200);
    await shot(page, 'assistant-see', pad(await box(see), 12));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const ask = async (q) => {
      await ap.getByLabel('Message to the assistant').fill(q);
      await page.keyboard.press('Enter');
      await ap.locator('[data-testid=assistant-message][data-status=done]').last().waitFor({ timeout: 30000 });
      await page.waitForTimeout(500);
      await ap.locator('.as-trace summary').last().click();
      await page.waitForTimeout(300);
    };
    /** The conversation from the panel header down to the end of the last answer. */
    const shootChat = async (name, marks) => {
      await tall(page, 1700, async (vh) => {
        await page.waitForTimeout(300);
        await ap.locator('.as-body').evaluate((el) => (el.scrollTop = 0));
        const pb = await box(ap);
        const end = await box(ap.getByTestId('assistant-message').last());
        await mark(page, await marks());
        await shot(page, name, { x: pb.x, y: pb.y, width: W - pb.x, height: Math.min(vh - pb.y, end.y + end.height + 14 - pb.y) }, '', { fab: false });
        await unmark(page);
      });
    };
    // A wider panel keeps the answers from becoming tall, narrow pictures.
    await ap.getByRole('separator', { name: 'Resize the assistant panel' }).focus();
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    await ask('Which test should I use to compare life satisfaction between migrants and non-migrants?');
    console.log('  answer 1:', (await ap.getByTestId('assistant-message').last().innerText()).replace(/\n+/g, ' | ').slice(0, 900));
    await shootChat('assistant-answer', async () => {
      const msg = ap.getByTestId('assistant-message').last();
      return [
        { n: 1, loc: msg.locator('.as-trace summary'), at: 'r' },
        { n: 2, loc: msg.getByRole('button', { name: 'Add this analysis to Output' }), at: 'r' },
      ];
    });
    await ap.getByRole('button', { name: 'Add this analysis to Output' }).click();
    await page.waitForTimeout(300);

    await ap.getByRole('button', { name: 'Clear conversation' }).click();
    await page.waitForTimeout(300);
    await ask('Help me build a trust scale');
    console.log('  answer 2:', (await ap.getByTestId('assistant-message').last().innerText()).replace(/\n+/g, ' | ').slice(0, 900));
    await shootChat('assistant-proposal', async () => {
      const card = ap.getByTestId('assistant-proposal-card');
      return [
        { n: 1, loc: card, at: 'tl', ring: false },
        { n: 2, loc: card.getByRole('button', { name: 'Apply' }), at: 'l' },
      ];
    });
    await page.keyboard.press('Control+j');
    await page.waitForTimeout(300);

    // Text coding: the AI suggestions menu in the toolbar
    await page.getByRole('tab', { name: /^Text coding/ }).click();
    await page.waitForTimeout(400);
    await page.locator('.cw-welcome-card', { hasText: 'Explore a worked example' }).click();
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => (t.style.display = 'none')));
    await page.locator('.cw-ai-group .cw-menu-trigger').click();
    await page.waitForTimeout(300);
    const ml = page.locator('.cw-menu-list').last();
    console.log('  ai suggestions:', (await ml.innerText()).replace(/\n+/g, ' | '));
    const tb = await box(page.locator('.cw-ai-group'));
    const mlb = await box(ml);
    await mark(page, [{ n: 1, loc: page.locator('.cw-ai-group .cw-menu-trigger'), at: 't' }]);
    await shot(page, 'coding-ai', pad({ x: tb.x - 380, y: tb.y - 44, width: W - (tb.x - 380), height: mlb.y + mlb.height - tb.y + 44 }, 10));
    await unmark(page);
    await page.keyboard.press('Escape');
  } finally {
    await context.close();
  }
};

// ---------------------------------------------------------------- main
const order = Object.keys(sections);
const { browser, page } = await launch();
try {
  await ready(page);
  for (const name of order) {
    if (only.size && !only.has(name)) continue;
    console.log('section', name);
    try {
      await sections[name](page);
    } catch (e) {
      await page.screenshot({ path: `${OUT}/_error-${name}.png` });
      throw e;
    }
  }
} finally {
  writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
  await browser.close();
}
