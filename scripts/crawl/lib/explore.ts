// The crawler proper: opens every menu item, dialog, toolbar button, context menu, popover and view of
// a state, and runs the checks after each step. Every interaction goes through probe(), which measures
// what the click did (DOM mutations, effects such as downloads or file pickers, time to respond,
// layout shift) and flushes console/page errors against the step that caused them.
import type { Browser, BrowserContext, ConsoleMessage, Locator, Page, Request } from '@playwright/test';
import { anchorRects, focusInfo, highlightedMenuItems, pageChecks, stateSignature, type CheckOptions, type RawIssue } from './checks';
import { instrument, type CrawlEffect } from './instrument';
import { Recorder, type Area, OUT } from './recorder';
import { STATES, type StateId } from './states';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

export type Depth = 'full' | 'layout';

export interface CrawlOptions {
  baseURL: string;
  state: StateId;
  viewport: { width: number; height: number };
  theme: 'light' | 'dark';
  depth: Depth;
  areas: Set<string> | null;
  /** Hard stop (ms) for the whole combination, so one stuck state cannot eat the run. */
  budgetMs: number;
  /** Playwright project ('prod' or 'react-dev'); non-prod runs get their own raw file. */
  project?: string;
}

interface ProbeResult {
  mutations: number;
  effects: CrawlEffect[];
  ms: number | null;
  modalsBefore: number;
  modalsAfter: number;
  menusAfter: number;
  popover: string | null;
  tabBefore: string;
  tabAfter: string;
  sigChanged: boolean;
  toast: string | null;
  error: string | null;
}

const DANGER = /\b(delete|remove|clear|reset|discard|forget|merge|uncode|replace|close and|start fresh|stop|send|download model|sign out|disconnect|apply|run|ok|import|export|save|load sample|new dataset|add cases|add variables|create|restore|drop|empty|recode|compute|undo|redo|duplicate|insert|add variable|add code|split|move to|paste)\b/i;
const MODAL = '.modal, [role="dialog"][aria-modal="true"]:not(.menu-sheet):not(.palette)';
const POPOVERS = '.ai-pop, .as-see, .stats-pop, .context-menu, .ov-menu-list, .cw-menu-list, .palette, .as-panel, .menu-sheet, .find-bar, .goto-bar';

export class Crawler {
  page!: Page;
  context!: BrowserContext;
  rec!: Recorder;
  private pendingConsole: Array<{ rule: string; text: string; loc: string }> = [];
  private baseSig = '';
  private baseTab = 'data';
  private started = Date.now();
  private coverage: Record<string, number> = {};
  private seenDialogs = new Set<string>();
  readonly name: string;

  constructor(
    private browser: Browser,
    readonly o: CrawlOptions,
  ) {
    this.name = `${o.state} @ ${o.viewport.width}x${o.viewport.height} ${o.theme}${o.project && o.project !== 'prod' ? ` [${o.project}]` : ''}`;
  }

  // ---------------------------------------------------------------- setup

  want(area: Area | string): boolean {
    return !this.o.areas || this.o.areas.has(area);
  }

  outOfTime(): boolean {
    return Date.now() - this.started > this.o.budgetMs;
  }

  cover(what: string, n = 1) {
    this.coverage[what] = (this.coverage[what] ?? 0) + n;
  }

  writeCoverage() {
    appendFileSync(join(OUT, 'raw', `${this.name.replace(/[^a-z0-9_-]+/gi, '_')}.jsonl`), JSON.stringify({ type: 'coverage', combo: this.name, project: this.o.project ?? 'prod', state: this.o.state, viewport: `${this.o.viewport.width}x${this.o.viewport.height}`, theme: this.o.theme, depth: this.o.depth, coverage: this.coverage, ms: Date.now() - this.started, at: new Date().toISOString() }) + '\n');
  }

  async open(): Promise<void> {
    if (this.context) await this.context.close().catch(() => undefined);
    this.context = await this.browser.newContext({ viewport: this.o.viewport, baseURL: this.o.baseURL, colorScheme: this.o.theme, acceptDownloads: false, reducedMotion: 'no-preference' });
    // Web fonts are blocked in the sandbox; do not count them as failures.
    await this.context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await this.context.addInitScript(instrument, { theme: this.o.theme });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(8000);
    const vp = `${this.o.viewport.width}x${this.o.viewport.height}`;
    if (!this.rec) this.rec = new Recorder(this.page, { state: this.o.state, viewport: vp, theme: this.o.theme, test: this.name });
    this.rec.page = this.page;
    this.page.on('console', (m: ConsoleMessage) => this.onConsole(m));
    this.page.on('pageerror', (e) => this.pendingConsole.push({ rule: 'pageerror', text: `${e.name}: ${e.message}`, loc: (e.stack ?? '').split('\n').slice(1, 3).join(' ').trim() }));
    this.page.on('requestfailed', (r: Request) => this.onNetFail(r, r.failure()?.errorText ?? 'failed'));
    this.page.on('response', (r) => {
      if (r.status() >= 400 && r.url().startsWith(new URL(this.o.baseURL).origin)) this.pendingConsole.push({ rule: 'network', text: `HTTP ${r.status()} for ${r.url().replace(this.o.baseURL, '')}`, loc: r.request().resourceType() });
    });
    this.page.on('popup', async (p) => {
      this.pendingConsole.push({ rule: 'info-popup', text: p.url(), loc: '' });
      await p.close().catch(() => undefined);
    });
    this.page.on('dialog', async (d) => {
      this.pendingConsole.push({ rule: 'console-warning', text: `native ${d.type()} dialog: "${d.message().slice(0, 120)}" (native dialogs are blocked in the Claude artifact viewer)`, loc: '' });
      await d.dismiss().catch(() => undefined);
    });
  }

  private onConsole(m: ConsoleMessage) {
    const t = m.text();
    if (/Failed to load resource/.test(t) && /ERR_(CERT|FAILED|ABORTED|NAME)/.test(t)) return; // fonts (handled via requestfailed)
    if (/Download the React DevTools/.test(t)) return;
    if (/WebGPU|ERR_TUNNEL_CONNECTION_FAILED|ERR_CERT_AUTHORITY_INVALID|net::ERR_/.test(t) && !t.includes(new URL(this.o.baseURL).host)) return; // sandbox network / no GPU
    const loc = m.location()?.url ? `${m.location().url.replace(this.o.baseURL, '')}:${m.location().lineNumber}` : '';
    if (m.type() === 'error') this.pendingConsole.push({ rule: /Warning:|unique "key"|act\(|controlled|uncontrolled|validateDOMNesting|React/.test(t) ? 'react-warning' : 'console-error', text: t.slice(0, 600), loc });
    else if (m.type() === 'warning') this.pendingConsole.push({ rule: /Warning:|React|unique "key"/.test(t) ? 'react-warning' : 'console-warning', text: t.slice(0, 600), loc });
  }

  private onNetFail(r: Request, err: string) {
    const url = r.url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) return;
    // Other sites (AI providers, GitHub) are blocked in this sandbox; only the app's own files count.
    if (!url.startsWith(new URL(this.o.baseURL).origin)) return;
    if (/ERR_ABORTED/.test(err) && r.resourceType() !== 'document' && r.resourceType() !== 'script') return; // cancelled by navigation
    this.pendingConsole.push({ rule: 'network', text: `${r.method()} ${url.replace(this.o.baseURL, '')} failed: ${err}`, loc: r.resourceType() });
  }

  /** Record console/page/network errors seen since the last flush, attributed to the current step. */
  async flushConsole() {
    const items = this.pendingConsole.splice(0);
    for (const c of items) {
      if (c.rule === 'info-popup') continue;
      await this.rec.add(c.rule, { sel: c.loc || '(console)', label: '', msg: c.text, rect: null, noShot: c.rule !== 'pageerror' });
    }
  }

  async build(): Promise<void> {
    const def = STATES[this.o.state];
    await this.open();
    this.rec.steps = [`Viewport ${this.o.viewport.width}×${this.o.viewport.height}, ${this.o.theme} theme (View > Theme)`, ...def.steps];
    await this.page.goto('./');
    await def.build(this.page);
    await this.settle(600);
    // Close the toasts the set-up produced, so they do not cover things in the first checks.
    await this.dismissToasts();
    this.baseSig = await this.sig();
    this.baseTab = await this.currentTab();
    await this.flushConsole();
  }

  async dismissToasts() {
    await this.page.evaluate(() => document.querySelectorAll<HTMLButtonElement>('.toast button[aria-label], .toast .toast-x, .toast button').forEach((b) => b.click())).catch(() => undefined);
    await this.page.waitForTimeout(150);
  }

  async sig(): Promise<string> {
    return this.page.evaluate(stateSignature).catch(() => '');
  }

  async currentTab(): Promise<string> {
    return this.page.evaluate(() => document.querySelector('.main-tabs [aria-selected="true"]')?.id?.replace('tab-', '') ?? '').catch(() => '');
  }

  /** Back to the state's starting point: close everything; rebuild the state if the data changed. */
  async recover(reason = ''): Promise<void> {
    for (let i = 0; i < 4; i++) {
      const open = await this.page.locator(`${MODAL}, [role=menu], ${POPOVERS}`).count().catch(() => 0);
      if (!open) break;
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForTimeout(120);
    }
    // Stubborn dialogs: their close button.
    for (let i = 0; i < 3 && (await this.page.locator('.modal').count().catch(() => 0)); i++) {
      await this.page.locator('.modal').last().locator('[data-close], button:has-text("Cancel"), button:has-text("Close"), button:has-text("Done")').first().click({ timeout: 1500 }).catch(() => undefined);
      await this.page.waitForTimeout(150);
    }
    const s = await this.sig();
    if (s !== this.baseSig || (await this.page.locator('.modal').count().catch(() => 1))) {
      this.cover('rebuilds');
      const keep = this.rec.steps;
      await this.build();
      this.rec.steps = keep;
      return;
    }
    const tab = await this.currentTab();
    if (tab && tab !== this.baseTab) await this.page.locator(`#tab-${this.baseTab}`).click({ timeout: 2000 }).catch(() => undefined);
    await this.page.mouse.move(2, this.o.viewport.height - 2).catch(() => undefined);
    this.mouseAt = [2, this.o.viewport.height - 2];
    void reason;
  }

  /** Run one crawl module; a crawler failure is logged (not reported as an app bug) and the crawl goes on. */
  async safe(name: string, fn: () => Promise<unknown>): Promise<void> {
    const steps = this.rec.steps.slice();
    try {
      await fn();
    } catch (e) {
      this.cover(`module-errors`);
      appendFileSync(join(OUT, 'raw', `${this.name.replace(/[^a-z0-9_-]+/gi, '_')}.jsonl`), JSON.stringify({ type: 'crawl-error', combo: this.name, module: name, error: (e as Error).message.split('\n').slice(0, 3).join(' '), stack: ((e as Error).stack ?? '').split('\n').filter((l) => l.includes('/scripts/crawl/')).slice(0, 4).map((l) => l.trim().replace(/^at /, '').replace(/.*scripts\/crawl\//, '')).join(' < '), at: new Date().toISOString() }) + '\n');
      this.rec.steps = steps;
      await this.recover().catch(() => this.forceRebuild().catch(() => undefined));
    }
  }

  /** After a scenario that changed the data on purpose: start the state again from scratch. */
  async forceRebuild(): Promise<void> {
    const keep = this.rec.steps;
    this.cover('rebuilds');
    await this.build();
    this.rec.steps = keep;
  }

  async settle(ms = 400): Promise<void> {
    // Wait until the DOM has been quiet for 150ms (max ms).
    const t0 = Date.now();
    let last = -1;
    while (Date.now() - t0 < ms) {
      const m = await this.page.evaluate(() => (window as any).__crawl?.mutations ?? 0).catch(() => 0);
      if (m === last) break;
      last = m;
      await this.page.waitForTimeout(150);
    }
  }

  // ---------------------------------------------------------------- probing

  async counts() {
    return this.page.evaluate(
      ({ MODAL, POPOVERS }) => {
        const vis = (el: Element) => (el as HTMLElement).getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
        const pops = [...document.querySelectorAll(POPOVERS)].filter(vis);
        return {
          modals: [...document.querySelectorAll(MODAL)].filter(vis).length,
          menus: [...document.querySelectorAll('[role=menu]')].filter(vis).filter((m) => !m.parentElement?.closest('[role=menu]')).length,
          popover: pops.length ? pops.map((p) => p.className.toString().split(' ')[0]).join(',') : null,
          toast: [...document.querySelectorAll('.toast')].map((t) => (t.textContent ?? '').trim()).join(' | ') || null,
          c: (window as any).__crawl ? { m: (window as any).__crawl.mutations, e: (window as any).__crawl.effects.length } : { m: 0, e: 0 },
        };
      },
      { MODAL, POPOVERS },
    );
  }

  /**
   * Do something and report what happened. `what` is the breadcrumb step. Records dead controls
   * (nothing happened), slow responses and layout shift unless told not to.
   */
  async probe(what: string, act: () => Promise<void>, o: { expectEffect?: boolean; label?: string; sel?: string; rect?: RawIssue['rect']; shiftCheck?: boolean; waitMs?: number } = {}): Promise<ProbeResult> {
    this.rec.step(what);
    const before = await this.counts().catch(() => ({ modals: 0, menus: 0, popover: null, toast: null, c: { m: 0, e: 0 } }));
    const anchors = o.shiftCheck ? await this.page.evaluate(anchorRects).catch(() => null) : null;
    const tabBefore = await this.currentTab();
    await this.page.evaluate(() => {
      const c = (window as any).__crawl;
      if (c) {
        c.inputAt = 0;
        c.firstResponseAt = 0;
        c.longTasks = [];
      }
    }).catch(() => undefined);
    let error: string | null = null;
    const t0 = Date.now();
    try {
      await act();
    } catch (e) {
      error = (e as Error).message.split('\n')[0];
    }
    await this.page.waitForTimeout(o.waitMs ?? 250);
    await this.settle(900);
    const after = await this.counts().catch(() => ({ modals: 0, menus: 0, popover: null, toast: null, c: { m: 0, e: 0 } }));
    const timing = await this.page.evaluate(() => {
      const c = (window as any).__crawl;
      return c ? { ms: c.inputAt && c.firstResponseAt ? c.firstResponseAt - c.inputAt : null, long: c.longTasks.reduce((a: number, t: any) => Math.max(a, t.d), 0), effects: c.effects } : { ms: null, long: 0, effects: [] };
    }).catch(() => ({ ms: null, long: 0, effects: [] as CrawlEffect[] }));
    const effects = (timing.effects as CrawlEffect[]).slice(before.c.e);
    const tabAfter = await this.currentTab();
    const res: ProbeResult = {
      mutations: after.c.m - before.c.m,
      effects,
      ms: timing.ms,
      modalsBefore: before.modals,
      modalsAfter: after.modals,
      menusAfter: after.menus,
      popover: after.popover,
      tabBefore,
      tabAfter,
      sigChanged: false,
      toast: after.toast !== before.toast ? after.toast : null,
      error,
    };
    const elapsed = Date.now() - t0;
    if (!error && o.expectEffect !== false && res.mutations === 0 && !effects.length) {
      await this.rec.add('dead-control', { sel: o.sel ?? '', label: o.label ?? what, msg: `"${o.label ?? what}" was clicked and nothing happened: no DOM change, no dialog, no message, no download or file picker`, rect: o.rect ?? null });
    }
    const slowMs = Math.max(res.ms ?? 0, timing.long ?? 0);
    if (!error && slowMs > 1000) await this.rec.add('slow', { sel: o.sel ?? '', label: o.label ?? what, msg: `took ${Math.round(slowMs)}ms to respond (first DOM change or longest main-thread task); total step ${elapsed}ms`, rect: o.rect ?? null, data: { ms: Math.round(slowMs) } });
    if (anchors && tabBefore === tabAfter && (after.modals > before.modals || after.popover !== before.popover)) {
      const now = await this.page.evaluate(anchorRects).catch(() => null);
      if (now) {
        const moved = Object.keys(anchors).filter((k) => k !== '__scrollbar' && now[k] && anchors[k].some((v, i) => Math.abs(v - now[k][i]) > 2));
        if (moved.length) await this.rec.add('layout-shift', { sel: moved.join(', '), label: o.label ?? what, msg: `opening it moved the page behind: ${moved.map((k) => `${k} ${anchors[k].join(',')} → ${now[k].join(',')}`).join('; ')}`, rect: null });
      }
    }
    await this.flushConsole();
    if (error) this.rec.steps.push(`(interaction failed: ${error.slice(0, 100)})`);
    return res;
  }

  async check(o: CheckOptions = {}, extra: { area?: Area } = {}) {
    const issues = await this.page.evaluate(pageChecks, { contrast: true, ...o }).catch((e) => {
      this.rec.steps.push(`(checks failed: ${(e as Error).message.slice(0, 80)})`);
      return [] as RawIssue[];
    });
    for (const i of issues) await this.rec.add(i.rule, { ...i, area: extra.area });
    this.cover('checks');
    return issues;
  }

  async center(loc: Locator): Promise<[number, number] | null> {
    const b = await loc.boundingBox().catch(() => null);
    if (!b) return null;
    return [b.x + b.width / 2, b.y + b.height / 2];
  }

  private mouseAt: [number, number] = [0, 0];

  /**
   * Move the real pointer like a person does in menus: first vertically, then horizontally (a straight
   * diagonal from a menubar button to an item would cross the neighbouring menubar button and switch
   * menus; that behaviour is reported once by menuBehaviour, not everywhere).
   */
  async moveTo(x: number, y: number, steps = 6) {
    const [x0, y0] = this.mouseAt;
    if (Math.abs(y - y0) > 2 && Math.abs(x - x0) > 2) await this.page.mouse.move(x0, y, { steps: Math.max(2, Math.ceil(steps / 2)) });
    await this.page.mouse.move(x, y, { steps });
    this.mouseAt = [x, y];
  }

  /** Real pointer: move there in steps, then click. */
  async mouseClick(loc: Locator, o: { button?: 'left' | 'right' } = {}) {
    await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
    const c = await this.center(loc);
    if (!c) throw new Error('element not visible');
    await this.moveTo(c[0], c[1], 4);
    await this.page.mouse.click(c[0], c[1], { button: o.button ?? 'left' });
  }

  async mouseHover(loc: Locator, steps = 6) {
    const c = await this.center(loc);
    if (!c) throw new Error('element not visible');
    await this.moveTo(c[0], c[1], steps);
  }

  async rectOf(loc: Locator): Promise<RawIssue['rect']> {
    const b = await loc.boundingBox().catch(() => null);
    return b ? { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) } : null;
  }

  // ---------------------------------------------------------------- dialogs

  /**
   * A modal just opened: check it, test keyboard focus, exercise its controls (full depth), close it
   * with Escape and check focus comes back. `opener` is where focus should return.
   */
  async handleDialog(from: string, opener: Locator | null, level = 0): Promise<void> {
    const modal = this.page.locator(MODAL).last();
    const title = ((await modal.locator('h2, [role=heading]').first().textContent({ timeout: 1500 }).catch(() => null)) ?? (await modal.getAttribute('aria-label').catch(() => null)) ?? 'dialog').trim();
    const firstTime = !this.seenDialogs.has(title);
    this.seenDialogs.add(title);
    this.cover('dialogs');
    await this.rec.within(null, `Dialog "${title}" is open`, async () => {
      await this.page.waitForTimeout(200);
      await this.check({});
      if (firstTime || this.o.depth === 'full') await this.focusChecks(title);
      if (this.o.depth === 'full' && firstTime && level < 2 && !this.outOfTime()) await this.exerciseDialog(title, level);
      else if (firstTime) await this.dialogTabs(title);
      await this.closeTopDialog(title, opener);
    });
  }

  async focusChecks(title: string) {
    const modal = this.page.locator(MODAL).last();
    const fi = await this.page.evaluate(focusInfo).catch(() => null);
    if (fi && !fi.inDialog) await this.rec.add('focus-initial', { sel: fi.sel, label: title, msg: `when "${title}" opens, keyboard focus stays on ${fi.body ? 'the page body' : `${fi.sel} (${fi.label})`} instead of moving into the dialog`, rect: await this.rectOf(modal) });
    const n = await modal.locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])').count().catch(() => 0);
    const stops = Math.min(n + 2, 40);
    const rings: string[] = [];
    let escaped: string | null = null;
    for (let i = 0; i < stops; i++) {
      await this.page.keyboard.press('Tab');
      const f = await this.page.evaluate(focusInfo).catch(() => null);
      if (!f) continue;
      if (!f.inDialog) {
        escaped = f.body ? 'the page body' : `${f.sel} (${f.label})`;
        break;
      }
      if (f.visibleRing === false && i < 12 && !rings.includes(f.sel)) {
        rings.push(f.sel);
        await this.rec.add('focus-ring', { sel: f.sel, label: f.label, msg: `in "${title}", "${f.label || f.sel}" gets keyboard focus (Tab) but nothing on screen shows it`, rect: f.rect });
      }
    }
    if (escaped) await this.rec.add('focus-trap', { sel: `dialog "${title}"`, label: title, msg: `pressing Tab in "${title}" moves focus out of the dialog to ${escaped}`, rect: await this.rectOf(modal) });
    // Shift+Tab from the first element must wrap to the last, not leave.
    await this.page.keyboard.press('Shift+Tab');
    for (let i = 0; i < Math.min(n + 1, 40); i++) await this.page.keyboard.press('Shift+Tab');
    const f = await this.page.evaluate(focusInfo).catch(() => null);
    if (f && !f.inDialog && !escaped) await this.rec.add('focus-trap', { sel: `dialog "${title}"`, label: title, msg: `pressing Shift+Tab in "${title}" moves focus out of the dialog to ${f.body ? 'the page body' : f.sel}`, rect: await this.rectOf(modal) });
    this.cover('focus-checks');
  }

  async dialogTabs(title: string) {
    const modal = this.page.locator(MODAL).last();
    const tabs = modal.locator('[role=tab]');
    const nTabs = await tabs.count().catch(() => 0);
    for (let i = 0; i < nTabs && i < 8; i++) {
      const t = tabs.nth(i);
      const label = ((await t.textContent().catch(() => '')) ?? '').trim();
      if ((await t.getAttribute('aria-selected').catch(() => null)) === 'true') continue;
      const r = await this.probe(`In "${title}", click the "${label}" tab`, () => this.mouseClick(t), { label, rect: await this.rectOf(t) });
      if (r.modalsAfter < r.modalsBefore) return;
      if ((await t.getAttribute('aria-selected').catch(() => null)) !== 'true') await this.rec.add('dead-control', { sel: `dialog "${title}" [role=tab]`, label, msg: `in "${title}", clicking the "${label}" tab does not select it`, rect: await this.rectOf(t) });
      await this.check({});
      this.cover('dialog-tabs');
    }
  }

  /** Click every safe control in the top dialog once (at most 2 per kind), checking each result. */
  async exerciseDialog(title: string, level: number) {
    await this.dialogTabs(title);
    const modal = () => this.page.locator(MODAL).last();
    const done = new Set<string>();
    const perKind = new Map<string, number>();
    for (let round = 0; round < 30 && !this.outOfTime(); round++) {
      const cands = await modal()
        .evaluate((m, DANGER_SRC) => {
          const danger = new RegExp(DANGER_SRC, 'i');
          const vis = (el: Element) => (el as HTMLElement).getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
          return [...m.querySelectorAll('button, [role=button], input[type=checkbox], input[type=radio], select, summary, a[href]')]
            .filter((el) => vis(el) && !(el as HTMLButtonElement).disabled && el.getAttribute('aria-disabled') !== 'true')
            .map((el, i) => {
              const text = ((el as HTMLElement).innerText || el.getAttribute('aria-label') || el.getAttribute('title') || (el as HTMLInputElement).name || '').replace(/\s+/g, ' ').trim().slice(0, 50);
              const kind = `${el.tagName}.${[...el.classList].sort().join('.')}|${(el as HTMLInputElement).type ?? ''}`;
              const lab = el.closest('label')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 50) ?? '';
              const active = el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true' || (el.getAttribute('role') === 'radio' && el.getAttribute('aria-checked') === 'true') || !!el.getAttribute('aria-current') || /(^|\s)(on|active|is-active|is-on|selected|is-selected|current)(\s|$)/.test(el.className.toString());
              return { i, text: text || lab, kind, tag: el.tagName, footer: !!el.closest('.modal-footer'), close: el.hasAttribute('data-close'), primary: el.classList.contains('btn-primary') || el.classList.contains('pd-run'), danger: danger.test(text) || el.classList.contains('btn-danger') || /resize/i.test(text), tab: el.getAttribute('role') === 'tab' || (active && el.tagName !== 'INPUT' && el.tagName !== 'SELECT') };
            });
        }, DANGER.source)
        .catch(() => [] as Array<{ i: number; text: string; kind: string; tag: string; footer: boolean; close: boolean; primary: boolean; danger: boolean; tab: boolean }>);
      const next = cands.find((c) => {
        const id = `${c.kind}|${c.text}`;
        if (done.has(id) || c.close || c.primary || c.danger || c.tab || /^(cancel|close|done|ok)$/i.test(c.text)) return false;
        if ((perKind.get(c.kind) ?? 0) >= 2) return false;
        return true;
      });
      if (!next) break;
      done.add(`${next.kind}|${next.text}`);
      perKind.set(next.kind, (perKind.get(next.kind) ?? 0) + 1);
      const el = modal().locator('button, [role=button], input[type=checkbox], input[type=radio], select, summary, a[href]').filter({ visible: true }).nth(next.i);
      // Re-resolve by position among the same filtered list (the evaluate filtered disabled ones too).
      const handle = await modal().evaluateHandle((m, i) => {
        const vis = (el: Element) => (el as HTMLElement).getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
        return [...m.querySelectorAll('button, [role=button], input[type=checkbox], input[type=radio], select, summary, a[href]')].filter((el) => vis(el) && !(el as HTMLButtonElement).disabled && el.getAttribute('aria-disabled') !== 'true')[i];
      }, next.i).catch(() => null);
      void el;
      const target = handle?.asElement();
      if (!target) continue;
      const box = await target.boundingBox().catch(() => null);
      const rect = box ? { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } : null;
      const label = next.text || next.kind;
      this.cover('dialog-controls');
      if (next.tag === 'SELECT') {
        await this.probe(`In "${title}", change the "${label}" drop-down`, async () => {
          const opts = await target.evaluate((s: HTMLSelectElement) => [...s.options].filter((o) => !o.disabled).map((o) => o.value));
          const cur = await target.evaluate((s: HTMLSelectElement) => s.value);
          const other = opts.find((v) => v !== cur);
          if (other !== undefined) await target.selectOption(other);
        }, { expectEffect: false, label, rect });
      } else {
        const r = await this.probe(`In "${title}", click "${label}"`, async () => {
          await target.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
          const b = await target.boundingBox();
          if (!b) throw new Error('not visible');
          await this.moveTo(b.x + b.width / 2, b.y + b.height / 2, 3);
          await this.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
        }, { label, rect, expectEffect: next.tag !== 'INPUT' });
        if (r.modalsAfter > r.modalsBefore) {
          await this.handleDialog(`${title} > ${label}`, null, level + 1);
        } else if (r.modalsAfter < r.modalsBefore) {
          // The control closed the dialog (fine for Cancel-like buttons); stop here.
          await this.recover();
          return;
        }
        // Close anything the click popped up (menus, popovers) but keep the dialog.
        const pop = await this.page.locator('[role=menu], .cw-menu-list, .ov-menu-list').count().catch(() => 0);
        if (pop) {
          await this.check({});
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(100);
          if (!(await this.page.locator(MODAL).count())) {
            await this.rec.add('focus-escape', { sel: `dialog "${title}"`, label: title, msg: `Escape pressed to close a small menu inside "${title}" closed the whole dialog`, rect: null });
            await this.recover();
            return;
          }
        }
      }
      if ((await this.sig()) !== this.baseSig) {
        this.rec.steps.push('(the data changed; the state is rebuilt)');
        await this.recover();
        return;
      }
    }
    await this.check({});
  }

  async closeTopDialog(title: string, opener: Locator | null) {
    const before = await this.page.locator(MODAL).count().catch(() => 0);
    if (!before) return;
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(250);
    const after = await this.page.locator(MODAL).count().catch(() => 0);
    if (after !== before - 1) {
      await this.rec.add('focus-escape', { sel: `dialog "${title}"`, label: title, msg: after === before ? `Escape does not close "${title}"` : `Escape closed ${before - after} dialogs at once (only the top one, "${title}", should close)`, rect: await this.rectOf(this.page.locator(MODAL).last()) });
      if (after === before) {
        await this.page.locator(MODAL).last().locator('[data-close], button:has-text("Cancel"), button:has-text("Close")').first().click({ timeout: 1500 }).catch(() => undefined);
        await this.page.waitForTimeout(200);
      }
    }
    // Focus should come back to where the user was, not fall to <body> (keyboard users lose their
    // place) or jump to an unrelated control such as the floating assistant button.
    if (after < before) {
      const f = await this.page.evaluate(focusInfo).catch(() => null);
      const onFab = await this.page.evaluate(() => !!document.activeElement?.closest('.as-fab')).catch(() => false);
      const openerIsFab = opener ? await opener.evaluate((o) => o.classList.contains('as-fab')).catch(() => false) : false;
      if (f && (f.body || (onFab && !openerIsFab))) {
        const where = f.body ? 'the page body (keyboard users lose their place)' : 'the floating assistant button, not the control that opened it';
        await this.rec.add('focus-return', { sel: `dialog "${title}"`, label: title, msg: `after closing "${title}" with Escape, keyboard focus goes to ${where}`, rect: null, noShot: true });
      }
    }
    this.cover('dialog-closes');
  }

  // ---------------------------------------------------------------- menubar

  async menubarMode(): Promise<'bar' | 'sheet' | 'none'> {
    if (await this.page.locator('.menubar').isVisible().catch(() => false)) return 'bar';
    if (await this.page.locator('.menu-sheet-btn').isVisible().catch(() => false)) return 'sheet';
    return 'none';
  }

  topButton(label: string): Locator {
    return this.page.locator('.menubar-btn', { hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
  }

  async openTop(label: string): Promise<Locator> {
    const btn = this.topButton(label);
    if ((await btn.getAttribute('aria-expanded')) !== 'true') await this.mouseClick(btn);
    await this.page.locator('.menu-dropdown').first().waitFor({ state: 'visible', timeout: 3000 });
    return btn;
  }

  async itemsOf(menu: Locator) {
    return menu.evaluate((m) =>
      [...m.querySelectorAll(':scope > .menu-item-wrap > .menu-item')].map((b) => ({
        label: b.getAttribute('data-label') ?? (b.textContent ?? '').trim(),
        disabled: b.getAttribute('aria-disabled') === 'true',
        sub: b.getAttribute('aria-haspopup') === 'menu',
        title: b.getAttribute('title') ?? '',
      })),
    );
  }

  /** Items the walk must not click in this state (they change the data; covered by other checks). */
  skipItem(path: string[]): string | null {
    const label = path[path.length - 1];
    const full = path.join(' > ');
    if (/^(Undo|Redo)$/.test(label)) return 'changes the data (undo/redo)';
    if (/Turn (filter|weighting) off/.test(label)) return 'changes the data';
    if (/^Theme >/.test(path.slice(1).join(' > ')) || /Theme > /.test(full)) return 'theme is set per run';
    if (this.o.state !== 'first-visit' && /^(New dataset|Load sample survey|Load sample interviews)$/.test(label)) return 'replaces the data';
    if (/Explore a worked example/.test(label)) return 'replaces the coding project';
    return null;
  }

  async walkMenus(only: string[] | null) {
    const mode = await this.menubarMode();
    if (mode === 'sheet') return this.walkSheet(only);
    if (mode !== 'bar') return;
    const tops = (await this.page.locator('.menubar-btn').allTextContents()).map((s) => s.trim());
    for (const top of tops) {
      if (only && !only.includes(top)) continue;
      if (this.outOfTime()) return;
      const area = areaForMenu(top);
      if (!this.want(area) && !this.want('shell/menus/search/help')) continue;
      await this.rec.within(area, null, async () => {
        const btn = await this.openTop(top).catch(() => null);
        if (!btn) return;
        this.rec.step(`Click the "${top}" menu`);
        await this.check({ contrast: true, root: null });
        const items = await this.itemsOf(this.page.locator('.menu-dropdown').first()).catch(() => []);
        await this.page.keyboard.press('Escape');
        for (const it of items) {
          if (this.outOfTime()) return;
          if (it.disabled) continue;
          if (it.sub) {
            await this.rec.within(null, null, async () => {
              await this.openTop(top);
              const parent = this.page.locator('.menu-dropdown').first().locator(`:scope > .menu-item-wrap > .menu-item[data-label="${cssq(it.label)}"]`);
              await this.mouseHover(parent);
              await this.page.waitForTimeout(150);
              this.rec.step(`Point at "${it.label}"`);
              const sub = this.page.locator('.menu-submenu').first();
              if (!(await sub.isVisible().catch(() => false))) {
                await this.rec.add('menu-hover', { sel: `menu ${top} > ${it.label}`, label: it.label, msg: `pointing at "${top} > ${it.label}" does not open its submenu`, rect: await this.rectOf(parent) });
                await this.page.keyboard.press('Escape');
                return;
              }
              await this.check({ root: null });
              const subs = await this.itemsOf(sub).catch(() => []);
              await this.page.keyboard.press('Escape');
              await this.page.keyboard.press('Escape');
              for (const s of subs) {
                if (s.disabled || this.outOfTime()) continue;
                const path = [top, it.label, s.label];
                const skip = this.skipItem(path);
                if (skip) continue;
                await this.rec.within(null, null, async () => {
                  await this.openTop(top);
                  const p2 = this.page.locator('.menu-dropdown').first().locator(`:scope > .menu-item-wrap > .menu-item[data-label="${cssq(it.label)}"]`);
                  await this.mouseHover(p2);
                  this.rec.step(`Point at "${it.label}"`);
                  const target = this.page.locator('.menu-submenu').first().locator(`.menu-item[data-label="${cssq(s.label)}"]`);
                  // Move horizontally into the submenu first (as a person does), then down to the item.
                  const tb = await target.boundingBox();
                  const pb = await p2.boundingBox();
                  if (tb && pb) {
                    await this.page.mouse.move(tb.x + 10, pb.y + pb.height / 2, { steps: 5 });
                    await this.page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 5 });
                    this.mouseAt = [tb.x + tb.width / 2, tb.y + tb.height / 2];
                  }
                  await this.chooseItem(path, target, btn);
                });
              }
            });
          } else {
            const path = [top, it.label];
            const skip = this.skipItem(path);
            if (skip) continue;
            await this.rec.within(null, null, async () => {
              await this.openTop(top);
              const target = this.page.locator('.menu-dropdown').first().locator(`:scope > .menu-item-wrap > .menu-item[data-label="${cssq(it.label)}"]`);
              await this.mouseHover(target);
              await this.chooseItem(path, target, btn);
            });
          }
        }
      });
    }
  }

  /** Click a menu item and deal with whatever it opened. */
  async chooseItem(path: string[], target: Locator, opener: Locator | null) {
    const label = path.join(' > ');
    this.cover('menu-items');
    const rect = await this.rectOf(target);
    const r = await this.probe(`Choose ${label}`, async () => {
      const c = await this.center(target);
      if (!c) throw new Error('item not visible');
      await this.page.mouse.click(c[0], c[1]);
    }, { label, rect, shiftCheck: true, sel: `menu ${label}` });
    const still = await this.page.locator('.menu-dropdown, .menu-submenu').count().catch(() => 0);
    if (still && !r.error) await this.rec.add('menu-close', { sel: `menu ${label}`, label, msg: `the menu stays open after choosing "${label}"`, rect });
    await this.afterAction(label, r, opener);
  }

  /** Whatever an action opened: check it and close it; then get back to the state's base. */
  async afterAction(label: string, r: ProbeResult, opener: Locator | null) {
    if (r.modalsAfter > r.modalsBefore) await this.handleDialog(label, opener);
    else if (r.popover) {
      await this.check({ root: null });
      await this.closePopover(label, r.popover);
    }
    if (r.tabAfter !== r.tabBefore) {
      await this.check({});
      this.cover('tab-switches');
    }
    await this.recover();
  }

  async closePopover(label: string, kind: string) {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);
    const still = await this.page.locator(POPOVERS).filter({ visible: true }).count().catch(() => 0);
    if (still) {
      const which = await this.page.locator(POPOVERS).filter({ visible: true }).first().getAttribute('class').catch(() => kind);
      // The assistant panel and find bars are panels, not popovers; Escape should still close them.
      await this.rec.add('focus-escape', { sel: `.${(which ?? kind).split(' ')[0]}`, label, msg: `Escape does not close the ${(which ?? kind).split(' ')[0]} opened by "${label}"`, rect: await this.rectOf(this.page.locator(POPOVERS).filter({ visible: true }).first()) });
    }
  }

  /** Narrow screens: the Menu sheet with every menu as a section. */
  async walkSheet(only: string[] | null) {
    // Looked up each time: a rebuilt state means a new page.
    const btnOf = () => this.page.locator('.menu-sheet-btn');
    const open = async () => {
      if (!(await this.page.locator('.menu-sheet').isVisible().catch(() => false))) await this.mouseClick(btnOf());
      await this.page.locator('.menu-sheet').waitFor({ state: 'visible', timeout: 3000 });
    };
    await this.rec.within('shell/menus/search/help', 'Tap the "Menu" button', async () => {
      await open();
      await this.check({ root: null });
      await this.focusChecksSheet();
      const sections = (await this.page.locator('.menu-sheet-title').allTextContents()).map((s) => s.trim());
      await this.page.keyboard.press('Escape');
      for (const sec of sections) {
        if (only && !only.includes(sec)) continue;
        if (this.outOfTime()) return;
        const area = areaForMenu(sec);
        await this.rec.within(area, `Tap the "Menu" button, then "${sec}"`, async () => {
          await open();
          const tl = this.page.locator('.menu-sheet-title', { hasText: new RegExp(`^${sec}`) });
          if ((await tl.getAttribute('aria-expanded')) !== 'true') await this.mouseClick(tl);
          await this.page.waitForTimeout(150);
          await this.check({ root: null });
          const labels = await this.page.locator('.menu-sheet-items .menu-item').evaluateAll((els) => els.map((e) => ({ label: (e.querySelector('.menu-label')?.textContent ?? '').trim(), disabled: e.getAttribute('aria-disabled') === 'true' })));
          await this.page.keyboard.press('Escape');
          // Layout depth: open a few items per section; full: all.
          const pick = this.o.depth === 'full' ? labels : labels.filter((l) => !l.disabled).slice(0, 3);
          for (const it of pick) {
            if (it.disabled || this.outOfTime()) continue;
            if (this.skipItem([sec, it.label])) continue;
            await this.rec.within(null, null, async () => {
              await open();
              const tl2 = this.page.locator('.menu-sheet-title', { hasText: new RegExp(`^${sec}`) });
              if ((await tl2.getAttribute('aria-expanded')) !== 'true') await tl2.click();
              const target = this.page.locator('.menu-sheet-items .menu-item', { has: this.page.locator('.menu-label', { hasText: new RegExp(`^${it.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).first();
              this.cover('menu-items');
              const r = await this.probe(`Tap "${sec} > ${it.label}"`, () => this.mouseClick(target), { label: `${sec} > ${it.label}`, rect: await this.rectOf(target) });
              await this.afterAction(`${sec} > ${it.label}`, r, btnOf());
            });
          }
        });
      }
    });
  }

  async focusChecksSheet() {
    for (let i = 0; i < 14; i++) {
      await this.page.keyboard.press('Tab');
      const inside = await this.page.evaluate(() => !!document.activeElement?.closest('.menu-sheet')).catch(() => true);
      if (!inside) {
        await this.rec.add('focus-trap', { sel: '.menu-sheet', label: 'Menu', msg: 'Tab moves focus out of the open Menu sheet', rect: null });
        break;
      }
    }
  }

  // ---------------------------------------------------------------- menu behaviour

  async menuBehaviour() {
    if ((await this.menubarMode()) !== 'bar') return;
    await this.rec.within('shell/menus/search/help', null, async () => {
      // Pick a menu with at least 4 enabled items.
      const tops = (await this.page.locator('.menubar-btn').allTextContents()).map((s) => s.trim());
      let top = '';
      for (const t of ['Analyze', 'Transform', 'File', 'Help', ...tops]) {
        if (!tops.includes(t)) continue;
        await this.openTop(t).catch(() => null);
        const its = await this.itemsOf(this.page.locator('.menu-dropdown').first()).catch(() => []);
        await this.page.keyboard.press('Escape');
        if (its.filter((i) => !i.disabled).length >= 4) {
          top = t;
          break;
        }
      }
      if (!top) return;
      const dd = () => this.page.locator('.menu-dropdown').first();
      const items = () => dd().locator(':scope > .menu-item-wrap > .menu-item:not([aria-disabled="true"])');

      // 1. The highlight follows the pointer, one item at a time.
      await this.rec.within(null, `Click the "${top}" menu`, async () => {
        await this.openTop(top);
        const n = Math.min(await items().count(), 6);
        for (let i = 0; i < n; i++) {
          const it = items().nth(i);
          const lab = (await it.getAttribute('data-label')) ?? '';
          await this.mouseHover(it, 8);
          await this.page.waitForTimeout(80);
          const hl = (await this.page.evaluate(highlightedMenuItems)).filter((h) => !h.startsWith(top));
          const top0 = hl.filter((h) => h !== lab && !(h.length && lab.startsWith(h)));
          if (!hl.some((h) => lab.startsWith(h) || h.startsWith(lab.slice(0, 20))) || top0.length) {
            await this.rec.add('menu-hover', { sel: `menu ${top}`, label: lab, msg: `pointer on "${lab}", but highlighted: ${hl.length ? hl.map((h) => `"${h}"`).join(', ') : 'nothing'}`, rect: await this.rectOf(dd()) });
            break;
          }
        }
        this.cover('menu-hover-checks');
        // 2. Keyboard first, then the mouse: only the item under the pointer should look active.
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('ArrowDown');
        const last = items().nth(Math.min(3, (await items().count()) - 1));
        const lab = (await last.getAttribute('data-label')) ?? '';
        await this.mouseHover(last, 8);
        await this.page.waitForTimeout(80);
        const hl = (await this.page.evaluate(highlightedMenuItems)).filter((h) => !h.startsWith(top));
        if (hl.length > 1)
          await this.rec.add('menu-hover', { sel: `menu ${top} (keyboard then mouse)`, label: top, msg: `after moving with the arrow keys and then pointing at "${lab}", ${hl.length} items look highlighted at once (${hl.map((h) => `"${h}"`).join(', ')}): the keyboard highlight does not follow the pointer`, rect: await this.rectOf(dd()) });
        // 3. Escape closes.
        this.rec.step('Press Escape');
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(120);
        if (await dd().isVisible().catch(() => false)) await this.rec.add('menu-close', { sel: `menu ${top}`, label: top, msg: 'Escape does not close the open menu', rect: null });
      });

      // 3b. A diagonal move from the menubar button to an item (the natural path) must not switch menus.
      await this.rec.within(null, `Click the "${tops[0]}" menu and move the pointer in a straight line to its first item`, async () => {
        await this.recover();
        const b0 = await this.topButton(tops[0]).boundingBox();
        await this.openTop(tops[0]);
        const first = this.page.locator('.menu-dropdown').first().locator(':scope > .menu-item-wrap > .menu-item').first();
        const fb = await first.boundingBox();
        const lab = (await first.getAttribute('data-label')) ?? '';
        if (b0 && fb) {
          await this.page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
          await this.page.mouse.move(fb.x + fb.width * 0.6, fb.y + fb.height / 2, { steps: 12 });
          this.mouseAt = [fb.x + fb.width * 0.6, fb.y + fb.height / 2];
          await this.page.waitForTimeout(100);
          const openNow = await this.page.locator('.menubar-btn[aria-expanded="true"]').textContent().catch(() => null);
          if (openNow && openNow.trim() !== tops[0])
            await this.rec.add('menu-hover', { sel: '.menubar', label: tops[0], msg: `moving the pointer diagonally from "${tops[0]}" towards its first item "${lab}" crosses the "${openNow.trim()}" button and switches to the ${openNow.trim()} menu: the item the user was heading for disappears (no hover intent / safe triangle)`, rect: await this.rectOf(this.page.locator('.menu-dropdown').first()), data: { priority: 'P2' } });
        }
        await this.recover();
      });

      // 4. Outside click closes.
      await this.rec.within(null, `Click the "${top}" menu, then click an empty part of the page`, async () => {
        await this.openTop(top);
        const vp = this.o.viewport;
        await this.moveTo(vp.width - 30, Math.round(vp.height * 0.6), 6);
        await this.page.mouse.click(vp.width - 30, Math.round(vp.height * 0.6));
        await this.page.waitForTimeout(150);
        if (await dd().isVisible().catch(() => false)) await this.rec.add('menu-close', { sel: `menu ${top}`, label: top, msg: 'clicking outside the open menu does not close it', rect: null });
        await this.recover();
      });

      // 5. Switching tabs closes it, and no hover/open state sticks afterwards.
      await this.openTop(top);
      // A tab the open dropdown does not cover (clicking through the menu would choose an item instead).
      const other = await this.page.locator('.main-tabs .tab:not([disabled])').evaluateAll((els, base) => {
        for (const e of els) {
          if (e.id === base) continue;
          const r = e.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          if (hit && (hit === e || e.contains(hit))) return e.id;
        }
        return null;
      }, `tab-${this.baseTab}`);
      await this.page.keyboard.press('Escape');
      if (other) {
        await this.rec.within(null, `Click the "${top}" menu, then click the ${other.replace('tab-', '')} tab`, async () => {
          await this.openTop(top);
          await this.mouseClick(this.page.locator(`#${other}`));
          await this.page.waitForTimeout(200);
          if (await dd().isVisible().catch(() => false)) await this.rec.add('menu-close', { sel: `menu ${top}`, label: top, msg: `clicking the ${other.replace('tab-', '')} tab leaves the "${top}" menu open`, rect: null });
          // Move across the menubar: no menu should open by hover alone, and only the hovered button highlights.
          const btns = this.page.locator('.menubar-btn');
          const nb = await btns.count();
          for (let i = 0; i < Math.min(nb, 5); i++) {
            await this.mouseHover(btns.nth(i), 5);
            await this.page.waitForTimeout(60);
          }
          const state = await this.page.evaluate(() => ({
            open: document.querySelectorAll('.menu-dropdown').length,
            lit: [...document.querySelectorAll('.menubar-btn')].filter((b) => {
              const bg = getComputedStyle(b).backgroundColor;
              return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
            }).map((b) => b.textContent),
          }));
          if (state.open) await this.rec.add('menu-hover', { sel: '.menubar', label: top, msg: `after clicking a tab, merely pointing at the menubar opens a menu again (the menubar is stuck in "open" mode)`, rect: await this.rectOf(this.page.locator('.menubar')) });
          if (state.lit.length > 1) await this.rec.add('menu-hover', { sel: '.menubar', label: top, msg: `after clicking a tab, ${state.lit.length} menubar buttons look highlighted at once (${state.lit.join(', ')})`, rect: await this.rectOf(this.page.locator('.menubar')) });
          await this.recover();
        });
      }

      // 6. Hover-switching: with one menu open, pointing at the next opens it and closes the first.
      await this.rec.within(null, `Click the "${top}" menu, then point at the next menu`, async () => {
        await this.openTop(top);
        const idx = tops.indexOf(top);
        const next = tops[(idx + 1) % tops.length];
        await this.mouseHover(this.topButton(next), 6);
        await this.page.waitForTimeout(150);
        const menus = await this.page.locator('.menu-dropdown').count();
        if (menus > 1) await this.rec.add('menu-double', { sel: '.menubar', label: top, msg: `two menus are open at once after pointing from "${top}" to "${next}"`, rect: null });
        await this.recover();
      });

      // 7. A context menu and a menubar menu at the same time.
      const grid = this.page.locator('.grid-cell').first();
      if (await grid.isVisible().catch(() => false)) {
        await this.rec.within('data', 'Right-click a cell in the Data View, then click a menubar menu', async () => {
          await this.mouseClick(grid, { button: 'right' });
          await this.page.waitForTimeout(150);
          await this.openTop(top).catch(() => undefined);
          await this.page.waitForTimeout(150);
          const both = await this.page.evaluate(() => [...document.querySelectorAll('[role=menu]')].filter((m) => !m.parentElement?.closest('[role=menu]')).length);
          if (both > 1) await this.rec.add('menu-double', { sel: '.context-menu + .menu-dropdown', label: 'context menu', msg: 'the right-click menu stays open when a menubar menu is opened: two menus at once', rect: null });
          await this.recover();
        });
      }
    });
  }

  // ---------------------------------------------------------------- toolbars, context menus

  async clickAll(scope: string, area: Area, o: { max?: number; allowInsertUndo?: boolean } = {}) {
    if (!this.want(area)) return;
    const root = this.page.locator(scope).first();
    if (!(await root.isVisible().catch(() => false))) return;
    await this.rec.within(area, null, async () => {
      await this.check({ root: scope }, { area });
      const cands = await root.evaluate((r, DANGER_SRC) => {
        const danger = new RegExp(DANGER_SRC, 'i');
        const vis = (el: Element) => (el as HTMLElement).getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
        return [...r.querySelectorAll('button, [role=button], a[href], [role=tab], [role=radio]')].filter(vis).map((el, i) => ({
          i,
          text: ((el as HTMLElement).innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 50),
          disabled: (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true',
          selected: el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-pressed') === 'true' || !!el.getAttribute('aria-current') || /(^|\s)(on|active|is-active|is-on|current)(\s|$)/.test(el.className.toString()),
          pressed: el.getAttribute('aria-pressed'),
          danger: danger.test(((el as HTMLElement).innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '')) || el.classList.contains('btn-danger') || /resize/i.test(el.getAttribute('aria-label') ?? ''),
          kind: `${el.tagName}.${[...el.classList].sort().join('.')}`,
        }));
      }, DANGER.source).catch(() => []);
      const perKind = new Map<string, number>();
      let n = 0;
      for (const c of cands) {
        if (c.disabled || c.selected || this.outOfTime()) continue;
        if (n >= (o.max ?? 30)) break;
        const insertUndo = o.allowInsertUndo && /^(Insert case above|Insert variable|Insert)$/.test(c.text);
        if (c.danger && !insertUndo) continue;
        if ((perKind.get(c.kind) ?? 0) >= 4 && !c.text) continue;
        perKind.set(c.kind, (perKind.get(c.kind) ?? 0) + 1);
        n++;
        // The same filtered list as above, so the index points at the same element.
        const handle = await root.evaluateHandle((r, i) => {
          const vis = (el: Element) => (el as HTMLElement).getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
          return [...r.querySelectorAll('button, [role=button], a[href], [role=tab], [role=radio]')].filter(vis)[i] as HTMLElement;
        }, c.i).catch(() => null);
        const eh = handle?.asElement();
        if (!eh) continue;
        const txt = ((await eh.evaluate((e) => (e as HTMLElement).innerText || e.getAttribute('aria-label') || e.getAttribute('title') || '').catch(() => '')) ?? '').replace(/\s+/g, ' ').trim().slice(0, 50);
        if (txt !== c.text) continue; // the list changed under us
        const box = await eh.boundingBox().catch(() => null);
        const rect = box ? { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } : null;
        this.cover('toolbar-buttons');
        await this.rec.within(null, null, async () => {
          const r = await this.probe(`Click "${c.text || c.kind}" (${scope})`, async () => {
            await eh.scrollIntoViewIfNeeded().catch(() => undefined);
            const b = await eh.boundingBox();
            if (!b) throw new Error('not visible');
            await this.moveTo(b.x + b.width / 2, b.y + b.height / 2, 4);
            await this.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
          }, { label: c.text || c.kind, rect, shiftCheck: true, sel: `${scope} "${c.text}"` });
          if (r.menusAfter) {
            await this.check({ root: null });
            await this.page.keyboard.press('Escape');
          }
          if (insertUndo && (await this.sig()) !== this.baseSig) {
            this.rec.step('Press Ctrl+Z');
            await this.page.locator('.grid-scroll, .vv-scroll').first().focus().catch(() => undefined);
            await this.page.keyboard.press('Control+z');
            await this.page.waitForTimeout(250);
            if ((await this.sig()) !== this.baseSig) await this.rec.add('flow', { sel: `${scope} "${c.text}"`, label: c.text, msg: `after "${c.text}", Ctrl+Z does not undo it (dataset size stays changed)`, rect, area, data: { priority: 'P1' } });
          } else if (c.pressed !== null && c.pressed !== undefined && !r.modalsAfter && !r.popover) {
            // A toggle: put it back.
            await eh.click({ timeout: 1500 }).catch(() => undefined);
          }
          await this.afterAction(c.text, r, null);
        });
      }
    });
  }

  async contextMenus() {
    const targets: Array<{ sel: string; name: string; area: Area }> = [
      { sel: '.grid-cell[data-r="1"][data-c="2"]', name: 'a Data View cell', area: 'data' },
      { sel: '.grid-hcell[data-hc="3"]', name: 'a Data View column header', area: 'data' },
      { sel: '.grid-rownum >> nth=2', name: 'a Data View row number', area: 'data' },
      { sel: '.vv-row[data-vr="2"] .vv-label', name: 'a Variable View row', area: 'variables' },
    ];
    for (const t of targets) {
      if (!this.want(t.area) || this.outOfTime()) continue;
      if (t.area === 'variables' && this.baseTab !== 'variables') {
        if (!(await this.page.locator('#tab-variables').isEnabled().catch(() => false))) continue;
        await this.page.locator('#tab-variables').click();
        await this.page.waitForTimeout(250);
      }
      const el = this.page.locator(t.sel).first();
      if (!(await el.isVisible().catch(() => false))) continue;
      await this.rec.within(t.area, t.area === 'variables' ? 'Click the "Variable View" tab' : null, async () => {
        const open = async () => {
          if (t.area === 'variables' && (await this.currentTab()) !== 'variables') await this.page.locator('#tab-variables').click();
          await this.mouseClick(this.page.locator(t.sel).first(), { button: 'right' });
          await this.page.locator('.context-menu').waitFor({ state: 'visible', timeout: 2000 });
        };
        this.rec.step(`Right-click ${t.name}`);
        try {
          await open();
        } catch {
          await this.rec.add('dead-control', { sel: t.sel, label: t.name, msg: `right-clicking ${t.name} opens no context menu`, rect: await this.rectOf(el) });
          return;
        }
        this.cover('context-menus');
        await this.check({ root: null });
        const items = await this.itemsOf(this.page.locator('.context-menu [role=menu]').first()).catch(() => []);
        // Esc and outside click close it.
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(120);
        if (await this.page.locator('.context-menu').isVisible().catch(() => false)) {
          await this.rec.add('menu-close', { sel: '.context-menu', label: t.name, msg: `Escape does not close the right-click menu of ${t.name}`, rect: null });
          await this.page.mouse.click(5, this.o.viewport.height - 5);
        }
        for (const it of items) {
          if (it.disabled || it.sub || this.outOfTime()) continue;
          if (DANGER.test(it.label) && !/^(Insert|Copy|Sort|Find|Go to|Show)/.test(it.label)) continue;
          if (/^(Cut|Paste|Clear)/.test(it.label)) continue;
          await this.rec.within(null, null, async () => {
            await open();
            const target = this.page.locator(`.context-menu .menu-item[data-label="${cssq(it.label)}"]`).first();
            await this.mouseHover(target);
            this.cover('menu-items');
            const rect = await this.rectOf(target);
            const r = await this.probe(`Choose "${it.label}"`, async () => {
              const c = await this.center(target);
              if (!c) throw new Error('not visible');
              await this.page.mouse.click(c[0], c[1]);
            }, { label: `${t.name} > ${it.label}`, rect });
            if (await this.page.locator('.context-menu').isVisible().catch(() => false)) await this.rec.add('menu-close', { sel: '.context-menu', label: it.label, msg: `the right-click menu stays open after choosing "${it.label}"`, rect });
            if ((await this.sig()) !== this.baseSig && /^Insert/.test(it.label)) {
              await this.page.keyboard.press('Control+z');
              await this.page.waitForTimeout(200);
            }
            await this.afterAction(it.label, r, null);
            if (t.area === 'variables' && (await this.currentTab()) !== 'variables' && this.baseTab !== 'variables') await this.page.locator('#tab-variables').click().catch(() => undefined);
          });
        }
      });
      await this.recover();
    }
  }

  // ---------------------------------------------------------------- search, AI, assistant, help

  async palette() {
    if (!this.want('shell/menus/search/help')) return;
    await this.rec.within('shell/menus/search/help', null, async () => {
      this.cover('palette');
      const r = await this.probe('Press Ctrl+K', () => this.page.keyboard.press('Control+k'), { label: 'Ctrl+K', shiftCheck: true });
      const pal = this.page.locator('.palette');
      if (!(await pal.isVisible().catch(() => false))) {
        await this.rec.add('dead-control', { sel: 'Ctrl+K', label: 'Ctrl+K', msg: 'Ctrl+K does not open search', rect: null, noShot: true });
        return;
      }
      void r;
      await this.check({ root: '.palette' });
      const input = pal.locator('input').first();
      for (const q of ['freq', 'age', 'weight', 'crosstab', 'how do I recode', 'trust', 'zzzqqq']) {
        await this.rec.within(null, `Type "${q}"`, async () => {
          await input.fill('');
          const t0 = Date.now();
          await input.pressSequentially(q, { delay: 20 });
          await this.page.waitForTimeout(250);
          const ms = Date.now() - t0 - q.length * 20;
          const res = await pal.locator('[role=option]').count();
          const empty = await pal.evaluate((p) => (p.textContent ?? '').trim().length);
          if (!res && q !== 'zzzqqq') await this.rec.add('flow', { sel: '.palette', label: q, msg: `search for "${q}" finds nothing`, rect: await this.rectOf(pal), data: { priority: 'P1' } });
          if (!res && q === 'zzzqqq' && empty < 30) await this.rec.add('flow', { sel: '.palette', label: q, msg: 'a search with no matches shows no "nothing found" message', rect: await this.rectOf(pal), data: { priority: 'P2' } });
          if (ms > 1000) await this.rec.add('slow', { sel: '.palette', label: q, msg: `search results for "${q}" took ${ms}ms`, rect: null, data: { ms } });
          await this.check({ root: '.palette' });
          if (res > 1) {
            const sel0 = await pal.locator('[role=option][aria-selected="true"]').textContent().catch(() => null);
            await this.page.keyboard.press('ArrowDown');
            const sel1 = await pal.locator('[role=option][aria-selected="true"]').textContent().catch(() => null);
            if (sel0 === sel1) await this.rec.add('flow', { sel: '.palette', label: q, msg: 'ArrowDown does not move the highlighted search result', rect: await this.rectOf(pal), data: { priority: 'P1' } });
            // Hover follows the pointer too.
            const opt = pal.locator('[role=option]').nth(Math.min(2, res - 1));
            await this.mouseHover(opt, 5);
            await this.page.waitForTimeout(60);
            const lit = await pal.evaluate((p) => [...p.querySelectorAll('[role=option]')].filter((o) => {
              const bg = getComputedStyle(o).backgroundColor;
              return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
            }).length);
            if (lit > 1) await this.rec.add('menu-hover', { sel: '.palette [role=option]', label: q, msg: `in search results, ${lit} rows look highlighted when pointing at one (keyboard highlight and hover highlight disagree)`, rect: await this.rectOf(pal) });
          }
        });
      }
      // Enter runs the top command.
      await input.fill('frequencies');
      await this.page.waitForTimeout(250);
      const rr = await this.probe('Type "frequencies" and press Enter', () => this.page.keyboard.press('Enter'), { label: 'Enter in search' });
      if (rr.modalsAfter > 0) await this.handleDialog('search > frequencies', null);
      else if (await pal.isVisible().catch(() => false)) {
        await this.page.keyboard.press('Escape');
      }
      await this.recover();
      // The search box in the top bar opens it too, and Escape gives focus back to it.
      const sb = this.page.locator('.topbar-search:visible, .topbar-search-btn:visible').first();
      if (await sb.isVisible().catch(() => false)) {
        await this.rec.within(null, null, async () => {
          const r2 = await this.probe('Click the "Search Socius" box in the top bar', () => this.mouseClick(sb), { label: 'Search Socius', rect: await this.rectOf(sb) });
          if (await pal.isVisible().catch(() => false)) {
            this.rec.step('Press Escape');
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(150);
            if (await pal.isVisible().catch(() => false)) await this.rec.add('focus-escape', { sel: '.palette', label: 'Search', msg: 'Escape does not close search', rect: null });
            const back = await sb.evaluate((b) => b === document.activeElement).catch(() => false);
            if (!back) {
              const f = await this.page.evaluate(focusInfo);
              await this.rec.add('focus-return', { sel: '.palette', label: 'Search', msg: `after closing search with Escape, focus goes to ${f.body ? 'the page body' : f.sel} instead of the search box that opened it`, rect: null, noShot: true });
            }
          }
          void r2;
        });
      }
      await this.recover();
    });
  }

  async aiChip() {
    if (!this.want('AI/assistant')) return;
    const chip = this.page.locator('.ai-chip');
    if (!(await chip.isVisible().catch(() => false))) return;
    await this.rec.within('AI/assistant', null, async () => {
      this.cover('ai-chip');
      const r = await this.probe('Click the "AI" chip in the top bar', () => this.mouseClick(chip), { label: 'AI chip', rect: await this.rectOf(chip), shiftCheck: true });
      if (!r.popover) return;
      await this.check({ root: '.ai-pop' });
      await this.check({ root: null, contrast: false, overflow: false });
      const items = await this.page.locator('.ai-pop button').evaluateAll((els) => els.map((e) => (e as HTMLElement).innerText.split('\n')[0].trim()));
      // Escape and outside click.
      this.rec.step('Press Escape');
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(150);
      if (await this.page.locator('.ai-pop').isVisible().catch(() => false)) await this.rec.add('menu-close', { sel: '.ai-pop', label: 'AI chip', msg: 'Escape does not close the AI popover', rect: null });
      for (const it of items) {
        if (this.outOfTime()) break;
        await this.rec.within(null, null, async () => {
          if (!(await this.page.locator('.ai-pop').isVisible().catch(() => false))) await this.mouseClick(chip);
          const b = this.page.locator('.ai-pop button', { hasText: it }).first();
          const rr = await this.probe(`In the AI popover, click "${it}"`, () => this.mouseClick(b), { label: it, rect: await this.rectOf(b) });
          await this.afterAction(it, rr, chip);
        });
      }
    });
  }

  async assistant() {
    if (!this.want('AI/assistant')) return;
    await this.rec.within('AI/assistant', null, async () => {
      this.cover('assistant');
      await this.page.locator('body').click({ position: { x: 3, y: this.o.viewport.height - 3 } }).catch(() => undefined);
      const r = await this.probe('Press Ctrl+J', () => this.page.keyboard.press('Control+j'), { label: 'Ctrl+J', shiftCheck: true });
      const panel = this.page.locator('.as-panel');
      if (!(await panel.isVisible().catch(() => false))) {
        await this.rec.add('dead-control', { sel: 'Ctrl+J', label: 'Ctrl+J', msg: `Ctrl+J does not open the assistant (state ${this.o.state})`, rect: null });
        return;
      }
      void r;
      await this.page.waitForTimeout(300);
      await this.check({ root: '.as-panel' });
      await this.check({ root: null, contrast: false, overflow: false, hscroll: true });
      // Buttons in the panel.
      await this.clickAll('.as-panel', 'AI/assistant', { max: 10 });
      if (!(await panel.isVisible().catch(() => false))) {
        await this.page.keyboard.press('Control+j');
        await this.page.waitForTimeout(200);
      }
      // Type a question and send: AI is not set up here, so the panel must say how to set it up.
      const box = panel.locator('textarea, input[type=text]').first();
      if (await box.isVisible().catch(() => false)) {
        await box.fill('What test should I use to compare life satisfaction between migrants and non-migrants?');
        const send = panel.locator('button[aria-label="Send"]');
        const rr = await this.probe('Type a question in the assistant and click Send', () => this.mouseClick(send), { label: 'Send', rect: await this.rectOf(send) });
        await this.page.waitForTimeout(600);
        await this.check({ root: '.as-panel' });
        if (rr.modalsAfter > rr.modalsBefore) await this.handleDialog('assistant send', send);
      }
      this.rec.step('Press Escape');
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(200);
      if (await panel.isVisible().catch(() => false)) {
        // Escape may need focus inside the panel.
        await panel.locator('button').first().focus().catch(() => undefined);
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(200);
        if (await panel.isVisible().catch(() => false)) await this.rec.add('focus-escape', { sel: '.as-panel', label: 'Assistant', msg: 'Escape does not close the assistant panel', rect: null });
      }
      // The floating button.
      const fab = this.page.locator('.as-fab');
      if (await fab.isVisible().catch(() => false)) {
        const r2 = await this.probe('Click the round assistant button (bottom right)', () => this.mouseClick(fab), { label: 'assistant button', rect: await this.rectOf(fab) });
        void r2;
        await this.page.locator('.as-panel button[aria-label="Close assistant"]').click({ timeout: 2000 }).catch(() => undefined);
        await this.page.waitForTimeout(200);
        const back = await fab.evaluate((b) => b === document.activeElement).catch(() => false);
        if (!back) {
          const f = await this.page.evaluate(focusInfo);
          if (f.body) await this.rec.add('focus-return', { sel: '.as-panel', label: 'Assistant', msg: 'after closing the assistant with its Close button, focus falls to the page body instead of the assistant button', rect: null, noShot: true });
        }
      }
      await this.recover();
    });
  }

  async outputActions() {
    if (!this.want('output') && !this.want('charts')) return;
    if ((await this.currentTab()) !== 'output') await this.page.locator('#tab-output').click().catch(() => undefined);
    await this.page.waitForTimeout(300);
    await this.rec.within('output', this.baseTab === 'output' ? null : 'Click the "Output" tab', async () => {
      await this.check({});
      await this.clickAll('.ov-toolbar', 'output', { max: 12 });
      const arts = this.page.locator('.ov-doc article');
      const n = Math.min(await arts.count(), this.o.depth === 'full' ? 5 : 2);
      for (let i = 0; i < n && !this.outOfTime(); i++) {
        const art = arts.nth(i);
        await art.scrollIntoViewIfNeeded().catch(() => undefined);
        const hasChart = await art.locator('svg.chart, .chart, svg').count().catch(() => 0);
        const area: Area = hasChart ? 'charts' : 'output';
        const title = ((await art.locator('h2, h3, .oi-title').first().textContent().catch(() => '')) ?? '').trim().slice(0, 40);
        await this.rec.within(area, `In Output, go to result ${i + 1} ("${title}")`, async () => {
          await this.check({ root: null }, { area });
          await this.clickAll(`.ov-doc article:nth-of-type(${i + 1})`, area, { max: this.o.depth === 'full' ? 16 : 6 });
        });
      }
    });
    await this.recover();
  }

  async codingViews() {
    if (!this.want('text coding')) return;
    if (this.o.state !== 'coding') return;
    await this.rec.within('text coding', null, async () => {
      const tabs = this.page.locator('.cw-viewtabs [role=tab]');
      const labels = (await tabs.allTextContents()).map((t) => t.replace(/[\d,]+$/, '').trim());
      for (const lab of labels) {
        if (this.outOfTime()) return;
        await this.rec.within(null, null, async () => {
          const t = this.page.locator('.cw-viewtabs [role=tab]', { hasText: lab }).first();
          this.cover('coding-views');
          const r = await this.probe(`In Text coding, click the "${lab}" view`, () => this.mouseClick(t), { label: lab, rect: await this.rectOf(t), expectEffect: (await t.getAttribute('aria-selected')) !== 'true' });
          void r;
          if ((await t.getAttribute('aria-selected').catch(() => null)) !== 'true') {
            const now = ((await this.page.locator('.cw-viewtabs [role=tab][aria-selected="true"]').textContent().catch(() => '')) ?? '').trim();
            await this.rec.add('dead-control', { sel: '.cw-viewtabs [role=tab]', label: lab, msg: `clicking the "${lab}" view tab does not open it: the selection jumps back to "${now}" with no explanation`, rect: await this.rectOf(t), title: `Text coding: the "${lab}" tab cannot be opened` });
          }
          await this.check({});
          // Sub-tabs (Analyse).
          const sub = this.page.locator('.cw-main [role=tab], .cw-analyse [role=tab]');
          const ns = await sub.count().catch(() => 0);
          for (let i = 0; i < ns && i < 8; i++) {
            const st = sub.nth(i);
            const sl = ((await st.textContent()) ?? '').trim();
            if ((await st.getAttribute('aria-selected')) === 'true') continue;
            await this.probe(`Click the "${sl}" tab`, () => this.mouseClick(st), { label: sl, rect: await this.rectOf(st) });
            await this.check({});
          }
          if (this.o.depth === 'full') {
            await this.clickAll('.cw-main', 'text coding', { max: 14 });
          }
        });
      }
      await this.clickAll('.cw-toolbar', 'text coding', { max: 14 });
    });
    await this.recover();
  }

  /** Tab through the page from the top: every stop must show where focus is. */
  async pageFocusRing() {
    await this.rec.within(null, 'Press Tab repeatedly from the top of the page', async () => {
      await this.page.mouse.click(2, this.o.viewport.height - 2).catch(() => undefined);
      await this.page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      const seen = new Set<string>();
      for (let i = 0; i < 30; i++) {
        await this.page.keyboard.press('Tab');
        const f = await this.page.evaluate(focusInfo).catch(() => null);
        if (!f || f.body) continue;
        if (seen.has(f.sel + f.label)) continue;
        seen.add(f.sel + f.label);
        if (f.visibleRing === false) {
          const area: Area = /grid|vv-/.test(f.sel) ? 'data' : /cw-/.test(f.sel) ? 'text coding' : /ov-|oi-/.test(f.sel) ? 'output' : 'shell/menus/search/help';
          await this.rec.add('focus-ring', { sel: f.sel, label: f.label, msg: `"${f.label || f.sel}" receives keyboard focus (Tab stop ${i + 1}) with no visible focus indicator`, rect: f.rect, area });
        }
      }
      this.cover('focus-ring-stops', seen.size);
    });
    await this.recover();
  }
}

export function areaForMenu(top: string): Area {
  switch (top) {
    case 'Data':
    case 'Transform':
      return 'transforms';
    case 'Analyze':
      return 'analysis dialogs';
    case 'Graphs':
      return 'charts';
    case 'Text coding':
      return 'text coding';
    case 'AI':
      return 'AI/assistant';
    case 'Edit':
    case 'View':
      return 'shell/menus/search/help';
    case 'File':
      return 'data';
    default:
      return 'shell/menus/search/help';
  }
}

function cssq(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
