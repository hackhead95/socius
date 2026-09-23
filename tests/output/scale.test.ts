import { describe, expect, it } from 'vitest';
import { arcPath, band, barPath, extent, formatTick, labelStride, legendLayout, linear, niceStep, niceTicks, normalCurvePoints, pieAngles, PointIndex, stepDecimals, truncateLabel } from '../../src/features/charts/scale';

describe('nice ticks', () => {
  it('niceStep picks 1/2/2.5/5 x 10^k', () => {
    expect(niceStep(0.7)).toBe(1);
    expect(niceStep(1.3)).toBe(2);
    expect(niceStep(2.2)).toBe(2.5);
    expect(niceStep(3.2)).toBe(5);
    expect(niceStep(7)).toBe(10);
    expect(niceStep(180)).toBe(200);
    expect(niceStep(0.03)).toBeCloseTo(0.05);
  });
  it('covers the data with whole steps', () => {
    const t = niceTicks(3, 97, 5);
    expect(t.min).toBe(0);
    expect(t.max).toBe(100);
    expect(t.values).toEqual([0, 20, 40, 60, 80, 100]);
  });
  it('handles decimals without float noise', () => {
    const t = niceTicks(0.1, 0.7, 6);
    expect(t.values).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]);
  });
  it('handles negative and degenerate ranges', () => {
    expect(niceTicks(-0.8, 0.9, 4).values).toEqual([-1, -0.5, 0, 0.5, 1]);
    const d = niceTicks(5, 5);
    expect(d.min).toBeLessThan(5);
    expect(d.max).toBeGreaterThan(5);
    const z = niceTicks(0, 0);
    expect(z.values.length).toBeGreaterThan(1);
    expect(niceTicks(NaN, Infinity).values.length).toBeGreaterThan(1);
  });
  it('formats ticks by step', () => {
    expect(stepDecimals(0.25)).toBe(2);
    expect(stepDecimals(5)).toBe(0);
    expect(formatTick(2500, 500)).toBe('2,500');
    expect(formatTick(0.5, 0.25)).toBe('0.50');
    expect(formatTick(40, 10, true)).toBe('40%');
    expect(formatTick(3000000, 1000000)).toBe('3M');
  });
});

describe('scales', () => {
  it('linear maps and inverts direction', () => {
    const y = linear(0, 100, 200, 0);
    expect(y(0)).toBe(200);
    expect(y(50)).toBe(100);
  });
  it('band divides the range', () => {
    const b = band(4, 0, 400);
    expect(b.bandwidth).toBe(100);
    expect(b.center(1)).toBe(150);
    expect(b.indexAt(399)).toBe(3);
    expect(b.indexAt(401)).toBe(-1);
  });
  it('extent ignores non-finite values', () => {
    expect(extent([3, NaN, null, -2, 7, Infinity])).toEqual([-2, 7]);
    expect(extent([])).toBeNull();
  });
  it('normal curve integrates to about n', () => {
    const edges = Array.from({ length: 41 }, (_, i) => -4 + i * 0.2);
    const pts = normalCurvePoints(edges, { mean: 0, sd: 1, n: 1000 }, 400);
    // Sum of expected counts over bins ~ n: integrate the density scaled by bin width.
    let area = 0;
    for (let i = 1; i < pts.length; i++) area += ((pts[i][1] + pts[i - 1][1]) / 2) * (pts[i][0] - pts[i - 1][0]);
    expect(area / 0.2).toBeGreaterThan(995);
    expect(area / 0.2).toBeLessThan(1001);
  });
  it('pie angles sum to a full circle', () => {
    const a = pieAngles([1, 1, 2, 0]);
    expect(a[2].share).toBe(0.5);
    expect(a[3].share).toBe(0);
    expect(a[2].end - a[0].start).toBeCloseTo(Math.PI * 2);
    expect(arcPath(0, 0, 10, 5, 0, Math.PI)).toMatch(/^M/);
    expect(arcPath(0, 0, 10, 5, 0, 0)).toBe('');
  });
  it('bar paths are empty for zero size and closed otherwise', () => {
    expect(barPath(0, 0, 0, 10, 4, 'top')).toBe('');
    expect(barPath(0, 0, 10, 10, 4, 'top')).toMatch(/Z$/);
  });
});

describe('labels', () => {
  it('truncates with an ellipsis', () => {
    const t = truncateLabel('A very long category label indeed', 60, 11);
    expect(t.endsWith('…')).toBe(true);
    expect(truncateLabel('Short', 200, 11)).toBe('Short');
  });
  it('thins labels that would overlap', () => {
    expect(labelStride(50, 10, 40)).toBe(5);
    expect(labelStride(3, 100, 40)).toBe(1);
  });
  it('wraps legend items', () => {
    const l = legendLayout(['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'], 120, 12);
    expect(l.rows).toBeGreaterThan(1);
    expect(l.items[0].x).toBe(0);
  });
  it('finds the nearest point', () => {
    const xs = Float64Array.from([10, 50, 100]);
    const ys = Float64Array.from([10, 50, 100]);
    const idx = new PointIndex(xs, ys, 24);
    expect(idx.nearest(52, 49)).toBe(1);
    expect(idx.nearest(300, 300)).toBe(-1);
  });
});
