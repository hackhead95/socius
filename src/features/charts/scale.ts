// Pure scale and tick math for the SVG chart renderers. No DOM access here, so it is unit-tested.

/** A "nice" step (1, 2, 2.5, 5 x 10^k) close to `rough`. */
export function niceStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) return 1;
  const exp = Math.floor(Math.log10(rough));
  const base = Math.pow(10, exp);
  const f = rough / base;
  let nf: number;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 2.5) nf = 2.5;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * base;
}

/** Round away float noise (0.30000000000000004 -> 0.3) relative to a step. */
function clean(x: number, step: number): number {
  const dec = Math.max(0, -Math.floor(Math.log10(step)) + 2);
  return Number(x.toFixed(Math.min(dec, 12)));
}

export interface Ticks {
  /** Domain rounded outward to whole steps. */
  min: number;
  max: number;
  step: number;
  values: number[];
}

/**
 * Nice ticks covering [lo, hi] with roughly `count` intervals. The domain is extended outward to
 * whole steps. Degenerate ranges (lo == hi) are widened so there is always something to draw.
 */
export function niceTicks(lo: number, hi: number, count = 5): Ticks {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  if (lo > hi) [lo, hi] = [hi, lo];
  if (lo === hi) {
    const pad = lo === 0 ? 1 : Math.abs(lo) * 0.1;
    lo -= pad;
    hi += pad;
  }
  const step = niceStep((hi - lo) / Math.max(1, count));
  const min = clean(Math.floor(lo / step + 1e-9) * step, step);
  const max = clean(Math.ceil(hi / step - 1e-9) * step, step);
  const values: number[] = [];
  const n = Math.round((max - min) / step);
  for (let i = 0; i <= n; i++) values.push(clean(min + i * step, step));
  return { min, max, step, values };
}

/** Linear map from domain [d0, d1] to range [r0, r1]. */
export function linear(d0: number, d1: number, r0: number, r1: number): (x: number) => number {
  const span = d1 - d0 || 1;
  return (x: number) => r0 + ((x - d0) / span) * (r1 - r0);
}

export interface Band {
  /** Start of band i. */
  start: (i: number) => number;
  /** Centre of band i. */
  center: (i: number) => number;
  /** Full band width (including padding share). */
  bandwidth: number;
  /** Index of the band containing a position, or -1. */
  indexAt: (pos: number) => number;
}

/** Evenly divide [r0, r1] into n bands. */
export function band(n: number, r0: number, r1: number): Band {
  const bw = n > 0 ? (r1 - r0) / n : r1 - r0;
  return {
    start: (i) => r0 + i * bw,
    center: (i) => r0 + (i + 0.5) * bw,
    bandwidth: bw,
    indexAt: (pos) => {
      if (n <= 0 || bw === 0) return -1;
      const i = Math.floor((pos - r0) / bw);
      return i >= 0 && i < n ? i : -1;
    },
  };
}

/** Min and max of finite numbers; null if none. */
export function extent(values: Iterable<number | null | undefined>): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return lo === Infinity ? null : [lo, hi];
}

/** Number of decimals needed to show a tick step exactly (0.25 -> 2, 5 -> 0). */
export function stepDecimals(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  for (let d = 0; d <= 10; d++) {
    if (Math.abs(Math.round(step * Math.pow(10, d)) - step * Math.pow(10, d)) < 1e-6) return d;
  }
  return 10;
}

/** Tick label: thousands separators, decimals matched to the step, optional % suffix. */
export function formatTick(v: number, step: number, percent = false): string {
  const d = stepDecimals(step);
  const x = Math.abs(v) < step * 1e-9 ? 0 : v;
  const abs = Math.abs(x);
  let s: string;
  if (abs >= 1e6 && d === 0) {
    const m = x / 1e6;
    s = (Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1)) + 'M';
  } else {
    s = x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  return percent ? s + '%' : s;
}

/** Compact value label for chart annotations (not axes): up to 1 decimal, thousands separators. */
export function formatValue(v: number, percent = false, decimals?: number): string {
  if (!Number.isFinite(v)) return '.';
  const d = decimals ?? (Number.isInteger(v) ? 0 : Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2);
  const s = v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return percent ? s + '%' : s;
}

/** Normal density. */
export function normalPdf(x: number, mean: number, sd: number): number {
  if (!(sd > 0)) return 0;
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

/**
 * Points of a normal curve scaled to histogram counts: expected count per bin = n * binWidth * pdf.
 * Uses the (common) bin width of the first bin.
 */
export function normalCurvePoints(edges: number[], normal: { mean: number; sd: number; n: number }, samples = 80): Array<[number, number]> {
  if (edges.length < 2) return [];
  const lo = edges[0];
  const hi = edges[edges.length - 1];
  const bw = (hi - lo) / (edges.length - 1);
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= samples; i++) {
    const x = lo + ((hi - lo) * i) / samples;
    out.push([x, normal.n * bw * normalPdf(x, normal.mean, normal.sd)]);
  }
  return out;
}

/** Angles for donut slices, starting at 12 o'clock, clockwise. Zero/negative values get no slice. */
export function pieAngles(values: number[]): Array<{ start: number; end: number; share: number }> {
  const total = values.reduce((a, v) => a + (v > 0 ? v : 0), 0);
  let a = -Math.PI / 2;
  return values.map((v) => {
    const share = total > 0 && v > 0 ? v / total : 0;
    const start = a;
    a += share * Math.PI * 2;
    return { start, end: a, share };
  });
}

/** SVG path for an annular sector. */
export function arcPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number): string {
  const sweep = end - start;
  if (sweep <= 0) return '';
  if (sweep >= Math.PI * 2 - 1e-6) {
    // Full ring: two half arcs.
    const mid = start + Math.PI;
    return arcPath(cx, cy, rOuter, rInner, start, mid) + ' ' + arcPath(cx, cy, rOuter, rInner, mid, start + Math.PI * 2 - 1e-6);
  }
  const large = sweep > Math.PI ? 1 : 0;
  const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  if (rInner <= 0) return `M ${cx} ${cy} L ${p(rOuter, start)} A ${rOuter} ${rOuter} 0 ${large} 1 ${p(rOuter, end)} Z`;
  return `M ${p(rOuter, start)} A ${rOuter} ${rOuter} 0 ${large} 1 ${p(rOuter, end)} L ${p(rInner, end)} A ${rInner} ${rInner} 0 ${large} 0 ${p(rInner, start)} Z`;
}

/**
 * Rectangle path with only the data-end corners rounded (the baseline end stays square).
 * `end` says which side is the data end.
 */
export function barPath(x: number, y: number, w: number, h: number, r: number, end: 'top' | 'bottom' | 'left' | 'right'): string {
  if (w <= 0 || h <= 0) return '';
  const rr = Math.max(0, Math.min(r, (end === 'top' || end === 'bottom' ? w : h) / 2, end === 'top' || end === 'bottom' ? h : w));
  const x2 = x + w;
  const y2 = y + h;
  const f = (n: number) => n.toFixed(2);
  switch (end) {
    case 'top':
      return `M${f(x)} ${f(y2)}V${f(y + rr)}Q${f(x)} ${f(y)} ${f(x + rr)} ${f(y)}H${f(x2 - rr)}Q${f(x2)} ${f(y)} ${f(x2)} ${f(y + rr)}V${f(y2)}Z`;
    case 'bottom':
      return `M${f(x)} ${f(y)}V${f(y2 - rr)}Q${f(x)} ${f(y2)} ${f(x + rr)} ${f(y2)}H${f(x2 - rr)}Q${f(x2)} ${f(y2)} ${f(x2)} ${f(y2 - rr)}V${f(y)}Z`;
    case 'right':
      return `M${f(x)} ${f(y)}H${f(x2 - rr)}Q${f(x2)} ${f(y)} ${f(x2)} ${f(y + rr)}V${f(y2 - rr)}Q${f(x2)} ${f(y2)} ${f(x2 - rr)} ${f(y2)}H${f(x)}Z`;
    case 'left':
      return `M${f(x2)} ${f(y)}H${f(x + rr)}Q${f(x)} ${f(y)} ${f(x)} ${f(y + rr)}V${f(y2 - rr)}Q${f(x)} ${f(y2)} ${f(x + rr)} ${f(y2)}H${f(x2)}Z`;
  }
}

/** Approximate text width in px for layout when no canvas is available (IBM Plex Sans-ish metrics). */
export function approxTextWidth(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) {
    if ('il.,:;|!\'`'.includes(ch)) w += 0.28;
    else if ('fjrt()[] '.includes(ch)) w += 0.36;
    else if ('mwMW'.includes(ch)) w += 0.85;
    else if (ch >= 'A' && ch <= 'Z') w += 0.66;
    else if (ch >= '0' && ch <= '9') w += 0.58;
    else w += 0.54;
  }
  return w * fontSize;
}

/** Shorten a label to fit `maxWidth` px, adding an ellipsis. */
export function truncateLabel(text: string, maxWidth: number, fontSize: number, measure: (t: string, fs: number) => number = approxTextWidth): string {
  if (measure(text, fontSize) <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(text.slice(0, mid) + '…', fontSize) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo <= 0 ? '…' : text.slice(0, lo).trimEnd() + '…';
}

/** Evenly thin category labels so they do not overlap: returns the step (show every k-th). */
export function labelStride(n: number, bandwidth: number, maxLabelWidth: number): number {
  if (n <= 1 || bandwidth <= 0) return 1;
  return Math.max(1, Math.ceil((maxLabelWidth + 6) / bandwidth));
}

/** Legend flow layout: positions items left to right, wrapping to new rows within `width`. */
export function legendLayout(labels: string[], width: number, fontSize: number, swatch = 12, gap = 16, measure: (t: string, fs: number) => number = approxTextWidth): { items: Array<{ x: number; row: number; label: string }>; rows: number } {
  const items: Array<{ x: number; row: number; label: string }> = [];
  let x = 0;
  let row = 0;
  for (const raw of labels) {
    const label = truncateLabel(raw, Math.max(60, width - swatch - 6), fontSize, measure);
    const w = swatch + 6 + measure(label, fontSize);
    if (x > 0 && x + w > width) {
      row++;
      x = 0;
    }
    items.push({ x, row, label });
    x += w + gap;
  }
  return { items, rows: labels.length ? row + 1 : 0 };
}

/** Index of the nearest point to (px, py) within `maxDist`, using a uniform grid built once. */
export class PointIndex {
  private cell: number;
  private grid = new Map<number, number[]>();
  constructor(private xs: Float64Array, private ys: Float64Array, cellSize = 24) {
    this.cell = cellSize;
    for (let i = 0; i < xs.length; i++) {
      const k = this.key(Math.floor(xs[i] / cellSize), Math.floor(ys[i] / cellSize));
      const arr = this.grid.get(k);
      if (arr) arr.push(i);
      else this.grid.set(k, [i]);
    }
  }
  private key(cx: number, cy: number) {
    return (cx + 10000) * 20011 + (cy + 10000);
  }
  nearest(px: number, py: number, maxDist = 16): number {
    const cx = Math.floor(px / this.cell);
    const cy = Math.floor(py / this.cell);
    let best = -1;
    let bd = maxDist * maxDist;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const arr = this.grid.get(this.key(cx + dx, cy + dy));
        if (!arr) continue;
        for (const i of arr) {
          const ddx = this.xs[i] - px;
          const ddy = this.ys[i] - py;
          const d = ddx * ddx + ddy * ddy;
          if (d <= bd) {
            bd = d;
            best = i;
          }
        }
      }
    return best;
  }
}
