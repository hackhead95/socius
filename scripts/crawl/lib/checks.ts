// In-page layout checks. Each function here is serialised into the page by page.evaluate, so it must be
// self-contained (no imports, no closures over module scope).

export interface RawIssue {
  rule: string;
  sel: string;
  label: string;
  msg: string;
  rect: { x: number; y: number; width: number; height: number } | null;
  /** Numbers for the report (ratio, overflow px, ...). */
  data?: Record<string, number | string | boolean>;
}

export interface CheckOptions {
  /** Limit the checks to this root (CSS selector); default the whole document. */
  root?: string | null;
  contrast?: boolean;
  overflow?: boolean;
  overlap?: boolean;
  occlusion?: boolean;
  hscroll?: boolean;
  disabledReason?: boolean;
  oversize?: boolean;
  minContrast?: number;
}

/** Static layout checks on what is on screen now. */
export function pageChecks(o: CheckOptions): RawIssue[] {
  const out: RawIssue[] = [];
  const W = window.innerWidth;
  const H = window.innerHeight;

  const path = (el: Element | null): string => {
    const parts: string[] = [];
    let n: Element | null = el;
    let depth = 0;
    while (n && n.nodeType === 1 && depth < 7 && n !== document.body) {
      let s = n.tagName.toLowerCase();
      if (n.id && !/^(:|react|radix)/i.test(n.id) && !/\d{3,}/.test(n.id)) s += '#' + n.id;
      const cls = [...n.classList].filter((c) => !/^(open|active|on|is-|has-|focus|hover|sel|selected)$/.test(c)).slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      const role = n.getAttribute('role');
      if (role && !cls.length) s += `[role=${role}]`;
      parts.unshift(s);
      n = n.parentElement;
      depth++;
    }
    return parts.join(' > ');
  };
  const labelOf = (el: Element): string => {
    const a = el.getAttribute('aria-label') || el.getAttribute('title') || (el as HTMLElement).innerText || el.textContent || '';
    return a.replace(/\s+/g, ' ').trim().slice(0, 80);
  };
  const rectOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
  };
  const isVisible = (el: Element): boolean => {
    const h = el as HTMLElement;
    if (!h.getClientRects().length) return false;
    // Content of a closed <details> (content-visibility) still has boxes; checkVisibility knows better.
    if (typeof (h as any).checkVisibility === 'function' && !(h as any).checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false;
    const cs = getComputedStyle(h);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    let n: Element | null = h;
    while (n) {
      const s = getComputedStyle(n);
      if (Number(s.opacity) < 0.05) return false;
      n = n.parentElement;
    }
    const r = h.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  /** The part of an element not clipped by scrolling ancestors or the viewport. */
  const visibleRect = (el: Element) => {
    const r = el.getBoundingClientRect();
    let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    let n = el.parentElement;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const p = n.getBoundingClientRect();
        if (s.overflowX !== 'visible') { x0 = Math.max(x0, p.left); x1 = Math.min(x1, p.right); }
        if (s.overflowY !== 'visible') { y0 = Math.max(y0, p.top); y1 = Math.min(y1, p.bottom); }
      }
      if (s.position === 'fixed') break;
      n = n.parentElement;
    }
    x0 = Math.max(x0, 0); y0 = Math.max(y0, 0); x1 = Math.min(x1, W); y1 = Math.min(y1, H);
    return { x0, y0, x1, y1, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0), full: r.width * r.height };
  };

  // Scope: the top-most modal dialog if one is open (everything behind it is inert), else the page.
  const modals = [...document.querySelectorAll('.modal, [role="dialog"][aria-modal="true"]')].filter(isVisible);
  const topModal = modals.length ? modals[modals.length - 1] : null;
  const root: Element = (o.root ? document.querySelector(o.root) : null) ?? topModal ?? document.body;
  // Floating layers that legitimately sit above the root (menus, popovers, toasts are checked separately).
  const inScope = (el: Element) => root.contains(el);

  // Transient layers the user opened on purpose (menus, popovers, search) may cover the page; the
  // assistant panel, the assistant button and toasts are persistent and must not cover controls.
  const TRANSIENT = '[role=menu], [role=listbox], [role=tooltip], [role=dialog]:not([aria-modal="true"]), .context-menu, .ai-pop, .palette, .palette-backdrop, .as-see, .stats-pop, .menu-sheet, .sheet-backdrop, .ov-menu-list, .cw-menu-list, .cw-palette, .varpicker-list, [class*="hovercard"], [class*="popover"], [class$="-pop"], [class*="-pop "], .ov-outline.open, [class*="scrim"], [class*="drawer"]';
  const PERSISTENT = '.as-panel, .as-fab, .toasts, .toast, .busy-overlay, .drop-overlay';
  const layerOf = (el: Element): Element | null => el.closest(TRANSIENT) ?? el.closest(PERSISTENT);
  const INTERACTIVE = 'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=menuitem], [role=menuitemcheckbox], [role=tab], [role=option], [role=checkbox], [role=radio], [role=switch]';
  const interactive = [...document.querySelectorAll(INTERACTIVE)].filter((el) => inScope(el) && isVisible(el));

  // ---- horizontal page scroll ----
  if (o.hscroll !== false) {
    const sw = document.documentElement.scrollWidth;
    if (sw > W + 1) {
      // Report the outermost elements that stick out on the right.
      const culprits: Element[] = [];
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.right > W + 1 && r.width > 0 && isVisible(el)) {
          if (!culprits.some((c) => c.contains(el))) culprits.push(el);
        }
        if (culprits.length > 6) break;
      }
      const c = culprits.find((x) => x.getBoundingClientRect().left < W) ?? culprits[0] ?? document.body;
      out.push({ rule: 'hscroll', sel: path(c), label: labelOf(c).slice(0, 40), msg: `Page scrolls sideways: document is ${sw}px wide in a ${W}px viewport`, rect: rectOf(c), data: { scrollWidth: sw, viewport: W } });
    }
  }

  // ---- text overflow / clipped labels ----
  if (o.overflow !== false) {
    const seen = new Set<Element>();
    const candidates = [...root.querySelectorAll('*')].filter((el) => {
      if (el instanceof SVGElement || ['SCRIPT', 'STYLE', 'svg', 'PATH', 'CANVAS', 'TEXTAREA', 'SELECT', 'OPTION', 'INPUT'].includes(el.tagName)) return false;
      return [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 1);
    });
    for (const el of candidates) {
      if (!isVisible(el)) continue;
      const vr = visibleRect(el);
      if (vr.w < 4 || vr.h < 4) continue;
      const cs = getComputedStyle(el);
      const h = el as HTMLElement;
      const scrollable = /(auto|scroll)/.test(cs.overflowX + cs.overflowY);
      if (scrollable) continue;
      // Intentional truncation with an ellipsis is fine when the full text is available (title / aria-label).
      const ellipsis = cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none';
      const hasFull = !!(el.closest('[title]') || el.getAttribute('aria-label'));
      const ow = h.scrollWidth - h.clientWidth;
      const oh = h.scrollHeight - h.clientHeight;
      const clipsX = cs.overflowX !== 'visible' || cs.overflow === 'hidden';
      const clipsY = cs.overflowY !== 'visible';
      let problem = '';
      if (h.clientWidth > 0 && ow > 2 && clipsX && !ellipsis) problem = `text is cut off by ${ow}px (no ellipsis, no scroll)`;
      else if (h.clientWidth > 0 && ow > 2 && ellipsis && !hasFull && h.innerText.length > 3) problem = `text truncated with an ellipsis (${ow}px hidden) and no tooltip with the full text`;
      else if (h.clientHeight > 0 && oh > 3 && clipsY && !ellipsis && cs.display !== 'inline') problem = `text is cut off vertically by ${oh}px`;
      else if (!clipsX && ow > 4 && h.clientWidth > 0 && cs.display !== 'inline' && cs.whiteSpace !== 'normal') {
        // Text spilling out of its box (overflow visible): check it really leaves the box.
        const range = document.createRange();
        range.selectNodeContents(el);
        const tr = range.getBoundingClientRect();
        const br = el.getBoundingClientRect();
        if (tr.right > br.right + 3) problem = `text spills ${Math.round(tr.right - br.right)}px out of its box`;
      }
      // Buttons: a label wider than the button.
      if (!problem && el.closest('button, .btn, [role=button], [role=tab], [role=menuitem]')) {
        const b = el.closest('button, .btn, [role=button], [role=tab], [role=menuitem]') as HTMLElement;
        const bw = b.scrollWidth - b.clientWidth;
        if (bw > 2 && !/(auto|scroll)/.test(getComputedStyle(b).overflowX)) problem = `button label is ${bw}px wider than the button`;
      }
      if (!problem) continue;
      const key = el.closest('button, [role=button], [role=tab], [role=menuitem]') ?? el;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ rule: el.closest('button, .btn, [role=button], [role=tab], [role=menuitem]') ? 'overflow-button' : 'overflow-text', sel: path(el), label: labelOf(el).slice(0, 60), msg: problem, rect: rectOf(el), data: { ow, oh } });
      if (out.filter((x) => x.rule.startsWith('overflow')).length > 40) break;
    }
  }

  // ---- overlapping interactive elements ----
  if (o.overlap !== false) {
    const boxes = interactive
      .map((el) => ({ el, r: el.getBoundingClientRect(), v: visibleRect(el) }))
      .filter((b) => b.v.w > 2 && b.v.h > 2 && b.v.w * b.v.h > 0.5 * b.r.width * b.r.height);
    let n = 0;
    for (let i = 0; i < boxes.length && n < 20; i++) {
      for (let j = i + 1; j < boxes.length && n < 20; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        // Something floating over the page (a menu, a popover, the assistant panel) is not an overlap bug here;
        // what floats over what is judged by the occlusion check.
        if (layerOf(a.el) !== layerOf(b.el)) continue;
        // A label wrapping its input, or an input with its own clear button, are fine.
        if (a.el.closest('label') && a.el.closest('label') === b.el.closest('label')) continue;
        const ix = Math.min(a.v.x1, b.v.x1) - Math.max(a.v.x0, b.v.x0);
        const iy = Math.min(a.v.y1, b.v.y1) - Math.max(a.v.y0, b.v.y0);
        if (ix <= 2 || iy <= 2) continue;
        const area = ix * iy;
        const small = Math.min(a.v.w * a.v.h, b.v.w * b.v.h);
        if (area < 16 || area / small < 0.08) continue;
        n++;
        out.push({ rule: 'overlap', sel: `${path(a.el)}  ×  ${path(b.el)}`, label: `${labelOf(a.el).slice(0, 30)} × ${labelOf(b.el).slice(0, 30)}`, msg: `interactive elements overlap by ${Math.round(ix)}×${Math.round(iy)}px (${Math.round((100 * area) / small)}% of the smaller one)`, rect: { x: Math.round(Math.min(a.v.x0, b.v.x0)), y: Math.round(Math.min(a.v.y0, b.v.y0)), width: Math.round(Math.max(a.v.x1, b.v.x1) - Math.min(a.v.x0, b.v.x0)), height: Math.round(Math.max(a.v.y1, b.v.y1) - Math.min(a.v.y0, b.v.y0)) } });
      }
    }
  }

  // ---- buttons covered by something else (z-index): elementFromPoint at the centre ----
  if (o.occlusion !== false) {
    const byLayer = new Map<string, { labels: string[]; rects: DOMRect[]; hit: string }>();
    let n = 0;
    for (const el of interactive) {
      if (n > 25) break;
      if (el.matches('input[type=checkbox], input[type=radio]')) continue; // often visually replaced
      const v = visibleRect(el);
      if (v.w < 4 || v.h < 4 || v.w * v.h < 0.6 * v.full) continue;
      const cx = v.x0 + v.w / 2, cy = v.y0 + v.h / 2;
      const hit = document.elementFromPoint(cx, cy);
      if (!hit || el.contains(hit) || hit.contains(el)) continue;
      // A label that forwards clicks to the input is fine.
      if (hit.closest('label') && hit.closest('label')?.contains(el)) continue;
      if (el.closest('label')?.contains(hit)) continue;
      const hitLayer = layerOf(hit);
      const elLayer = layerOf(el);
      if (hitLayer && hitLayer === elLayer) {
        // Inside one floating layer: a real overlap.
      } else if (hitLayer && hitLayer.matches(TRANSIENT) && !hitLayer.matches('.toast, .toasts')) continue; // an open menu/popover covering the page is expected
      n++;
      if (hitLayer && hitLayer.matches(PERSISTENT)) {
        const k = path(hitLayer);
        const e = byLayer.get(k) ?? { labels: [], rects: [], hit: labelOf(hitLayer).slice(0, 30) };
        e.labels.push(labelOf(el).slice(0, 30) || el.tagName.toLowerCase());
        e.rects.push(el.getBoundingClientRect());
        byLayer.set(k, e);
        continue;
      }
      out.push({ rule: 'occluded', sel: path(el), label: labelOf(el), msg: `the centre of this control is covered by ${path(hit).split(' > ').slice(-2).join(' > ')} (${labelOf(hit).slice(0, 30) || 'no text'}), so a click there hits the wrong element`, rect: rectOf(el), data: { coveredBy: path(hit) } });
    }
    for (const [k, e] of byLayer) {
      const x0 = Math.min(...e.rects.map((r) => r.left)), y0 = Math.min(...e.rects.map((r) => r.top));
      const x1 = Math.max(...e.rects.map((r) => r.right)), y1 = Math.max(...e.rects.map((r) => r.bottom));
      out.push({ rule: 'occluded', sel: k, label: k.split(' > ').pop() ?? k, msg: `${k.split(' > ').pop()} covers ${e.labels.length} control(s) so they cannot be clicked: ${e.labels.slice(0, 8).map((l) => `"${l}"`).join(', ')}`, rect: { x: Math.round(x0), y: Math.round(y0), width: Math.round(x1 - x0), height: Math.round(y1 - y0) }, data: { coveredBy: k, n: e.labels.length } });
    }
  }

  // ---- contrast ----
  if (o.contrast !== false) {
    const min = o.minContrast ?? 3;
    const parse = (c: string): [number, number, number, number] | null => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) {
        const mm = c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
        if (mm) return [Number(mm[1]) * 255, Number(mm[2]) * 255, Number(mm[3]) * 255, mm[4] === undefined ? 1 : Number(mm[4])];
        return null;
      }
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const blend = (fg: number[], bg: number[]) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
    const lum = (c: number[]) => {
      const f = (v: number) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const bgOf = (el: Element): number[] | null => {
      const layers: number[][] = [];
      let n: Element | null = el;
      while (n) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('url(')) return null; // gradient: unknown
        const c = parse(cs.backgroundColor);
        if (c && c[3] > 0) {
          layers.push(c);
          if (c[3] >= 1) break;
        }
        n = n.parentElement;
      }
      let base: number[] = [255, 255, 255, 1];
      if (!layers.length || layers[layers.length - 1][3] < 1) {
        const rootBg = parse(getComputedStyle(document.body).backgroundColor) ?? parse(getComputedStyle(document.documentElement).backgroundColor);
        if (rootBg && rootBg[3] > 0) base = rootBg;
      } else base = layers.pop()!;
      for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
      return base;
    };
    let n = 0;
    const els = [...root.querySelectorAll('*')].filter((el) => [...el.childNodes].some((c) => c.nodeType === 3 && /[A-Za-z0-9]/.test(c.textContent ?? '')));
    const done = new Set<string>();
    for (const el of els) {
      if (n > 30) break;
      if (el.closest('[disabled], [aria-disabled="true"], .vv-disabled, [hidden]')) continue; // WCAG exempts inactive controls
      if (el.closest('svg, canvas, .chart, [data-crawl-ignore-contrast]')) continue;
      if (!isVisible(el)) continue;
      const v = visibleRect(el);
      if (v.w < 2 || v.h < 2) continue;
      const cs = getComputedStyle(el);
      if (parseFloat(cs.fontSize) < 6) continue;
      const fg = parse(cs.color);
      if (!fg) continue;
      const bg = bgOf(el);
      if (!bg) continue;
      let opacity = 1;
      for (let p: Element | null = el; p; p = p.parentElement) opacity *= Number(getComputedStyle(p).opacity);
      const f = blend([fg[0], fg[1], fg[2], fg[3] * opacity], bg);
      const l1 = lum(f), l2 = lum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (ratio >= min) continue;
      const key = `${path(el)}|${cs.color}|${Math.round(ratio * 10)}`;
      if (done.has(key)) continue;
      done.add(key);
      n++;
      const big = parseFloat(cs.fontSize) >= 18.66 || (parseFloat(cs.fontSize) >= 14 && Number(cs.fontWeight) >= 700);
      out.push({ rule: 'contrast', sel: path(el), label: labelOf(el).slice(0, 50), msg: `text contrast ${ratio.toFixed(2)}:1 (${cs.color} on rgb(${bg.slice(0, 3).map(Math.round).join(', ')}))${big ? ', large text' : ''}`, rect: rectOf(el), data: { ratio: Number(ratio.toFixed(2)), fontSize: parseFloat(cs.fontSize) } });
    }
  }

  // ---- disabled items without a reason ----
  if (o.disabledReason !== false) {
    const menus = [...document.querySelectorAll('[role=menu] [aria-disabled="true"], [role=menu] [disabled], .view-toolbar [disabled], .ov-toolbar [disabled], .cw-toolbar [disabled], .topbar [disabled]')].filter(isVisible);
    for (const el of menus) {
      const why = el.getAttribute('title') || el.closest('[title]')?.getAttribute('title') || el.getAttribute('aria-describedby');
      const lab = ((el as HTMLElement).innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (why && why.trim() && why.trim().toLowerCase() !== lab.toLowerCase()) continue;
      out.push({ rule: 'disabled-no-reason', sel: path(el), label: lab, msg: `disabled with no tooltip saying why${why ? ` (title only repeats the label "${why}")` : ''}`, rect: rectOf(el) });
    }
  }

  // ---- dialogs larger than the viewport ----
  if (o.oversize !== false) {
    for (const m of modals) {
      const r = m.getBoundingClientRect();
      const tooTall = r.bottom > H + 1 || r.top < -1;
      const tooWide = r.right > W + 1 || r.left < -1;
      if (!tooTall && !tooWide) continue;
      // Can the user still reach everything? Is the dialog itself or its backdrop scrollable?
      let scrollable = false;
      for (let n: Element | null = m; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight) scrollable = true;
      }
      const footer = m.querySelector('.modal-footer');
      const fr = footer?.getBoundingClientRect();
      const footerOff = !!fr && (fr.bottom > H + 1 || fr.right > W + 1);
      out.push({ rule: 'dialog-oversize', sel: path(m), label: labelOf(m.querySelector('h2') ?? m), msg: `dialog is ${Math.round(r.width)}×${Math.round(r.height)}px in a ${W}×${H} viewport${tooWide ? ' (wider than the screen)' : ''}${footerOff ? '; its buttons are off-screen' : ''}${scrollable ? '' : ' and nothing scrolls'}`, rect: rectOf(m), data: { footerOff, scrollable } });
    }
    // Menus and popovers that leave the viewport.
    for (const el of [...document.querySelectorAll('[role=menu], .ai-pop, .as-see, .stats-pop, .context-menu, .palette')].filter(isVisible)) {
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1) {
        const cs = getComputedStyle(el);
        const canScroll = /(auto|scroll)/.test(cs.overflowY) && r.top >= 0 && r.top < H;
        if (canScroll && r.right <= W + 1 && r.left >= -1 && r.bottom <= H + 1) continue;
        out.push({ rule: 'popup-offscreen', sel: path(el), label: labelOf(el).slice(0, 40), msg: `popup extends past the viewport (${Math.round(r.left)},${Math.round(r.top)} to ${Math.round(r.right)},${Math.round(r.bottom)} in ${W}×${H})`, rect: rectOf(el) });
      }
    }
  }
  return out;
}

/** Info about the focused element and whether its focus indicator is visible. */
export function focusInfo(): { sel: string; label: string; inDialog: boolean; visibleRing: boolean | null; body: boolean; rect: RawIssue['rect'] } {
  const el = document.activeElement as HTMLElement | null;
  const path = (e: Element | null): string => {
    const parts: string[] = [];
    let n: Element | null = e;
    let d = 0;
    while (n && n.nodeType === 1 && d < 6 && n !== document.body) {
      let s = n.tagName.toLowerCase();
      const cls = [...n.classList].slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s);
      n = n.parentElement;
      d++;
    }
    return parts.join(' > ');
  };
  if (!el || el === document.body || el === document.documentElement) return { sel: 'body', label: '', inDialog: false, visibleRing: null, body: true, rect: null };
  const modals = document.querySelectorAll('.modal, [role="dialog"][aria-modal="true"]');
  const top = modals[modals.length - 1];
  const snap = () => {
    const cs = getComputedStyle(el);
    return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.backgroundColor, cs.borderColor, cs.color, cs.textDecorationLine, cs.stroke, cs.strokeWidth].join('|');
  };
  const focused = snap();
  // Compare with the unfocused look. Blur and re-focus without scrolling; restore :focus-visible by
  // keeping the keyboard modality (focus() after a keyboard event keeps it in Chromium).
  let visibleRing: boolean | null = null;
  try {
    const wasFv = el.matches(':focus-visible');
    el.blur();
    const blurred = snap();
    el.focus({ preventScroll: true });
    visibleRing = wasFv ? focused !== blurred : null;
  } catch {
    visibleRing = null;
  }
  const r = el.getBoundingClientRect();
  return {
    sel: path(el),
    label: (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    inDialog: !!top && top.contains(el),
    visibleRing,
    body: false,
    rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
  };
}

/** Anchors used to detect layout shift when something opens. */
export function anchorRects(): Record<string, [number, number, number, number]> {
  const out: Record<string, [number, number, number, number]> = {};
  const sel = ['.topbar', '.tabbar', '.menubar', '.main', '.sidebar', '.view-toolbar', '.grid-scroll', '.ov-toolbar', '.cw-toolbar', '.as-fab'];
  for (const s of sel) {
    const el = document.querySelector(s);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    out[s] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
  }
  out.__scrollbar = [document.documentElement.clientWidth, window.innerWidth, 0, 0];
  return out;
}

/** Which menu items look highlighted right now (background differs from their menu's). */
export function highlightedMenuItems(): string[] {
  const out: string[] = [];
  for (const menu of document.querySelectorAll('[role=menu]')) {
    const mbg = getComputedStyle(menu).backgroundColor;
    for (const it of menu.querySelectorAll(':scope > .menu-item-wrap > .menu-item, :scope > [role^=menuitem], :scope > button')) {
      const cs = getComputedStyle(it);
      const bg = cs.backgroundColor;
      const hl = (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== mbg) || (cs.boxShadow !== 'none' && cs.boxShadow !== '') || (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px');
      if (hl) out.push((it.getAttribute('data-label') || it.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40));
    }
  }
  return out;
}

/** A cheap signature of the app state, to notice when an action changed the data. */
export function stateSignature(): string {
  const q = (s: string) => (document.querySelector(s)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  return [q('.dataset-size'), q('.chips'), q('#tab-output .badge'), q('.dataset-name'), document.querySelectorAll('.cw-tabcount').length ? q('.cw-viewtabs') : ''].join(' | ');
}
