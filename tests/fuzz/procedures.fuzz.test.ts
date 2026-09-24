// Combinatorial fuzzing of every ProcedureDef: datasets x UI-valid slot assignments x a pairwise
// (all-pairs) covering set of option values and dataset states, plus random samples.
//
// Invariants per run: the dialog's validation and run() never throw an internal error; messages are
// plain English; output is plain JSON, tables are rectangular (with spans), no NaN/undefined/
// [object Object] in text or rendered cells; syntax present; APA/interpretation text when p-values
// are shown; run() does not mutate the dataset.
// Metamorphic relations: integer weights == replicated cases; filter == removing cases; declared
// user-missing codes == system-missing.
//
// Reproduce: FUZZ_SEED=<suite seed> FUZZ_ONLY=<procedure id>[:row] npx vitest run tests/fuzz/procedures.fuzz.test.ts
import { describe, expect, it } from 'vitest';
import { procedures } from '../../src/procedures';
import type { ProcedureDef } from '../../src/core/procedure';
import { defaultOptions } from '../../src/core/procedure';
import { makeRng, suiteSeed } from './lib/rng';
import { buildCase, buildRows, rowSeed } from './lib/proc-cases';
import { genDataset } from './lib/gen-data';
import { Collector, type Failure } from './lib/findings';
import {
  assignSlots, checkFilterSubset, checkRun, checkUserMissing, checkWeightReplication, invalidOptionValues, reproCode, resolveOptions, runChecked, sameFailure, shrinkCase,
  type CaseSpec,
} from './lib/proc-harness';
import { badWords, errorProblems } from './lib/invariants';

const SEED = suiteSeed(20260924);
const ONLY = process.env.FUZZ_ONLY ?? '';
const col = new Collector('procedures');

// Tables that legitimately differ when user-missing codes become system-missing (they list the codes).
const LISTS_MISSING_CODES = /Frequency Table|^Statistics$|Case Processing|Missing/i;

function fuzzProcedure(def: ProcedureDef) {
  const rows = buildRows(SEED, def);
  let ran = 0, blocked = 0, threw = 0;
  rows.forEach((row, i) => {
    if (ONLY && ONLY !== def.id && ONLY !== `${def.id}:${i}`) return;
    const { c, gd, slot } = buildCase(SEED, def, row, i);
    const seed = c.seed;
    const opts = c.opts;
    const report = (check: string, detail: string, fails: (c: CaseSpec) => boolean) => {
      const f: Failure = { area: 'procedures', subject: def.id, check, detail, seed };
      if (col.count(f) === 0 && check !== 'slow') {
        const small = shrinkCase(c, fails);
        f.repro = `// suite seed ${SEED}, row ${i} (FUZZ_ONLY=${def.id}:${i}); generated: ${gd.desc}; slots: ${slot.desc}\n` + reproCode(small);
      }
      col.add(f);
    };

    for (const p of checkRun(c)) report(p.check, p.detail, (cc) => sameFailure('procedures', def.id, p.check, p.detail)(checkRun(cc)));

    const outcome = runChecked(def, gd.ds, slot.slots, opts);
    if (outcome.kind === 'ok') ran++;
    else if (outcome.kind === 'blocked') blocked++;
    else {
      threw++;
      col.note(def.id, (outcome.error as Error)?.message ?? String(outcome.error));
    }
    if (outcome.kind !== 'ok' || gd.ds.nCases < 3) return;

    if (row.$weight === 'int') {
      const m = checkWeightReplication(c);
      if (m) report('weight', `integer weights differ from replicated cases: ${m}`, (cc) => !!checkWeightReplication(cc));
    }
    if (row.$filter && row.$weight !== 'bad') {
      const m = checkFilterSubset(c);
      if (m) report('filter', `filtered result differs from the same cases without a filter: ${m}`, (cc) => !!checkFilterSubset(cc));
    }
    if (row.$weight === 'none' && i % 2 === 0) {
      const m = checkUserMissing(c, (t) => LISTS_MISSING_CODES.test(t));
      if (m) report('missing', `user-missing codes not treated like system-missing: ${m}`, (cc) => !!checkUserMissing(cc, (t) => LISTS_MISSING_CODES.test(t)));
    }
  });

  // Invalid numeric option values must be blocked by the dialog with a readable message.
  const gd = genDataset(makeRng(rowSeed(SEED, def.id, -1)), { nCases: 30 });
  const slot = assignSlots(makeRng(rowSeed(SEED, def.id, -2)), def, gd.ds, 'min');
  for (const o of def.options) {
    for (const bad of invalidOptionValues(o)) {
      const opts = { ...resolveOptions(makeRng(1), def, gd.ds, slot.slots, {}), [o.key]: bad };
      const out = runChecked(def, gd.ds, slot.slots, opts);
      const f = (check: string, detail: string): Failure => ({ area: 'procedures', subject: def.id, check, detail, seed: rowSeed(SEED, def.id, -1), repro: `// dialog validate + run with option ${o.key} = ${JSON.stringify(bad)} on a generated dataset (seed ${rowSeed(SEED, def.id, -1)}); slots ${slot.desc}` });
      if (out.kind === 'threw') for (const p of errorProblems(out.error)) col.add(f('invalid-option', `${o.key}=${String(bad)}: ${p}`));
      if (out.kind === 'ok' && (typeof bad !== 'number' || !Number.isNaN(bad))) col.add(f('invalid-option', `${o.key}=${JSON.stringify(bad)} (outside ${'min' in o ? o.min : ''}..${'max' in o ? o.max : ''}) was accepted and run`));
      if (out.kind === 'ok' && typeof bad === 'number' && Number.isNaN(bad)) col.add(f('invalid-option', `${o.key}=NaN was accepted and run`));
      if (out.kind === 'blocked') for (const p of out.problems) for (const b of badWords(p)) col.add(f('validate-text', `invalid ${o.key}: message contains ${b}: "${p}"`));
    }
  }
  // Boundary values the dialog accepts (min / max of number options) must run wherever the default runs.
  {
    const base = buildCase(SEED, def, rows[0], 0).c;
    if (runChecked(def, base.ds, base.slots, base.opts).kind === 'ok') {
      for (const o of def.options) {
        if (o.type !== 'number') continue;
        for (const edge of [o.min, o.max]) {
          if (edge === undefined) continue;
          const r = runChecked(def, base.ds, base.slots, { ...base.opts, [o.key]: edge });
          const msg = r.kind === 'threw' ? (r.error as Error).message : r.kind === 'blocked' ? r.problems[0] : '';
          // Only a range complaint is a contradiction; data-driven messages at an extreme setting are fine.
          if ((r.kind === 'threw' || r.kind === 'blocked') && /between|must be|range/i.test(msg))
            col.add({
              area: 'procedures', subject: def.id, check: 'boundary', seed: base.seed,
              detail: `${o.key}=${edge} is allowed by the dialog (${o.min}..${o.max}) but the run ${r.kind === 'threw' ? 'fails' : 'is blocked'}: "${r.kind === 'threw' ? (r.error as Error).message : r.problems[0]}"`,
              repro: `// FUZZ_ONLY=${def.id}:0, then set option ${o.key} to ${edge}\n` + reproCode({ ...base, opts: { ...base.opts, [o.key]: edge } }).split('\n').slice(-2).join('\n'),
            });
        }
      }
    }
  }
  return { rows: rows.length, ran, blocked, threw };
}

describe('procedures x data x options (pairwise)', () => {
  const stats: string[] = [];
  for (const def of procedures) {
    it(`${def.id}`, () => {
      const s = fuzzProcedure(def);
      stats.push(`${def.id}: ${s.rows} rows, ${s.ran} ran, ${s.blocked} blocked, ${s.threw} threw`);
      expect(defaultOptions(def)).toBeTruthy();
    }, 120_000);
  }

  it('no new failures (known ones are listed in tests/fuzz/known-issues.ts)', () => {
    const g = col.gate();
    process.stdout.write(`[fuzz:procedures] seed ${SEED}\n` + stats.join("\n") + "\n");
    process.stdout.write(g.summary + "\n");
    if (g.known.length) process.stdout.write(`known: ${[...new Set(g.known.map((k) => k.id))].join(', ')}` + "\n");
    expect(g.unknown, g.summary).toEqual([]);
  });
});
