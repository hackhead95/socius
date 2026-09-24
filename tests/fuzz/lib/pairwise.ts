// All-pairs (pairwise) covering arrays, AETG-style greedy construction. Every pair of values of any two
// parameters appears in at least one generated row. Deterministic for a given rng.
import type { Rng } from './rng';

export type Param = { key: string; values: readonly unknown[] };

export function pairwise(params: Param[], rng: Rng, candidates = 24): Array<Record<string, unknown>> {
  const P = params.filter((p) => p.values.length > 0);
  if (!P.length) return [{}];
  if (P.length === 1) return P[0].values.map((v) => ({ [P[0].key]: v }));
  const uncovered = new Set<string>();
  const pk = (i: number, a: number, j: number, b: number) => `${i}:${a}|${j}:${b}`;
  for (let i = 0; i < P.length; i++)
    for (let j = i + 1; j < P.length; j++)
      for (let a = 0; a < P[i].values.length; a++) for (let b = 0; b < P[j].values.length; b++) uncovered.add(pk(i, a, j, b));
  const rows: number[][] = [];
  let guard = 0;
  while (uncovered.size && guard++ < 500) {
    let best: number[] | null = null;
    let bestGain = -1;
    for (let c = 0; c < candidates; c++) {
      // Start from one uncovered pair, then fill the rest greedily in random order.
      const first = [...uncovered][Math.floor(rng.next() * uncovered.size)];
      const [l, r] = first.split('|').map((s) => s.split(':').map(Number));
      const row = new Array<number>(P.length).fill(-1);
      row[l[0]] = l[1];
      row[r[0]] = r[1];
      const order = rng.shuffle(P.map((_, i) => i).filter((i) => row[i] < 0));
      for (const i of order) {
        let bv = 0;
        let bg = -1;
        const vals = rng.shuffle(P[i].values.map((_, k) => k));
        for (const v of vals) {
          let g = 0;
          for (let j = 0; j < P.length; j++) {
            if (j === i || row[j] < 0) continue;
            if (uncovered.has(i < j ? pk(i, v, j, row[j]) : pk(j, row[j], i, v))) g++;
          }
          if (g > bg) {
            bg = g;
            bv = v;
          }
        }
        row[i] = bv;
      }
      let gain = 0;
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (uncovered.has(pk(i, row[i], j, row[j]))) gain++;
      if (gain > bestGain) {
        bestGain = gain;
        best = row;
      }
    }
    if (!best || bestGain <= 0) break;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) uncovered.delete(pk(i, best[i], j, best[j]));
    rows.push(best);
  }
  return rows.map((row) => Object.fromEntries(row.map((v, i) => [P[i].key, P[i].values[v]])));
}
