// Init script injected into every crawled page, before the app runs. It:
//  - records "effects" that are not DOM changes (file pickers, downloads, new tabs, clipboard writes),
//    and stops them from actually happening (no OS file dialog, no new tab, no file saved);
//  - counts DOM mutations, so a click that changes nothing can be detected (dead control);
//  - times the first DOM response after each pointer/keyboard input (slow interactions);
//  - collects long tasks and layout shifts.
// Everything is kept on window.__crawl and read back by the crawler with page.evaluate.

export interface CrawlEffect {
  kind: 'filepicker' | 'download' | 'popup' | 'clipboard' | 'savepicker' | 'print';
  detail: string;
  t: number;
}

export function instrument(opts: { theme?: string | null }): void {
  const w = window as any;
  if (w.__crawl) return;
  try {
    if (opts.theme === 'light' || opts.theme === 'dark') localStorage.setItem('socius.theme', opts.theme);
  } catch {
    /* storage blocked */
  }
  const state = {
    effects: [] as CrawlEffect[],
    mutations: 0,
    lastMutationAt: 0,
    inputAt: 0,
    firstResponseAt: 0,
    longTasks: [] as Array<{ t: number; d: number }>,
    shifts: [] as Array<{ t: number; v: number; recent: boolean; nodes: string[] }>,
    allowFile: false,
  };
  w.__crawl = state;
  const now = () => performance.now();
  const eff = (kind: CrawlEffect['kind'], detail: string) => state.effects.push({ kind, detail: String(detail).slice(0, 200), t: now() });

  // File pickers: <input type=file>.click() and the File System Access API.
  const inputClick = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function (this: HTMLInputElement) {
    if (this.type === 'file' && !state.allowFile) {
      eff('filepicker', this.accept || 'any');
      return;
    }
    return inputClick.call(this);
  };
  const reject = (kind: CrawlEffect['kind']) => (o?: unknown) => {
    eff(kind, JSON.stringify(o ?? {}).slice(0, 120));
    return Promise.reject(new DOMException('The user aborted a request.', 'AbortError'));
  };
  w.showOpenFilePicker = reject('filepicker');
  w.showSaveFilePicker = reject('savepicker');
  w.showDirectoryPicker = reject('filepicker');

  // Downloads and new tabs.
  const aClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.hasAttribute('download')) {
      eff('download', this.getAttribute('download') || this.href);
      return;
    }
    if (this.target === '_blank') {
      eff('popup', this.href);
      return;
    }
    return aClick.call(this);
  };
  w.open = (url?: string) => {
    eff('popup', String(url ?? ''));
    return null;
  };
  w.print = () => eff('print', '');
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) {
        e.preventDefault();
        eff(a.hasAttribute('download') ? 'download' : 'popup', a.href);
      }
    },
    true,
  );

  // Clipboard.
  try {
    const clip = navigator.clipboard as any;
    if (clip) {
      clip.writeText = (t: string) => {
        eff('clipboard', String(t).slice(0, 80));
        return Promise.resolve();
      };
      clip.write = () => {
        eff('clipboard', 'rich');
        return Promise.resolve();
      };
    }
  } catch {
    /* no clipboard */
  }
  const execCommand = document.execCommand.bind(document);
  document.execCommand = (cmd: string, ...rest: any[]) => {
    if (cmd === 'copy') {
      eff('clipboard', 'execCommand');
      return true;
    }
    return execCommand(cmd, ...rest);
  };

  // Input timing: pointerdown/keydown start a clock; the first DOM mutation after it stops the clock.
  const start = () => {
    state.inputAt = now();
    state.firstResponseAt = 0;
  };
  window.addEventListener('pointerdown', start, true);
  window.addEventListener('keydown', start, true);

  const startObserver = () => {
    const mo = new MutationObserver((list) => {
      state.mutations += list.length;
      const t = now();
      state.lastMutationAt = t;
      if (state.inputAt && !state.firstResponseAt) state.firstResponseAt = t;
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
  };
  if (document.documentElement) startObserver();
  else document.addEventListener('readystatechange', startObserver, { once: true });

  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) state.longTasks.push({ t: e.startTime, d: e.duration });
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    /* unsupported */
  }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as any[]) {
        const nodes = (e.sources ?? []).map((s: any) => {
          const n = s.node as Element | null;
          return n && n.nodeType === 1 ? `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${n.classList?.length ? '.' + [...n.classList].slice(0, 2).join('.') : ''}` : '#text';
        });
        state.shifts.push({ t: e.startTime, v: e.value, recent: e.hadRecentInput, nodes });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    /* unsupported */
  }
}
