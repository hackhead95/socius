import { afterAll, expect } from 'vitest';
import raw from './fixtures/socio_data.json';

export type SocioData = Record<string, number[]>;
export const socio = raw as unknown as SocioData;

/** Largest relative error observed across all comparisons in this test run (reported by the suite). */
export const errorLog = { maxRel: 0, where: '' };

// Set MODELS_ERR_REPORT=1 to print the largest relative error per test file.
if (typeof process !== 'undefined' && process.env.MODELS_ERR_REPORT) {
  afterAll(() => console.log(`max relative error vs oracle: ${errorLog.maxRel.toExponential(2)} at ${errorLog.where}`));
}

/**
 * Assert |a - e| <= rel * |e| + abs. Records the largest relative error for reporting.
 */
export function close(actual: number, expected: number, rel = 1e-6, abs = 1e-9, label = ''): void {
  if (Number.isNaN(expected)) {
    expect(Number.isNaN(actual), `${label}: expected NaN, got ${actual}`).toBe(true);
    return;
  }
  const err = Math.abs(actual - expected);
  const r = err / Math.max(Math.abs(expected), 1e-300);
  if (Math.abs(expected) > 1e-8 && r > errorLog.maxRel) {
    errorLog.maxRel = r;
    errorLog.where = label;
  }
  expect(err <= rel * Math.abs(expected) + abs, `${label}: got ${actual}, expected ${expected} (rel err ${r.toExponential(2)})`).toBe(true);
}

export function closeAll(actual: ArrayLike<number>, expected: ArrayLike<number>, rel = 1e-6, abs = 1e-9, label = ''): void {
  expect(actual.length, `${label}: length`).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) close(actual[i], expected[i], rel, abs, `${label}[${i}]`);
}

export function col(name: string): Float64Array {
  const c = socio[name];
  if (!c) throw new Error(`no column ${name}`);
  return Float64Array.from(c);
}

export function ones(n: number): Float64Array {
  return new Float64Array(n).fill(1);
}

/** Dummy columns for the given category values (reference excluded). */
export function dummyCols(x: ArrayLike<number>, levels: number[]): Float64Array[] {
  return levels.map((lv) => Float64Array.from(Array.from(x, (v) => (v === lv ? 1 : 0))));
}

/**
 * Compare two loading matrices up to column reflection and column permutation. Each expected
 * column is matched with the actual column of the same index after optional sign flip, or with any
 * column (greedy) when `permute` is true.
 */
export function closeLoadings(actual: number[][], expected: number[][], rel = 1e-6, abs = 1e-7, label = '', permute = false): void {
  const m = expected[0].length;
  const used = new Set<number>();
  for (let k = 0; k < m; k++) {
    let best = -1, bestSign = 1, bestErr = Infinity;
    const candidates = permute ? Array.from({ length: m }, (_, j) => j).filter((j) => !used.has(j)) : [k];
    for (const j of candidates)
      for (const s of [1, -1]) {
        let err = 0;
        for (let i = 0; i < expected.length; i++) err = Math.max(err, Math.abs(s * actual[i][j] - expected[i][k]));
        if (err < bestErr) {
          bestErr = err;
          best = j;
          bestSign = s;
        }
      }
    used.add(best);
    for (let i = 0; i < expected.length; i++) close(bestSign * actual[i][best], expected[i][k], rel, abs, `${label}[${i}][${k}]`);
  }
}
