// Large-input behaviour: every procedure with every checkbox option on (and each select choice) on a
// 3,000-case dataset. Invariants: finishes within 3 s (the analysis runs on the page's main thread, so a
// slow run freezes the app), never throws an internal error.
// Reproduce: FUZZ_SEED=<seed> npx vitest run tests/fuzz/procedures-perf.fuzz.test.ts
import { describe, expect, it } from 'vitest';
import { procedures } from '../../src/procedures';
import { defaultOptions, type OptionValues } from '../../src/core/procedure';
import { makeRng, suiteSeed } from './lib/rng';
import { genDataset } from './lib/gen-data';
import { assignTypical, resolveOptions, runChecked } from './lib/proc-harness';
import { errorProblems } from './lib/invariants';
import { Collector } from './lib/findings';

const SEED = suiteSeed(5150);
const N = Number(process.env.FUZZ_PERF_N ?? 3000);
const LIMIT_MS = Number(process.env.FUZZ_SLOW_MS ?? 3000);
const col = new Collector('procedures-perf');
const out = (s: string) => process.stdout.write(s + '\n');

describe(`procedures on ${N} cases, all options on`, () => {
  const timings: string[] = [];
  for (const def of procedures) {
    it(def.id, () => {
      const rng = makeRng(SEED).fork(def.id);
      const { ds, desc, meta } = genDataset(rng, { nCases: N, extra: 2, weight: 'int' });
      const slot = assignTypical(rng, def, ds, meta);
      const base = resolveOptions(rng, def, ds, slot.slots, { groups: 'pair:valid', sides: 'pair:valid' });
      const variants: OptionValues[] = [];
      const allOn: OptionValues = { ...base };
      for (const o of def.options) if (o.type === 'checkbox') allOn[o.key] = true;
      variants.push(allOn);
      for (const o of def.options) if (o.type === 'select') for (const c of o.choices) variants.push({ ...allOn, [o.key]: c.value });
      let worst = 0;
      const kinds: Record<string, number> = {};
      for (const opts of variants) {
        const r = runChecked(def, ds, slot.slots, opts);
        worst = Math.max(worst, r.ms);
        const k = r.kind === 'ok' ? 'ok' : r.kind === 'blocked' ? `blocked (${r.problems[0]?.slice(0, 60)})` : `threw (${(r.error as Error)?.message?.slice(0, 60)})`;
        kinds[k] = (kinds[k] ?? 0) + 1;
        const changed = Object.fromEntries(Object.entries(opts).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(defaultOptions(def)[k])));
        const repro = `// genDataset(makeRng(makeRng(${SEED}).fork(${JSON.stringify(def.id)}).seed), { nCases: ${N}, extra: 2, weight: 'int' }) -> ${desc}\n// slots: ${slot.desc}\n// options: ${JSON.stringify(changed)}`;
        if (r.ms > LIMIT_MS) col.add({ area: 'procedures', subject: def.id, check: 'slow', detail: `${Math.round(r.ms)} ms on ${N} cases with ${Object.keys(changed).filter((k) => changed[k] === true).join(', ') || 'defaults'}${Object.entries(changed).filter(([, v]) => typeof v === 'string').map(([k, v]) => ` ${k}=${v}`).join('')}`, seed: SEED, repro });
        if (r.kind === 'threw') for (const p of errorProblems(r.error)) col.add({ area: 'procedures', subject: def.id, check: 'throw', detail: p, seed: SEED, repro });
      }
      timings.push(`${def.id}: worst ${Math.round(worst)} ms over ${variants.length} option sets ${JSON.stringify(kinds)} slots ${slot.desc.slice(0, 120)}`);
      expect(worst).toBeGreaterThanOrEqual(0);
    }, 180_000);
  }
  it('gate: no new failures (known ones are listed in tests/fuzz/known-issues.ts)', () => {
    out(timings.join('\n'));
    const g = col.gate();
    out(g.summary);
    expect(g.unknown, g.summary).toEqual([]);
  });
});
