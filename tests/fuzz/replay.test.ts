// Replay one procedure fuzz case and print its output (debug tool; skipped unless FUZZ_REPLAY is set).
//   FUZZ_REPLAY=crosstabs:2 [FUZZ_SEED=20260924] [FUZZ_VARIANT=weight|filter|missing] npx vitest run tests/fuzz/replay.test.ts
import { it } from 'vitest';
import { getProcedure } from '../../src/procedures';
import { itemToText } from '../../src/features/output/exportText';
import { suiteSeed } from './lib/rng';
import { buildCase, buildRows } from './lib/proc-cases';
import { replicateByWeight, subsetRows } from './lib/gen-data';
import { runChecked, userMissingAsSysmis, reproCode } from './lib/proc-harness';
import type { Dataset } from '../../src/core/types';

const target = process.env.FUZZ_REPLAY;

it.skipIf(!target)('replay a fuzz case', () => {
  const [id, row] = target!.split(':');
  const def = getProcedure(id)!;
  const SEED = suiteSeed(20260924);
  const rows = buildRows(SEED, def);
  const { c, gd, slot } = buildCase(SEED, def, rows[Number(row)], Number(row));
  const out = (s: string) => process.stdout.write(s + '\n');
  out(`# ${id}:${row} ${gd.desc}\n# slots ${slot.desc}\n# opts ${JSON.stringify(c.opts)}`);
  const show = (label: string, ds: Dataset) => {
    const r = runChecked(def, ds, c.slots, c.opts);
    out(`\n===== ${label}: ${r.kind} ${r.kind === 'threw' ? (r.error as Error).message : r.problems.join(' / ')}`);
    if (r.item) out(itemToText(r.item, { style: 'apa', includeInterpretations: true, includeSyntax: true }));
  };
  show('as generated', c.ds);
  const v = process.env.FUZZ_VARIANT;
  if (v === 'weight') show('replicated', replicateByWeight(c.ds));
  if (v === 'filter') {
    const f = c.ds.columns[c.ds.filterVarId!] as Float64Array;
    const keep = Array.from({ length: c.ds.nCases }, (_, i) => i).filter((i) => !Number.isNaN(f[i]) && f[i] !== 0);
    show('subset', { ...subsetRows(c.ds, keep), filterVarId: null });
  }
  if (v === 'missing') show('user-missing as sysmis', userMissingAsSysmis(c.ds));
  if (process.env.FUZZ_CODE) out(reproCode(c));
});
