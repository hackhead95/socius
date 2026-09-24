// Deterministic construction of the procedure fuzz cases, shared by the suite and the replay tool.
import type { ProcedureDef } from '../../../src/core/procedure';
import { makeRng, fuzzScale } from './rng';
import { pairwise, type Param } from './pairwise';
import { genDataset, type GenDataset } from './gen-data';
import { assignSlots, optionDomain, resolveOptions, type CaseSpec, type SlotChoice } from './proc-harness';

export function rowSeed(suite: number, defId: string, i: number): number {
  return makeRng(suite).fork(`${defId}#${i}`).seed;
}

/** Pairwise covering rows (dataset state x options) plus random rows; row 0 = defaults on a typical dataset. */
export function buildRows(suite: number, def: ProcedureDef): Array<Record<string, unknown>> {
  const rng = makeRng(suite).fork(def.id);
  const params: Param[] = [
    { key: '$n', values: [1, 2, 3, 8, 40, 150] },
    { key: '$weight', values: ['none', 'int', 'frac', 'bad'] },
    { key: '$filter', values: [false, true] },
    { key: '$slots', values: ['min', 'more', 'reuse'] },
    ...def.options.map((o) => ({ key: o.key, values: optionDomain(o) })),
  ];
  const rows = pairwise(params, rng);
  const nRandom = Math.round(12 * fuzzScale());
  for (let i = 0; i < nRandom; i++) rows.push(Object.fromEntries(params.map((p) => [p.key, rng.pick(p.values)])));
  rows.unshift({ $n: 40, $weight: 'none', $filter: false, $slots: 'min' });
  return rows;
}

export function buildCase(suite: number, def: ProcedureDef, row: Record<string, unknown>, i: number): { c: CaseSpec; gd: GenDataset; slot: SlotChoice } {
  const seed = rowSeed(suite, def.id, i);
  const r = makeRng(seed);
  const gd = genDataset(r, { nCases: row.$n as number, weight: row.$weight as 'none', filter: row.$filter as boolean });
  const slot = assignSlots(r, def, gd.ds, row.$slots as 'min');
  const opts = resolveOptions(r, def, gd.ds, slot.slots, row);
  return { c: { def, ds: gd.ds, slots: slot.slots, opts, seed }, gd, slot };
}
