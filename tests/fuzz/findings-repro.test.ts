// Minimal reproductions of the open fuzz findings (docs/qa/FUZZ-FINDINGS.md). Each test asserts the
// CORRECT behaviour. While a finding's id is listed in tests/fuzz/known-issues.ts the test is expected to
// fail (it.fails); deleting the id from known-issues.ts turns it into a normal test that must pass, and
// re-arms the fuzz suites for that problem. If one of these starts "passing unexpectedly", the bug was
// fixed: delete its id from known-issues.ts.
import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable, type Dataset, type Variable } from '../../src/core/types';
import { getProcedure } from '../../src/procedures';
import { defaultOptions, type OptionValues, type SlotValues } from '../../src/core/procedure';
import type { OutputItem, OutputTable } from '../../src/core/output';
import { layoutRows } from '../../src/features/output/format';
import { validate as dialogValidate } from '../../src/features/analysis/varUtils';
import * as T from '../../src/lib/transform';
import { exportCsv, exportXlsx, importFile } from '../../src/lib/io';
import { KNOWN_ISSUES } from './known-issues';

const OPEN = new Set(KNOWN_ISSUES.map((k) => k.id));
const finding = (id: string, title: string, fn: () => unknown, timeout?: number) => (OPEN.has(id) ? it.fails : it)(`${id}: ${title}`, fn as () => void, timeout);

function ds(vars: Array<[Variable, Array<number | string>]>, extra: Partial<Dataset> = {}): Dataset {
  const columns: Dataset['columns'] = {};
  for (const [v, vals] of vars) columns[v.id] = v.type === 'string' ? (vals as string[]) : Float64Array.from(vals as number[]);
  return makeDataset({ name: 'repro', variables: vars.map(([v]) => v), columns, nCases: vars[0][1].length, ...extra });
}
const run = (id: string, d: Dataset, slots: SlotValues, opts: OptionValues = {}): OutputItem => {
  const def = getProcedure(id)!;
  return def.run(d, slots, { ...defaultOptions(def), ...opts });
};
const texts = (item: OutputItem, style?: string) => item.blocks.filter((b) => b.kind === 'text' && (!style || b.style === style)).map((b) => (b as { text: string }).text).join('\n');
const table = (item: OutputItem, title: RegExp) => item.blocks.map((b) => (b.kind === 'table' ? b.table : null)).find((t): t is OutputTable => !!t && title.test(t.title))!;

describe('open fuzz findings (minimal reproductions)', () => {
  finding('FZ-01', 'Aggregate MIN/MAX over a large group does not overflow the call stack', () => {
    const x = makeVariable({ name: 'x' });
    const d = ds([[x, Array.from({ length: 200_000 }, (_, i) => i % 1000)]]);
    expect(() => T.aggregate(d, { breakIds: [], items: [{ fn: 'max', sourceId: x.id, name: 'xmax' }], output: 'add' })).not.toThrow();
  });

  finding('FZ-02', 'Visual binning with a first cutpoint above the data gives a BinError, not a TypeError', () => {
    const x = makeVariable({ name: 'income' });
    const d = ds([[x, [10.5, 20.25, 30]]]); // non-integer data (integer data takes another label path)
    let err: unknown = null;
    try {
      T.visualBin(d, { sourceId: x.id, name: 'income_b', method: { kind: 'widthFrom', first: 1000, width: 5 } });
    } catch (e) {
      err = e;
    }
    expect(err === null || err instanceof T.BinError).toBe(true);
  });

  finding('FZ-03', 'Descriptives: S.E. mean without Mean keeps every value under its own header', () => {
    const x = makeVariable({ name: 'income' });
    const item = run('descriptives', ds([[x, [10, 20, 30, 40, 55]]]), { variables: [x.id] }, { mean: false, seMean: true });
    const t = table(item, /^Descriptive Statistics$/);
    expect(layoutRows(t.header).columns).toBe(layoutRows(t.rows).columns);
  });

  finding('FZ-04', 'Crosstabs Case Processing Summary counts missing cases with their weights', () => {
    const a = makeVariable({ name: 'a', measure: 'nominal', decimals: 0 });
    const b = makeVariable({ name: 'b', measure: 'nominal', decimals: 0 });
    const w = makeVariable({ name: 'w', decimals: 0 });
    const d = ds([[a, [1, 1, 2, NaN]], [b, [1, 2, 1, 1]], [w, [2, 2, 2, 3]]], {});
    const item = run('crosstabs', { ...d, weightVarId: w.id }, { rows: [a.id], columns: [b.id] });
    const row = table(item, /Case Processing Summary/).rows[0];
    // Valid N = 6 (weighted), Missing N must be 3 (weighted), Total N 9.
    expect(row.map((c) => c.v).filter((v) => typeof v === 'number')).toEqual([6, expect.any(Number), 3, expect.any(Number), 9, 100]);
  });

  finding('FZ-05', 'Select Cases never creates a duplicate variable name (filter_$ string + filter_$1 present)', () => {
    const f = makeVariable({ name: 'filter_$', type: 'string', width: 4 });
    const f1 = makeVariable({ name: 'filter_$1' });
    const age = makeVariable({ name: 'age' });
    const d = ds([[f, ['a', 'b', 'c']], [f1, [1, 2, 3]], [age, [20, 40, 60]]]);
    const r = T.selectCasesTransform(d, { kind: 'if', condition: 'age > 30' }, 'filter');
    const names = r.dataset.variables.map((v) => v.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  finding('FZ-06', 'One-way ANOVA: no "NaN" / "n/a" in the Welch APA sentence when Welch cannot be computed', () => {
    const y = makeVariable({ name: 'income' });
    const g = makeVariable({ name: 'trust', measure: 'ordinal', decimals: 0 });
    const item = run('oneway-anova', ds([[y, [41.55, 41.36, 61.89]], [g, [1, 1, 3]]]), { dependents: [y.id], factor: [g.id] });
    expect(texts(item)).not.toMatch(/NaN|= n\/a/);
  });

  finding('FZ-07', 'Correlations: no "r(-2) = n/a" APA sentence when a pair has no valid cases', () => {
    const x = makeVariable({ name: 'income' });
    const e = makeVariable({ name: 'notasked' });
    const item = run('correlations', ds([[x, [1, 2, 3, 4]], [e, [NaN, NaN, NaN, NaN]]]), { variables: [x.id, e.id] });
    expect(texts(item, 'apa')).not.toMatch(/\(-\d|= n\/a/);
  });

  finding('FZ-08', 'A confidence level of 50 (the dialog minimum) runs', () => {
    const x = makeVariable({ name: 'income' });
    const d = ds([[x, [1, 2, 3, 5, 8]]]);
    const def = getProcedure('ttest-one-sample')!;
    const opts = { ...defaultOptions(def), ciLevel: 50 };
    expect(dialogValidate(def, d, { variables: [x.id] }, opts)).toEqual([]);
    expect(() => def.run(d, { variables: [x.id] }, opts)).not.toThrow();
  });

  finding('FZ-09', 'Games-Howell on 3,000 cases and 7 groups takes well under a second', () => {
    const y = makeVariable({ name: 'y' });
    const g = makeVariable({ name: 'g', measure: 'nominal', decimals: 0 });
    const n = 3000;
    const d = ds([[y, Array.from({ length: n }, (_, i) => Math.sin(i) * 10 + (i % 7))], [g, Array.from({ length: n }, (_, i) => 1 + (i % 7))]]);
    const t0 = performance.now();
    run('oneway-anova', d, { dependents: [y.id], factor: [g.id] }, { gamesHowell: true });
    expect(performance.now() - t0).toBeLessThan(1500);
  }, 60_000);

  finding('FZ-10', 'Excel round trip keeps a blank ("") string missing value', async () => {
    // The codebook cell reads "DK, " and comes back as ["DK,"]: DK stops being missing, "" is lost.
    const s = makeVariable({ name: 'answer', type: 'string', width: 4, missing: { discrete: ['DK', ''] } });
    const d = ds([[s, ['yes', 'DK', '', 'no']]]);
    const back = (await importFile('rt.xlsx', new Uint8Array(await (await exportXlsx(d)).arrayBuffer()))).dataset;
    expect(back.variables[0].missing.discrete.slice().sort()).toEqual(['', 'DK']);
  });

  finding('FZ-11', 'Crosstabs exact tests: three 10x2 tables on 6,000 weighted cases finish within 2 seconds', () => {
    const n = 3000;
    const rows = [1, 2, 3].map((k) => makeVariable({ name: `r${k}`, measure: 'nominal', decimals: 0 }));
    const b = makeVariable({ name: 'b', measure: 'nominal', decimals: 0 });
    const w = makeVariable({ name: 'w', decimals: 0 });
    const d = ds([...rows.map((v, k): [Variable, number[]] => [v, Array.from({ length: n }, (_, i) => 1 + ((i * (7 + k)) % 10))]), [b, Array.from({ length: n }, (_, i) => 1 + ((i * 3) % 2))], [w, Array.from({ length: n }, () => 2)]]);
    const t0 = performance.now();
    run('crosstabs', { ...d, weightVarId: w.id }, { rows: rows.map((v) => v.id), columns: [b.id] }, { exact: 'exact' });
    expect(performance.now() - t0).toBeLessThan(2000);
  }, 60_000);

  finding('FZ-12', 'Deeply nested expressions give an ExprError, not a stack overflow', () => {
    const d = ds([[makeVariable({ name: 'x' }), [1]]]);
    let err: unknown = null;
    try {
      T.compileExpression(d, '('.repeat(2000) + '1' + ')'.repeat(2000)).evaluate(0);
    } catch (e) {
      err = e;
    }
    expect(err === null || err instanceof T.ExprError).toBe(true);
  });

  finding('FZ-13', 'Bin labels for negative numbers are unambiguous (no "--")', () => {
    expect(T.binLabels([-20, -10], -30, true).join(' | ')).not.toMatch(/\d--\d/);
    expect(T.binLabels([-11.52], -28.36, false).join(' | ')).not.toMatch(/\d--\d/);
  });

  finding('FZ-14', 'Descriptives / Explore APA text does not print "SD = n/a" for a single case', () => {
    const x = makeVariable({ name: 'income' });
    const item = run('descriptives', ds([[x, [42]]]), { variables: [x.id] });
    expect(texts(item, 'apa')).not.toMatch(/n\/a/);
  });

  finding('FZ-15', 'Chi-square expected-values message does not say "Infinity"', () => {
    const x = makeVariable({ name: 'region', measure: 'nominal', decimals: 0 });
    const d = ds([[x, [1, 2, 1, 2]]]);
    const def = getProcedure('chisquare-gof')!;
    const msgs = dialogValidate(def, d, { variables: [x.id] }, { ...defaultOptions(def), expected: 'values', expectedValues: '-1, 2' });
    expect(msgs.join(' ')).not.toMatch(/Infinity/);
  });

  finding('FZ-16', 'Chart interpretations never name an empty group ("For , the mean ...")', () => {
    const x = makeVariable({ name: 'wave', decimals: 0 });
    const y = makeVariable({ name: 'income' });
    const g = makeVariable({ name: 'place', type: 'string', width: 8 });
    const item = run('graph-line', ds([[x, [-30, -10]], [y, [-2.58, -28.74]], [g, ['', '']]]), { x: [x.id], y: [y.id], group: [g.id] });
    expect(texts(item)).not.toMatch(/For ,/);
  });

  finding('FZ-17', 'Excel round trip keeps value labels even when no case has a labelled value', async () => {
    const v = makeVariable({ name: 'sex', decimals: 0, measure: 'nominal', valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }] });
    const d = ds([[v, [NaN, NaN]]]);
    const back = (await importFile('rt.xlsx', new Uint8Array(await (await exportXlsx(d)).arrayBuffer()))).dataset;
    expect(back.variables[0].valueLabels).toHaveLength(2);
  });

  // Resolved as "intended, with warning": CSV has no dictionary, so numeric-looking text becomes
  // numbers and "NA" system-missing (the R convention), the warning names the column and says what
  // changed, and "Keep as text" (textColumns) brings the text back exactly. Socius-written Excel files
  // keep text columns as text (their Variables sheet is authoritative).
  finding('FZ-18', 'CSV import converts "NA" with a warning naming the column; Keep as text and XLSX keep the text', async () => {
    const s = makeVariable({ name: 'code', type: 'string', width: 4, valueLabels: [{ value: 'NA', label: 'Not asked' }], missing: { discrete: ['NA'] } });
    const d = ds([[s, ['1', '2', 'NA', '3']]]);
    const csv = new TextEncoder().encode(exportCsv(d));
    const conv = await importFile('rt.csv', csv);
    expect(Array.from(conv.dataset.columns[conv.dataset.variables[0].id] as ArrayLike<number>)).toEqual([1, 2, NaN, 3]);
    expect(conv.warnings.join('\n')).toMatch(/Read as numbers: code \("NA" became system-missing in 1 case\)/);
    const kept = (await importFile('rt.csv', csv, { textColumns: [0] })).dataset;
    expect(kept.columns[kept.variables[0].id]).toEqual(['1', '2', 'NA', '3']);
    const x = (await importFile('rt.xlsx', new Uint8Array(await (await exportXlsx(d)).arrayBuffer()))).dataset;
    expect(x.variables[0].type).toBe('string');
    expect(x.columns[x.variables[0].id]).toEqual(['1', '2', 'NA', '3']);
    expect(x.variables[0].valueLabels).toEqual([{ value: 'NA', label: 'Not asked' }]);
    expect(x.variables[0].missing.discrete).toEqual(['NA']);
  });

  finding('FZ-19', 'Aggregate does not suggest Minimum/Maximum for a string variable and then refuse them', () => {
    const s = makeVariable({ name: 'region', type: 'string', width: 8 });
    const d = ds([[s, ['North', 'South']]]);
    let sdMsg = '';
    try {
      T.aggregate(d, { breakIds: [], items: [{ fn: 'sd', sourceId: s.id, name: 'r_sd' }], output: 'add' });
    } catch (e) {
      sdMsg = (e as Error).message;
    }
    const suggestsMin = /Minimum/.test(sdMsg);
    let minOk = true;
    try {
      T.aggregate(d, { breakIds: [], items: [{ fn: 'min', sourceId: s.id, name: 'r_min' }], output: 'add' });
    } catch {
      minOk = false;
    }
    expect(suggestsMin && !minOk).toBe(false);
  });
});
