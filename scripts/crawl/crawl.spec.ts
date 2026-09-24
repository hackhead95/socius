// Socius UI crawler. Not part of the normal e2e suite: run it with
//   node scripts/crawl/run.mjs [--area output] [--state sample] [--viewport 1440x900] [--theme dark] [--quick]
// (or npx playwright test -c scripts/crawl/playwright.crawl.config.ts). One test per state × viewport ×
// theme. Findings go to $CRAWL_OUT/raw/*.jsonl; scripts/crawl/report.mjs turns them into
// docs/qa/crawl-report.json and docs/qa/CRAWL-FINDINGS.md.
import { test } from '@playwright/test';
import { Crawler, type Depth } from './lib/explore';
import { STATES, type StateId } from './lib/states';
import { aiSettings, homeButton, menuHoverAfterTab, renameVariable, themeToggle } from './lib/scenarios';

const ALL_VIEWPORTS = ['1440x900', '1280x800', '1024x768', '768x1024', '400x800'];
const ALL_STATES: StateId[] = ['first-visit', 'sample', 'analyses', 'coding', 'weighted'];
const ALL_THEMES = ['light', 'dark'] as const;

const list = (env: string | undefined, all: readonly string[]) => (env ? env.split(',').map((s) => s.trim()).filter((s) => all.includes(s)) : [...all]);
const states = list(process.env.CRAWL_STATES, ALL_STATES) as StateId[];
const viewports = list(process.env.CRAWL_VIEWPORTS, ALL_VIEWPORTS);
const themes = list(process.env.CRAWL_THEMES, ALL_THEMES) as Array<'light' | 'dark'>;
const areas = process.env.CRAWL_AREAS ? new Set(process.env.CRAWL_AREAS.split(',').map((s) => s.trim())) : null;
const quick = process.env.CRAWL_QUICK === '1';
const budgetMin = Number(process.env.CRAWL_BUDGET_MIN || 25);

/** Which menus the walk opens in each state (the rest is covered by other states). */
const MENUS: Record<StateId, string[] | null> = {
  'first-visit': null,
  sample: null,
  analyses: ['File', 'Edit', 'View', 'AI', 'Help'],
  coding: ['Text coding', 'AI', 'View'],
  weighted: ['Data', 'Analyze', 'Graphs'],
};

function depthFor(vp: string, theme: string): Depth {
  if (process.env.CRAWL_DEPTH === 'full' || process.env.CRAWL_DEPTH === 'layout') return process.env.CRAWL_DEPTH;
  if (quick) return 'layout';
  return vp === '1440x900' && theme === 'light' ? 'full' : 'layout';
}

test.describe.configure({ mode: 'parallel' });

for (const state of states) {
  for (const vp of viewports) {
    for (const theme of themes) {
      const [w, h] = vp.split('x').map(Number);
      test(`${state} @ ${vp} ${theme}`, async ({ browser, baseURL }) => {
        const depth = depthFor(vp, theme);
        test.setTimeout((budgetMin + 6) * 60_000);
        const c = new Crawler(browser, { baseURL: baseURL!.replace(/\/?$/, '/'), state, viewport: { width: w, height: h }, theme, depth, areas, budgetMs: budgetMin * 60_000, project: test.info().project.name });
        await c.build();
        const want = (a: string) => !areas || areas.has(a);
        const main = depth === 'full' || vp === '1440x900';
        try {
          // First look: the state as it opens.
          await c.check({});
          if (w <= 768 && want('mobile')) c.rec.area = 'mobile';
          const S = (n: string, f: () => Promise<unknown>) => c.safe(n, f);
          // Owner reports (once per state, at the first viewport of the run and at phone width).
          if (theme === 'light' && (vp === viewports[0] || vp === '400x800')) {
            if (state === 'sample' && want('variables')) {
              await S('rename', () => renameVariable(c));
              await S('rebuild', () => c.forceRebuild());
            }
            if (state === 'sample' && want('shell/menus/search/help')) await S('home', () => homeButton(c));
            if ((state === 'sample' || state === 'first-visit') && want('shell/menus/search/help')) await S('menu-hover-after-tab', () => menuHoverAfterTab(c));
            if (state === 'first-visit' && want('AI/assistant')) await S('ai-settings', () => aiSettings(c));
          }
          if (want('shell/menus/search/help') && state !== 'coding') await S('menu-behaviour', () => c.menuBehaviour());
          await S('menus', () => c.walkMenus(quick ? (MENUS[state] ?? ['File', 'Edit', 'View', 'Help']).slice(0, 3) : MENUS[state]));
          await S('topbar', () => c.clickAll('.topbar-right', 'shell/menus/search/help', { max: 8 }));
          await S('datasetbar', () => c.clickAll('.datasetbar', state === 'weighted' ? 'transforms' : 'data', { max: 6 }));
          if (state === 'sample' || state === 'weighted') {
            await S('data-toolbar', () => c.clickAll('.view-toolbar', 'data', { max: 20, allowInsertUndo: true }));
            await S('sidebar', () => c.clickAll('.sidebar', 'data', { max: 8 }));
            if (main) await S('context-menus', () => c.contextMenus());
          }
          if (state === 'first-visit') await S('welcome', () => c.clickAll('.welcome', 'data', { max: 6 }));
          if (state === 'analyses') await S('output', () => c.outputActions());
          if (state === 'coding') await S('coding', () => c.codingViews());
          if (main || state === 'first-visit') {
            await S('palette', () => c.palette());
            await S('ai-chip', () => c.aiChip());
            await S('assistant', () => c.assistant());
          }
          if (main) await S('focus-ring', () => c.pageFocusRing());
          if (state === 'sample' && want('theme') && vp === viewports[0]) await S('theme', () => themeToggle(c));
        } finally {
          await c.flushConsole();
          c.writeCoverage();
          await c.context?.close().catch(() => undefined);
        }
        void STATES;
      });
    }
  }
}
