// Performance: a 100,000 case x 200 variable file (generated at test time, never committed) must
// load in a few seconds.
import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable } from '../../src/core/types';
import type { Column, Variable } from '../../src/core/types';
import { writeSav } from '../../src/lib/io/sav-writer';
import { readSav } from '../../src/lib/io/sav-reader';

const N = 100_000;
const NUMERIC = 180;
const STRINGS = 20;

function bigDataset() {
  const variables: Variable[] = [];
  const columns: Record<string, Column> = {};
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let j = 0; j < NUMERIC; j++) {
    const v = makeVariable({ name: `q${j + 1}`, type: 'numeric', decimals: j % 3 === 0 ? 2 : 0 });
    const col = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const r = rand();
      col[i] = r < 0.03 ? NaN : j % 3 === 0 ? Math.round(r * 1e6) / 100 : Math.floor(r * 7) + 1;
    }
    variables.push(v);
    columns[v.id] = col;
  }
  const words = ['yes', 'no', 'Kolkata', 'Dhaka', 'মাঝে মাঝে', 'often', 'rarely', 'a much longer free text answer'];
  for (let j = 0; j < STRINGS; j++) {
    const v = makeVariable({ name: `s${j + 1}`, type: 'string', width: 40, format: 'A40' });
    const col = new Array<string>(N);
    for (let i = 0; i < N; i++) col[i] = words[Math.floor(rand() * words.length)];
    variables.push(v);
    columns[v.id] = col;
  }
  return makeDataset({ name: 'big', variables, columns, nCases: N });
}

describe('SPSS reader performance', () => {
  it('reads 100k cases x 200 variables in a few seconds (bytecode and zsav)', () => {
    const ds = bigDataset();
    for (const compression of ['bytecode', 'zsav'] as const) {
      const t0 = performance.now();
      const { bytes } = writeSav(ds, { compression });
      const t1 = performance.now();
      const { dataset } = readSav(bytes);
      const t2 = performance.now();
      console.log(`${compression}: ${(bytes.length / 1e6).toFixed(1)} MB, write ${(t1 - t0).toFixed(0)} ms, read ${(t2 - t1).toFixed(0)} ms`);
      expect(dataset.nCases).toBe(N);
      expect(dataset.variables.length).toBe(NUMERIC + STRINGS);
      const q1 = dataset.columns[dataset.variables[0].id] as Float64Array;
      const src = ds.columns[ds.variables[0].id] as Float64Array;
      expect(q1[N - 1]).toEqual(src[N - 1]);
      expect(dataset.columns[dataset.variables[NUMERIC + 4].id][N - 1]).toBe(ds.columns[ds.variables[NUMERIC + 4].id][N - 1]);
      // A few seconds on a developer machine; shared CI runners get more headroom.
      expect(t2 - t1).toBeLessThan(process.env.CI ? 15000 : 6000);
    }
  }, 120_000);
});
