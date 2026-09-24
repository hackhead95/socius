// Chart export: render a chart offscreen in the light (paper) theme, serialise the SVG with every
// token colour resolved and inlined, and rasterise to PNG at 2x. Browser only.
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { ChartSpec } from '../../core/output';
import { Chart } from './Chart';

export const EXPORT_WIDTH = 680;

export interface ChartRenderOptions {
  /** Draw the title inside the image (default true). False when the document prints "Figure N" and the title above it. */
  showTitle?: boolean;
}

/** Custom properties declared on the top-level `:root` rule (the light theme), read from the live stylesheets. */
function lightTokens(): Record<string, string> {
  const out: Record<string, string> = {};
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.trim() === ':root') {
        const st = rule.style;
        for (let i = 0; i < st.length; i++) {
          const name = st[i];
          if (name.startsWith('--')) out[name] = st.getPropertyValue(name).trim();
        }
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      // Cross-origin stylesheet (fonts): skip.
    }
  }
  return out;
}

let colorCtx: CanvasRenderingContext2D | null = null;
const colorCache = new Map<string, string>();
/** Any CSS colour (incl. color-mix/oklab) -> "#rrggbb" or "rgba(...)" by painting one pixel. */
export function normalizeColor(css: string): string {
  if (!css || css === 'none' || css === 'transparent') return css || 'none';
  if (/^#[0-9a-f]{6}$/i.test(css)) return css;
  const hit = colorCache.get(css);
  if (hit) return hit;
  if (!colorCtx) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    colorCtx = c.getContext('2d', { willReadFrequently: true });
  }
  let res = css;
  if (colorCtx) {
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = '#000';
    colorCtx.fillStyle = css;
    colorCtx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    res = a === 255 ? `#${hex(r)}${hex(g)}${hex(b)}` : a === 0 ? 'none' : `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
  }
  colorCache.set(css, res);
  return res;
}

const PAINT_PROPS = ['fill', 'stroke', 'stop-color'] as const;

/** Serialise the SVG inside a rendered chart container, inlining computed colours and fonts. */
export function serializeChart(container: HTMLElement): { svg: string; width: number; height: number } {
  const src = container.querySelector('svg.chart-svg') as SVGSVGElement | null;
  if (!src) throw new Error('No chart to export.');
  const clone = src.cloneNode(true) as SVGSVGElement;
  const srcEls = [src, ...Array.from(src.querySelectorAll('*'))] as Element[];
  const dstEls = [clone, ...Array.from(clone.querySelectorAll('*'))] as Element[];
  const rootStyle = getComputedStyle(container);
  const surface = normalizeColor(rootStyle.getPropertyValue('--surface').trim() || '#ffffff');
  for (let i = 0; i < srcEls.length; i++) {
    const s = srcEls[i];
    const d = dstEls[i];
    const cs = getComputedStyle(s);
    const tag = s.tagName.toLowerCase();
    for (const p of PAINT_PROPS) {
      if (p === 'stop-color' && tag !== 'stop') continue;
      const v = cs.getPropertyValue(p).trim();
      if (!v) continue;
      if (v.startsWith('url(')) {
        const m = /#([^"')]+)/.exec(v);
        if (m) d.setAttribute(p, `url(#${m[1]})`);
      } else d.setAttribute(p, normalizeColor(v));
    }
    for (const p of ['opacity', 'fill-opacity', 'stroke-opacity'] as const) {
      const v = cs.getPropertyValue(p).trim();
      if (v && v !== '1') d.setAttribute(p, v);
    }
    if (d.getAttribute('stroke') && d.getAttribute('stroke') !== 'none') {
      const v = cs.getPropertyValue('stroke-width').trim();
      if (v) d.setAttribute('stroke-width', v);
    }
    if (tag === 'text') {
      d.setAttribute('font-family', "'IBM Plex Sans', 'Segoe UI', Helvetica, Arial, sans-serif");
      d.setAttribute('font-size', cs.getPropertyValue('font-size').trim());
      const fw = cs.getPropertyValue('font-weight').trim();
      if (fw && fw !== '400' && fw !== 'normal') d.setAttribute('font-weight', fw);
      const fv = cs.getPropertyValue('font-variant-numeric').trim();
      d.removeAttribute('style');
      if (fv && fv !== 'normal') d.setAttribute('style', `font-variant-numeric:${fv}`);
    } else if (tag === 'stop') {
      d.removeAttribute('style');
    }
    d.removeAttribute('class');
    d.removeAttribute('tabindex');
    if (d !== clone) d.removeAttribute('aria-label');
  }
  clone.removeAttribute('style');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('font-family', "'IBM Plex Sans', 'Segoe UI', Helvetica, Arial, sans-serif");
  // Background: always the paper surface.
  const bg = clone.querySelector('[data-bg]');
  bg?.setAttribute('fill', surface);
  // Invisible hit targets add nothing to a file.
  for (const el of Array.from(clone.querySelectorAll('rect, circle, path'))) {
    const f = el.getAttribute('fill');
    const st = el.getAttribute('stroke');
    if ((f === 'none' || f === 'transparent' || f === null) && (st === 'none' || st === null) && !el.hasAttribute('data-bg')) el.remove();
  }
  // Dense scatter plots paint dots on a canvas: embed it as an image in the right slot.
  const canvas = container.querySelector('canvas[data-chart-layer]') as HTMLCanvasElement | null;
  const slot = clone.querySelector('[data-canvas-slot]');
  if (canvas && slot) {
    const [x, y, w, h] = (slot.getAttribute('data-canvas-slot') ?? '0,0,0,0').split(',').map(Number);
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('x', String(x));
    img.setAttribute('y', String(y));
    img.setAttribute('width', String(w));
    img.setAttribute('height', String(h));
    img.setAttribute('href', canvas.toDataURL('image/png'));
    slot.replaceWith(img);
  }
  const width = Number(src.getAttribute('width')) || src.viewBox.baseVal.width;
  const height = Number(src.getAttribute('height')) || src.viewBox.baseVal.height;
  const xml = new XMLSerializer().serializeToString(clone);
  return { svg: `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`, width, height };
}

/** Render a chart offscreen at a fixed width in the light theme and run `fn` on its container. */
export function withOffscreenChart<T>(spec: ChartSpec, fn: (el: HTMLElement) => T, width = EXPORT_WIDTH, opts: ChartRenderOptions = {}): T {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${width}px;pointer-events:none;color-scheme:light;`;
  const tokens = lightTokens();
  for (const [k, v] of Object.entries(tokens)) host.style.setProperty(k, v);
  host.style.background = tokens['--surface'] ?? '';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(Chart, { spec, width, showTitle: opts.showTitle ?? true })));
    return fn(host);
  } finally {
    root.unmount();
    host.remove();
  }
}

export function chartToSvg(spec: ChartSpec, width = EXPORT_WIDTH, opts: ChartRenderOptions = {}): { svg: string; width: number; height: number } {
  return withOffscreenChart(spec, serializeChart, width, opts);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The chart image could not be rendered.'));
    img.src = src;
  });
}

/** Rasterise an SVG string to PNG at `scale` (default 2x for crisp print). */
export async function svgToPng(svg: string, width: number, height: number, scale = 2): Promise<{ blob: Blob; bytes: Uint8Array; width: number; height: number }> {
  const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed.'))), 'image/png'));
  return { blob, bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}

export async function chartToPng(spec: ChartSpec, width = EXPORT_WIDTH, scale = 2, opts: ChartRenderOptions = {}) {
  const s = chartToSvg(spec, width, opts);
  return svgToPng(s.svg, s.width, s.height, scale);
}

/** PNG as a data: URL (for rich-HTML clipboard copies). */
export async function chartToPngDataUrl(spec: ChartSpec, width = EXPORT_WIDTH, opts: ChartRenderOptions = {}): Promise<{ url: string; width: number; height: number }> {
  const png = await chartToPng(spec, width, 2, opts);
  const url = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error('Could not encode image.'));
    fr.readAsDataURL(png.blob);
  });
  return { url, width: png.width, height: png.height };
}

/** Safe file name stem from a title. */
export function fileStem(title: string): string {
  return (title || 'chart').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60).toLowerCase() || 'chart';
}
