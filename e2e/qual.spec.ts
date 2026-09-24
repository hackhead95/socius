// Qualitative coding end to end: open-ended answers, codebook, keyboard coding, auto-coding, export to
// the dataset and crosstabs, intercoder reliability, interview coding, AI help (mocked) and persistence.
import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('.grid-scroll')).toBeVisible({ timeout: 30_000 });
}

async function menu(page: Page, top: string, item: string | RegExp) {
  await page.getByRole('menuitem', { name: top, exact: true }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

/** Import q_challenge with gender and city as attributes. */
async function importChallenge(page: Page) {
  await menu(page, 'Text coding', 'Import open-ended answers from dataset…');
  const sel = page.locator('#cw-svar');
  const opts = await sel.locator('option').allInnerTexts();
  await sel.selectOption({ index: opts.findIndex((o) => o.includes('q_challenge')) });
  const boxes = page.locator('.modal .cw-checkgrid label.check');
  for (let i = 0; i < (await boxes.count()); i++) {
    const name = (await boxes.nth(i).innerText()).split(/\s/)[0];
    const cb = boxes.nth(i).locator('input');
    if ((await cb.isChecked()) !== ['gender', 'city'].includes(name)) await cb.click();
  }
  await expect(page.locator('.modal .btn-primary')).toHaveText('Import 630 answers');
  await page.locator('.modal .btn-primary').click();
  await expect(page.locator('.cw-resp-tools .help')).toHaveText('630 shown · 0 of 630 coded');
}

async function addCodes(page: Page, names: string[]) {
  for (const n of names) {
    await page.locator('input[aria-label="New code name"]').fill(n);
    await page.locator('.cw-newcode button[type=submit]').click();
  }
}

async function autocode(page: Page, rules: Record<string, string>) {
  await page.locator('.cw-toolbar button', { hasText: 'Auto-code' }).click();
  for (const [code, r] of Object.entries(rules)) {
    await page.locator('.cw-autocode-code', { hasText: new RegExp(`^${code}`) }).click();
    await page.locator('#cw-rules').fill(r);
  }
  await page.getByRole('button', { name: 'Preview matches' }).click();
}

/** Screen coordinates of the first and last character of a phrase in the reading view. */
async function phraseRect(page: Page, phrase: string) {
  await page.evaluate((p) => [...document.querySelectorAll('.cw-para')].find((el) => el.textContent!.includes(p))?.scrollIntoView({ block: 'center' }), phrase);
  const r = await page.evaluate((phrase) => {
    // Map document offsets to text nodes across the highlight spans ([data-s] = offset).
    const spans = Array.from(document.querySelectorAll<HTMLElement>('.cw-reader-body [data-s]'));
    let text = '';
    const map: Array<{ s: number; node: Node; len: number }> = [];
    for (const sp of spans) {
      const s = Number(sp.dataset.s);
      text = text.padEnd(s, '\n').slice(0, s) + (sp.textContent ?? '');
      if (sp.firstChild) map.push({ s, node: sp.firstChild, len: (sp.textContent ?? '').length });
    }
    const i = text.indexOf(phrase);
    if (i < 0) return null;
    const at = (off: number) => map.find((m) => off >= m.s && off < m.s + m.len)!;
    const rect = (off: number) => {
      const m = at(off);
      const rg = document.createRange();
      rg.setStart(m.node, off - m.s);
      rg.setEnd(m.node, off - m.s + 1);
      return rg.getBoundingClientRect();
    };
    const ra = rect(i), rb = rect(i + phrase.length - 1);
    return { x0: ra.left + 1, y0: ra.top + ra.height / 2, x1: rb.right - 1, y1: rb.top + rb.height / 2 };
  }, phrase);
  expect(r, `phrase on screen: ${phrase}`).not.toBeNull();
  return r!;
}

/** Select a phrase in the reading view with a real mouse drag. */
async function dragSelect(page: Page, phrase: string) {
  const r = await phraseRect(page, phrase);
  await page.mouse.move(r.x0, r.y0);
  await page.mouse.down();
  await page.mouse.move(r.x1, r.y1, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.cw-qc')).toBeVisible();
}

test('open-ended answers: import, keyboard coding, filters and undo', async ({ page }) => {
  await ready(page);
  await importChallenge(page);
  await page.locator('.cw-resp-search').fill('জল');
  await expect(page.locator('.cw-resp-tools .help')).toHaveText('3 shown · 0 of 630 coded');
  await expect(page.locator('.cw-resp-text').first()).toContainText('বর্ষায়');
  await page.locator('.cw-resp-search').fill('');
  await page.locator('select[aria-label="Filter by attribute"]').selectOption('gender');
  await expect(page.locator('select[aria-label="Value of gender"] option')).toHaveText(['Any value', 'Man', 'Other / prefer to self-describe', 'Woman']);
  await page.locator('select[aria-label="Filter by attribute"]').selectOption('');

  await addCodes(page, ['water', 'flooding', 'traffic']);
  await expect(page.locator('.cw-keychip')).toHaveCount(3);
  await page.locator('.cw-resp-scroll').focus();
  await page.keyboard.press('Home');
  // resp 1001 -> traffic (3), 1002 -> flooding (2), 1003 skipped, 1004 -> water (1)
  await page.keyboard.press('3');
  await page.keyboard.press('j');
  await page.keyboard.press('2');
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  await page.keyboard.press('1');
  await expect(page.locator('.cw-resp-tools .help')).toHaveText('630 shown · 3 of 630 coded');
  await page.keyboard.press('k');
  await expect(page.locator('.cw-resp-row.is-focused .cw-resp-meta b')).toHaveText('resp_id 1003');

  // Scroll far down, then filter: the filtered list starts at the top.
  await page.keyboard.press('End');
  await page.locator('select[aria-label="Filter by code"]').selectOption('__uncoded');
  await expect(page.locator('.cw-resp-tools .help')).toHaveText('627 shown · 3 of 630 coded');
  await expect(page.locator('.cw-resp-row.is-focused .cw-resp-meta b')).toHaveText('resp_id 1003');
  expect(await page.locator('.cw-resp-scroll').evaluate((el) => el.scrollTop)).toBe(0);

  await page.locator('.cw-resp-scroll').focus();
  await page.keyboard.press('Control+z');
  await expect(page.locator('.cw-resp-tools .help')).toHaveText('628 shown · 2 of 630 coded');
});

test('worked example: one click loads answers, a starter codebook and keyword coding; one undo removes it', async ({ page }) => {
  await ready(page);
  await page.getByRole('tab', { name: 'Text coding', exact: true }).click();
  const card = page.locator('.cw-welcome-card', { hasText: 'Explore a worked example' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('keyword rules');
  await card.click();

  // Responses view with the 630 answers, most of them coded by the rules.
  await expect(page.locator('.cw-viewtabs [role=tab][aria-selected=true]')).toContainText('Responses');
  const counts = page.locator('.cw-resp-tools .help');
  await expect(counts).toHaveText(/^630 shown · \d+ of 630 coded$/);
  const coded = Number(/(\d+) of 630/.exec(await counts.innerText())![1]);
  expect(coded / 630).toBeGreaterThan(0.6);
  await expect(page.locator('.toast')).toContainText('Example loaded');
  await expect(page.locator('.toast')).toContainText('review them');
  const note = page.locator('.cw-example-note');
  await expect(note).toContainText('Worked example.');
  await expect(note).toContainText(`coded ${coded} of 630 answers automatically`);
  await expect(page.locator('.cw-resp-row').first()).toContainText('area:');
  for (const name of ['Infrastructure and services', 'Water supply', 'Drainage and flooding', 'Safety at night', 'Rent and housing', 'Air pollution']) {
    await expect(page.locator('.cw-code', { hasText: name }).first()).toBeVisible();
  }

  // The note's shortcuts: review, export to the dataset, codes by attribute.
  await note.locator('button', { hasText: 'Show answers not coded' }).click();
  await expect(counts).toHaveText(`${630 - coded} shown · ${coded} of 630 coded`);
  await note.locator('button', { hasText: 'Export codes to dataset' }).click();
  await expect(page.locator('.modal')).toContainText('Water supply');
  await page.keyboard.press('Escape');
  await expect(page.locator('.modal')).toHaveCount(0);
  await note.locator('button', { hasText: 'Codes by attribute' }).click();
  await expect(page.locator('.cw-viewtabs [role=tab][aria-selected=true]')).toContainText('Analyse');
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Memos' }).click();
  await expect(page.locator('.cw-main')).toContainText('About this worked example');

  // One undo step removes the whole example and the offer comes back.
  await page.locator('.cw-toolbar button', { hasText: /^Undo$/ }).click();
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Responses' }).click();
  await expect(card).toBeVisible();
  await expect(page.locator('.cw-toolbar button', { hasText: /^Undo$/ })).toBeDisabled();
});

test('auto-coding preview, apply, undo and apply again', async ({ page }) => {
  await ready(page);
  await importChallenge(page);
  await addCodes(page, ['water', 'flooding']);
  // Expected counts from Python (whole-word matching over the 630 non-empty answers).
  await autocode(page, { water: 'water*\ntanker*\nपानी', flooding: '/water ?logging|flood/i' });
  await expect(page.locator('.modal .row').first()).toContainText('174 passages found');
  await expect(page.locator('.modal .badge', { hasText: 'water' })).toContainText('151');
  await expect(page.locator('.modal .badge', { hasText: 'flooding' })).toContainText('23');
  await page.locator('.modal .btn-primary').click();
  await expect(page.locator('.modal .callout-good')).toContainText('Added 174 segments');
  await page.getByRole('button', { name: 'Undo auto-coding' }).click();
  await expect(page.locator('.cw-code', { hasText: 'water' }).locator('.cw-codecount')).toContainText('0');
  await page.getByRole('button', { name: 'Preview matches' }).click();
  await expect(page.locator('.modal .row').first()).toContainText('174 passages found');
  await page.locator('.modal .btn-primary').click();
  await page.getByRole('button', { name: 'Preview matches' }).click();
  await expect(page.locator('.modal .row').first()).toContainText('0 passages found');
});

test('codes exported to the dataset give a sensible crosstab by gender', async ({ page }) => {
  await ready(page);
  await importChallenge(page);
  await addCodes(page, ['safety at night']);
  await autocode(page, { 'safety at night': 'safe*\nunsafe\nnight\ndark*\nharass*\nscary\nlonely\nafter sunset' });
  await expect(page.locator('.modal .row').first()).toContainText('58 passages found');
  await page.locator('.modal .btn-primary').click();
  await page.locator('.modal button', { hasText: /^Close$/ }).first().click();
  await menu(page, 'Text coding', 'Export codes to dataset…');
  await expect(page.locator('.modal tbody')).toContainText('58 of 630');
  await page.locator('.modal .btn-primary').click();
  await menu(page, 'Analyze', 'Descriptive Statistics');
  await page.getByRole('menuitem', { name: 'Crosstabs...' }).click();
  await page.locator('input[aria-label="Search variables"]').fill('gender');
  await page.locator('.pd-var').first().click();
  await page.locator('button[aria-label="Move selected variables to Row(s)"]').click();
  await page.locator('input[aria-label="Search variables"]').fill('c_safety');
  await page.locator('.pd-var').first().click();
  await page.locator('button[aria-label="Move selected variables to Column(s)"]').click();
  await page.locator('.pd-run').click();
  await expect(page.locator('#main')).toContainText('Chi-Square Tests');
  // Checked against pandas.crosstab + scipy chi2_contingency: men 20/321, women 36/290, chi2(2) = 7.010.
  const text = await page.locator('#main').innerText();
  expect(text).toMatch(/Man\s+Count\s+301\s+20\s+321/);
  expect(text).toMatch(/Woman\s+Count\s+254\s+36\s+290/);
  expect(text).toContain('12.4%');
  expect(text).toMatch(/Pearson Chi-Square\s+7\.010/);
  expect(text).toMatch(/N of Valid Cases\s+630/);
});

test('intercoder reliability reports sources only one coder coded', async ({ page }) => {
  await ready(page);
  await importChallenge(page);
  await addCodes(page, ['water', 'flooding', 'traffic']);
  const code = async (keys: string[]) => {
    await page.locator('.cw-resp-scroll').focus();
    await page.keyboard.press('Home');
    for (const k of keys) {
      if (k !== '-') await page.keyboard.press(k);
      await page.keyboard.press('j');
    }
  };
  // Rows 1001..1005: Coder 1 codes traffic, flooding, -, water, water
  await code(['3', '2', '-', '1', '1']);
  await page.locator('.cw-toolbar .cw-menu-trigger', { hasText: 'Coder:' }).click();
  await page.locator('.cw-menu-list [role=menuitem]', { hasText: 'Manage coders' }).click();
  await page.locator('input[aria-label="New coder name"]').fill('Priya');
  await page.locator('.modal button', { hasText: 'Add coder' }).click();
  await page.locator('.modal button', { hasText: 'Code as Priya' }).click();
  await page.locator('.modal button', { hasText: 'Done' }).click();
  // Undo still works after switching coder.
  await expect(page.locator('.cw-toolbar button', { hasText: 'Undo' })).toBeEnabled();
  // Priya: traffic, flooding, flooding (only she coded 1003), -, water (1004 left uncoded by her)
  await code(['3', '2', '2', '-', '1']);
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Reliability' }).click();
  const note = page.locator('.cw-reliability .callout-warn');
  await expect(note).toContainText('2 sources were coded by only one coder');
  await expect(page.locator('.cw-stat').nth(3)).toContainText('3');
  await note.locator('input[type=checkbox]').check();
  await expect(page.locator('.cw-stat').nth(3)).toContainText('5');
  await expect(page.locator('.cw-stat').nth(3)).toContainText('Sources compared');
  await expect(page.locator('.cw-quote')).toHaveCount(2);
});

test('interviews: code by selecting text, overlap, memo, retrieve, merge and delete', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ready(page);
  await menu(page, 'Text coding', 'Load sample interviews');
  await expect(page.locator('.cw-docitem')).toHaveCount(3);
  // Constant attributes (study title) are not what the source list shows.
  await expect(page.locator('.cw-docmeta').first()).not.toContainText('Belonging, migration');
  await dragSelect(page, 'it is not a place I live, it is who I am');
  await page.locator('.cw-qc-input').fill('belonging');
  await page.keyboard.press('Enter');
  await dragSelect(page, 'So this para [neighbourhood] is... it is not a place I live');
  await page.locator('.cw-qc-input').fill('place identity');
  await page.keyboard.press('Enter');
  await expect(page.locator('.cw-reader-meta')).toContainText('2 coded segments');
  const p = await phraseRect(page, 'not a place I live');
  await page.mouse.click(p.x0 + 20, p.y0);
  await expect(page.locator('.cw-segpop')).toContainText('2 codes on this passage');
  await page.locator('.cw-segpop-memo').first().fill('Identity fused with place.');
  await page.keyboard.press('Escape');

  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Retrieve' }).click();
  await page.locator('.cw-retrieve select[aria-label="Code"]').selectOption({ label: 'place identity' });
  await expect(page.locator('.cw-quote-memo')).toContainText('Identity fused with place.');
  await page.locator('.cw-retrieve button', { hasText: 'Copy quotes' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('(Interview 01: Shyamali, Kolkata (fictional))');
  await page.locator('.cw-quote button', { hasText: 'Show in context' }).click();
  await expect(page.locator('.cw-flash').first()).toBeVisible();

  const row = (name: string) => page.locator('.cw-code', { has: page.locator('.cw-codename-text', { hasText: new RegExp(`^${name}$`) }) });
  await row('place identity').locator('.cw-rowmenu').click();
  await page.locator('.cw-menu-list [role=menuitem]', { hasText: 'Merge into another code' }).click();
  await page.locator('#cw-into').selectOption({ label: 'belonging' });
  await page.locator('.modal .btn-primary').click();
  await expect(page.locator('.cw-code')).toHaveCount(1);
  await row('belonging').locator('.cw-rowmenu').click();
  await page.locator('.cw-menu-list [role=menuitem]', { hasText: 'Delete' }).click();
  await expect(page.locator('.modal').last()).toContainText('its 1 coded segment.');
  await page.locator('.modal button', { hasText: 'Delete code' }).click();
  await expect(page.locator('.cw-code')).toHaveCount(0);
});

test('themes: co-occurrence and codes by attribute count sub-codes in their theme', async ({ page }) => {
  await ready(page);
  await importChallenge(page);
  await addCodes(page, ['Infrastructure', 'water', 'flooding', 'safety']);
  for (const sub of ['water', 'flooding']) {
    await page.locator('.cw-code', { hasText: sub }).dragTo(page.locator('.cw-code', { hasText: 'Infrastructure' }), { targetPosition: { x: 60, y: 14 } });
  }
  await expect(page.locator('.cw-code[aria-level="2"]')).toHaveCount(2);
  await autocode(page, { water: 'water supply\ntanker*', flooding: '/water ?logging|flood/i', safety: 'safe*\nnight' });
  await page.locator('.modal .btn-primary').click();
  await page.locator('.modal button', { hasText: /^Close$/ }).first().click();
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Analyse' }).click();
  await page.locator('.cw-analyse [role=tab]', { hasText: 'Co-occurrence' }).click();
  await page.locator('select[aria-label="Codes to include"]').selectOption('top');
  await expect(page.locator('.cw-heat-row')).toHaveText([/Infrastructure/, /safety/]);
  await page.locator('.cw-analyse [role=tab]', { hasText: 'Codes by attribute' }).click();
  await page.locator('#cw-attr').selectOption('gender');
  // Groups follow the dataset's value labels, not the alphabet.
  await expect(page.locator('.cw-ftable thead tr').first().locator('th')).toHaveText(['Code', /^Man/, /^Woman/, /^Other/]);
  await expect(page.locator('.cw-ftable tbody tr').first()).toContainText('with sub-codes');
});

test('AI help is hidden outside the artifact viewer', async ({ page }) => {
  await ready(page);
  await page.getByRole('menuitem', { name: 'Text coding', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: /with AI/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await importChallenge(page);
  await expect(page.locator('.cw-toolbar .cw-menu-trigger', { hasText: 'AI suggestions' })).toHaveCount(0);
  await expect(page.locator('.cw-ainote')).toHaveText('AI suggestions are available when Socius runs as a Claude artifact.');
});

test('AI help with a mocked Claude: suggest a codebook, suggest codes, summarise, errors', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.__aiCalls = 0;
    w.__aiMode = 'ok';
    const fail = (code: string) => Object.assign(new Error(code), { code });
    const sample: any = async (_prompt: string, opts: any = {}) => {
      w.__aiCalls++;
      if (w.__aiMode !== 'ok') throw fail(w.__aiMode);
      const text = 'People describe irregular supply and reliance on tankers.';
      opts.onText?.({ text });
      return { text };
    };
    sample.json = async (prompt: string) => {
      w.__aiCalls++;
      if (w.__aiMode !== 'ok') throw fail(w.__aiMode);
      if (/propose a codebook/.test(prompt)) {
        return { codes: [
          { name: 'Civic infrastructure', parent: null, description: 'Municipal services', inclusion: '', exclusion: '', examples: ['water supply'] },
          { name: 'Water insecurity', parent: 'Civic infrastructure', description: 'Irregular supply', inclusion: '', exclusion: '', examples: [] },
          { name: 'water', parent: null, description: 'duplicate', inclusion: '', exclusion: '', examples: [] },
        ] };
      }
      const items = [...prompt.matchAll(/\{"id":"(r\d+)","text":"((?:[^"\\]|\\.)*)"\}/g)];
      return items.map((m) => ({ id: m[1], codes: /water/i.test(m[2]) ? ['water', 'Not a code'] : [] }));
    };
    w.claude = { use: async (name: string) => (name === 'sample' ? sample : null) };
  });
  await ready(page);
  await page.getByRole('menuitem', { name: 'Text coding', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: /with AI/ })).toHaveCount(2);
  await page.keyboard.press('Escape');
  await importChallenge(page);
  await addCodes(page, ['water']);
  // Nothing is sent to Claude until the researcher asks.
  expect(await page.evaluate(() => (window as any).__aiCalls)).toBe(0);

  const aiMenu = async (item: string) => {
    await page.locator('.cw-toolbar .cw-menu-trigger', { hasText: 'AI suggestions' }).click();
    await page.locator('.cw-menu-list [role=menuitem]', { hasText: item }).click();
  };
  await aiMenu('Suggest a codebook');
  await page.locator('.modal .btn-primary', { hasText: 'Suggest codes' }).click();
  await expect(page.locator('.cw-suggest')).toHaveCount(3);
  await expect(page.locator('.cw-suggest').nth(2)).toContainText('already in your codebook');
  await expect(page.locator('.cw-suggest').nth(2).locator('input[type=checkbox]')).not.toBeChecked();
  await page.locator('.modal .btn-primary', { hasText: 'Add 2 codes' }).click();
  await expect(page.locator('.cw-code[aria-level="2"]')).toHaveText(/Water insecurity/);

  await page.evaluate(() => ((window as any).__aiMode = 'not_granted'));
  await aiMenu('Suggest a codebook');
  await page.locator('.modal .btn-primary', { hasText: 'Suggest codes' }).click();
  await expect(page.locator('.modal .callout-bad')).toContainText('not allowed');
  await page.locator('.modal [data-close]').click();

  await page.evaluate(() => ((window as any).__aiMode = 'ok'));
  await aiMenu('Suggest codes for responses');
  await page.locator('#cw-smax').selectOption('50');
  await page.locator('.modal .btn-primary').click();
  await expect(page.locator('.modal .help', { hasText: 'batches done' })).toBeVisible();
  const rows = page.locator('.cw-suggest-row');
  await expect(rows.first()).toContainText('water');
  const n = await rows.count();
  await rows.nth(0).locator('button', { hasText: 'Reject' }).click();
  await page.locator('.modal .btn-primary', { hasText: 'Accept all' }).click();
  await page.locator('.modal [data-close]').click();
  await expect(page.locator('.cw-code', { hasText: /^water/ }).first().locator('.cw-codecount')).toContainText(String(n - 1));

  await page.evaluate(() => ((window as any).__aiMode = 'rate_limited'));
  await aiMenu('Suggest codes for responses');
  await page.locator('.modal .btn-primary').click();
  await expect(page.locator('.modal .callout-warn')).toContainText('Too many AI requests');
  await page.locator('.modal [data-close]').click();

  await page.evaluate(() => ((window as any).__aiMode = 'ok'));
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Retrieve' }).click();
  await page.locator('.cw-retrieve select[aria-label="Code"]').selectOption({ label: 'water' });
  await page.locator('.cw-retrieve button', { hasText: 'Summarise this code' }).click();
  await expect(page.locator('.cw-ai-summary')).toContainText('reliance on tankers');
});

test('coding survives a reload', async ({ page }) => {
  await ready(page);
  await importChallenge(page);
  await addCodes(page, ['water']);
  await page.locator('.cw-resp-scroll').focus();
  await page.keyboard.press('1');
  await page.waitForTimeout(2000);
  await page.reload();
  await expect(page.locator('.toast', { hasText: 'Restored your last session' })).toBeVisible({ timeout: 15_000 });
  await page.locator('#tab-coding').click();
  await page.locator('.cw-viewtabs [role=tab]', { hasText: 'Responses' }).click();
  await expect(page.locator('.cw-resp-tools .help')).toHaveText('630 shown · 1 of 630 coded');
});
