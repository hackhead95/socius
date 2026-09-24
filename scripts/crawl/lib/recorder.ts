// Findings: what the crawler records, where, and how it names screenshots.
// Each worker appends findings to <out>/raw/<test>.jsonl; scripts/crawl/report.mjs merges them.
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import type { RawIssue } from './checks';

export type Area =
  | 'data' | 'variables' | 'transforms' | 'analysis dialogs' | 'output' | 'charts' | 'text coding'
  | 'AI/assistant' | 'shell/menus/search/help' | 'mobile' | 'theme';
export type Priority = 'P0' | 'P1' | 'P2';

export interface Finding {
  key: string;
  rule: string;
  priority: Priority;
  area: Area;
  title: string;
  detail: string;
  selector: string;
  label: string;
  state: string;
  viewport: string;
  theme: string;
  steps: string[];
  screenshot: string | null;
  at: string;
  data?: Record<string, unknown>;
}

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const OUT = process.env.CRAWL_OUT || '/tmp/crawl/out';
export const SHOTS = join(ROOT, 'docs', 'qa', 'shots');

/** Replace volatile bits (numbers, ids) so the same bug in different places has one key. */
export function normalise(s: string): string {
  return s
    .replace(/\d+(\.\d+)?/g, '#')
    .replace(/"[^"]{20,}"/g, '"…"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

export function keyFor(rule: string, area: string, selector: string, msg: string): string {
  // (msg is reassigned below for layer occlusion)
  const sel = selector.replace(/:nth-[^ >]+/g, '').replace(/\[data-[a-z]+="?\d+"?\]/g, '');
  // Contrast/overflow: the message carries the numbers; the colours matter, the pixel counts do not.
  // Occlusion by a layer (assistant panel, toast): one bug whatever it happens to cover.
  if (rule === 'occluded' && / covers \d+ control/.test(msg)) msg = msg.replace(/ covers \d+ control.*$/, ' covers controls');
  const m = rule === 'contrast' ? msg.replace(/^text contrast [\d.]+:1 /, '') : rule.startsWith('overflow') || rule === 'overlap' || rule === 'hscroll' || rule === 'dialog-oversize' || rule === 'popup-offscreen' || rule === 'slow' ? '' : msg;
  return createHash('sha1').update([rule, area, normalise(sel), normalise(m)].join('|')).digest('hex').slice(0, 10);
}

const RULE_PRIORITY: Record<string, Priority> = {
  pageerror: 'P0',
  'dialog-oversize': 'P1',
  'focus-escape': 'P1',
  'focus-trap': 'P1',
  'focus-return': 'P1',
  'focus-initial': 'P2',
  'focus-ring': 'P2',
  'menu-close': 'P1',
  'menu-hover': 'P1',
  'menu-double': 'P1',
  'dead-control': 'P1',
  occluded: 'P1',
  overlap: 'P2',
  hscroll: 'P1',
  'overflow-button': 'P2',
  'overflow-text': 'P2',
  contrast: 'P2',
  'disabled-no-reason': 'P2',
  'popup-offscreen': 'P1',
  'console-error': 'P1',
  'console-warning': 'P2',
  'react-warning': 'P1',
  network: 'P1',
  slow: 'P2',
  'layout-shift': 'P2',
  'flow': 'P1',
  'owner-report': 'P1',
};

export function priorityFor(rule: string, data?: Record<string, unknown>): Priority {
  if (rule === 'contrast' && typeof data?.ratio === 'number' && data.ratio < 2) return 'P1';
  if (rule === 'dialog-oversize' && data?.footerOff && !data?.scrollable) return 'P0';
  if (rule === 'slow' && typeof data?.ms === 'number' && data.ms > 3000) return 'P1';
  if (rule === 'hscroll' && typeof data?.viewport === 'number' && (data.scrollWidth as number) - data.viewport < 8) return 'P2';
  if (rule === 'flow' || rule === 'owner-report') return (data?.priority as Priority) ?? 'P1';
  return RULE_PRIORITY[rule] ?? 'P2';
}

const RULE_TITLE: Record<string, string> = {
  pageerror: 'Uncaught error in the page',
  'console-error': 'Console error',
  'console-warning': 'Console warning',
  'react-warning': 'React warning',
  network: 'Network request failed',
  hscroll: 'Page scrolls horizontally',
  'overflow-text': 'Text is clipped',
  'overflow-button': 'Button label does not fit',
  overlap: 'Interactive elements overlap',
  occluded: 'Control covered by another element',
  contrast: 'Low text contrast',
  'disabled-no-reason': 'Disabled item does not say why',
  'dialog-oversize': 'Dialog does not fit the viewport',
  'popup-offscreen': 'Popup extends off-screen',
  'focus-trap': 'Dialog does not keep keyboard focus inside',
  'focus-escape': 'Escape does not close the top dialog',
  'focus-return': 'Focus is lost after closing',
  'focus-initial': 'Focus does not move into the dialog',
  'focus-ring': 'No visible focus indicator',
  'menu-close': 'Menu does not close',
  'menu-hover': 'Menu highlight does not follow the pointer',
  'menu-double': 'Two menus open at once',
  'dead-control': 'Control does nothing when clicked',
  slow: 'Slow response to a click',
  'layout-shift': 'Layout shifts when something opens',
  flow: 'Broken flow',
  'owner-report': 'Owner report',
};

/** For layout findings the element tells the area better than the step that happened to show it. */
export function areaFromSelector(sel: string, fallback: Area): Area {
  if (/\.modal|role=dialog/.test(sel)) return fallback;
  if (/\bas-|ai-chip|ai-pop/.test(sel)) return 'AI/assistant';
  if (/chart/.test(sel)) return 'charts';
  if (/\b(ov-|oi-|ob-)/.test(sel)) return 'output';
  if (/\bcw-/.test(sel)) return 'text coding';
  if (/\bvv-|varview/.test(sel)) return 'variables';
  if (/grid|dataview|view-toolbar|sidebar|datasetbar|welcome|sample-banner/.test(sel)) return 'data';
  if (/menubar|menu-dropdown|menu-sheet|topbar|palette|tabbar|toast/.test(sel)) return 'shell/menus/search/help';
  return fallback;
}
const LAYOUT_RULES = new Set(['contrast', 'overflow-text', 'overflow-button', 'overlap', 'occluded', 'disabled-no-reason', 'focus-ring', 'popup-offscreen']);

export class Recorder {
  readonly file: string;
  private shotsTaken = new Set<string>();
  steps: string[] = [];
  area: Area = 'shell/menus/search/help';
  constructor(
    public page: Page,
    readonly ctx: { state: string; viewport: string; theme: string; test: string },
  ) {
    mkdirSync(join(OUT, 'raw'), { recursive: true });
    mkdirSync(SHOTS, { recursive: true });
    this.file = join(OUT, 'raw', `${ctx.test.replace(/[^a-z0-9_-]+/gi, '_')}.jsonl`);
  }

  step(s: string) {
    this.steps.push(s);
    if (this.steps.length > 40) this.steps.splice(2, this.steps.length - 40);
  }

  /** Run fn with extra breadcrumb steps and an area; the breadcrumb is restored afterwards. */
  async within<T>(area: Area | null, step: string | null, fn: () => Promise<T>): Promise<T> {
    const saved = this.steps.length;
    const prevArea = this.area;
    if (area) this.area = area;
    if (step) this.step(step);
    try {
      return await fn();
    } finally {
      this.steps.length = Math.min(this.steps.length, saved);
      this.area = prevArea;
    }
  }

  async add(rule: string, issue: Omit<RawIssue, 'rule'> & { title?: string; area?: Area; priority?: Priority; noShot?: boolean }): Promise<Finding> {
    const mobile = this.ctx.viewport.startsWith('400x') && ['hscroll', 'overflow-text', 'overflow-button', 'overlap', 'dialog-oversize', 'popup-offscreen', 'occluded'].includes(rule);
    const area = issue.area ?? (mobile ? 'mobile' : LAYOUT_RULES.has(rule) ? areaFromSelector(issue.sel, this.area) : this.area);
    const key = keyFor(rule, area, issue.sel, issue.msg);
    const f: Finding = {
      key,
      rule,
      priority: issue.priority ?? priorityFor(rule, issue.data),
      area,
      title: issue.title ?? `${RULE_TITLE[rule] ?? rule}${issue.label ? `: ${issue.label}` : ''}`,
      detail: issue.msg,
      selector: issue.sel,
      label: issue.label,
      state: this.ctx.state,
      viewport: this.ctx.viewport,
      theme: this.ctx.theme,
      steps: [...this.steps],
      screenshot: null,
      at: new Date().toISOString(),
      data: issue.data,
    };
    if (!issue.noShot && !this.shotsTaken.has(key)) {
      this.shotsTaken.add(key);
      f.screenshot = await this.shot(key, issue.rect);
    }
    appendFileSync(this.file, JSON.stringify(f) + '\n');
    return f;
  }

  /** A small JPEG around the problem (or the top of the viewport), under docs/qa/shots/. */
  async shot(key: string, rect: RawIssue['rect']): Promise<string | null> {
    const name = `c-${key}.jpg`;
    const file = join(SHOTS, name);
    try {
      const vp = this.page.viewportSize() ?? { width: 1280, height: 800 };
      let clip: { x: number; y: number; width: number; height: number };
      if (rect && rect.width > 0 && rect.height > 0) {
        const pad = 60;
        const x = Math.max(0, rect.x - pad);
        const y = Math.max(0, rect.y - pad);
        const width = Math.min(vp.width - x, Math.max(rect.width + 2 * pad, 240), 800);
        const height = Math.min(vp.height - y, Math.max(rect.height + 2 * pad, 120), 500);
        clip = { x, y, width: Math.max(40, width), height: Math.max(40, height) };
      } else clip = { x: 0, y: 0, width: Math.min(vp.width, 800), height: Math.min(vp.height, 500) };
      // Outline the element so it is easy to spot.
      if (rect)
        await this.page.evaluate((r) => {
          const d = document.createElement('div');
          d.id = '__crawl_outline';
          Object.assign(d.style, { position: 'fixed', left: `${r.x - 2}px`, top: `${r.y - 2}px`, width: `${r.width + 4}px`, height: `${r.height + 4}px`, outline: '2px dashed #e0115f', zIndex: '2147483647', pointerEvents: 'none' });
          document.body.appendChild(d);
        }, rect).catch(() => undefined);
      await this.page.screenshot({ path: file, type: 'jpeg', quality: 65, clip, animations: 'disabled', timeout: 5000 });
      await this.page.evaluate(() => document.getElementById('__crawl_outline')?.remove()).catch(() => undefined);
      return `docs/qa/shots/${name}`;
    } catch {
      return null;
    }
  }
}
