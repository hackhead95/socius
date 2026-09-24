// Chart helpers for core procedures (histogram binning with "nice" widths).

/** A "nice" bin width (1, 2, 2.5 or 5 times a power of ten) giving roughly `target` bins. */
export function niceWidth(range: number, target: number): number {
  if (!(range > 0)) return 1;
  const raw = range / target;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / pow;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * pow;
}

/** Weighted histogram with nice bin edges. Integer-valued data with few values get unit bins. */
export function histogram(x: ArrayLike<number>, w?: ArrayLike<number>): { edges: number[]; counts: number[] } {
  let min = Infinity;
  let max = -Infinity;
  let W = 0;
  let allInt = true;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    if (v < min) min = v;
    if (v > max) max = v;
    if (!Number.isInteger(v)) allInt = false;
    W += w ? w[i] : 1;
  }
  if (!Number.isFinite(min)) return { edges: [0, 1], counts: [0] };
  let width: number;
  let start: number;
  if (allInt && max - min <= 40) {
    width = 1;
    start = min - 0.5;
  } else {
    const target = Math.max(5, Math.min(40, Math.ceil(Math.log2(Math.max(W, 2)) + 1) * 2));
    width = niceWidth(max - min || 1, target);
    start = Math.floor(min / width) * width;
  }
  const nb = Math.max(1, Math.floor((max - start) / width) + 1);
  const counts = new Array(nb).fill(0);
  for (let i = 0; i < x.length; i++) {
    let b = Math.floor((x[i] - start) / width);
    if (b >= nb) b = nb - 1;
    if (b < 0) b = 0;
    counts[b] += w ? w[i] : 1;
  }
  const edges = Array.from({ length: nb + 1 }, (_, i) => +(start + i * width).toPrecision(12));
  return { edges, counts };
}
