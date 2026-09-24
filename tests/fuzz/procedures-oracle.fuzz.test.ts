// Numerical cross-check of a random subset of procedure runs against scipy / statsmodels / pingouin
// (scripts/fuzz/oracle.py through /opt/oracle/bin/python). Random datasets (unweighted and with integer
// frequency weights, filter on/off, user-missing codes, ties) -> run the procedure -> read the statistic
// from the output table -> compare with the oracle on the same cases (weights replicated).
// Skipped with a note when the Python oracle is not installed (CI).
// Reproduce: FUZZ_SEED=<seed> npx vitest run tests/fuzz/procedures-oracle.fuzz.test.ts
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getProcedure } from '../../src/procedures';
import { defaultOptions, type OptionValues, type SlotValues } from '../../src/core/procedure';
import type { Cell, OutputItem, OutputTable } from '../../src/core/output';
import { selectCases, isMissingValue } from '../../src/core/data';
import type { Dataset, Variable } from '../../src/core/types';
import { layoutRows } from '../../src/features/output/format';
import { makeRng, suiteSeed, fuzzScale, type Rng } from './lib/rng';
import { genDataset, type GenDataset, type VarKind, datasetToCode, keepVariables } from './lib/gen-data';
import { Collector } from './lib/findings';

const SEED = suiteSeed(31337);
const PYTHON = '/opt/oracle/bin/python';
const HAS_ORACLE = existsSync(PYTHON) && !process.env.SOCIUS_NO_ORACLE;
const ORACLE = resolve(__dirname, '..', '..', 'scripts', 'fuzz', 'oracle.py');
const col = new Collector('procedures-oracle');
const out = (s: string) => process.stdout.write(s + '\n');

// ---------- reading numbers out of output tables ----------

interface Grid {
  table: OutputTable;
  head: string[]; // per absolute column: all header texts covering it, joined with " | "
  body: Array<Array<Cell | undefined>>;
  stub: string[]; // per body row: stub texts joined
}

function grid(t: OutputTable): Grid {
  const hl = layoutRows(t.header);
  const head: string[] = [];
  hl.grid.forEach((row) => row.forEach((g) => { for (let c = g.col; c < g.col + g.colSpan; c++) head[c] = (head[c] ? head[c] + ' | ' : '') + String(g.cell.v ?? ''); }));
  const bl = layoutRows(t.rows);
  const body: Array<Array<Cell | undefined>> = t.rows.map(() => []);
  bl.grid.forEach((row, r) => row.forEach((g) => { for (let rr = r; rr < r + g.rowSpan && rr < body.length; rr++) for (let c = g.col; c < g.col + g.colSpan; c++) body[rr][c] = g.cell; }));
  const nStub = t.stubColumns ?? 1;
  const stub = body.map((row) => row.slice(0, nStub).map((c) => String(c?.v ?? '')).join(' | '));
  return { table: t, head, body, stub };
}

function tablesOf(item: OutputItem, title: RegExp): Grid[] {
  return item.blocks.filter((b) => b.kind === 'table' && title.test(b.table.title)).map((b) => grid((b as { table: OutputTable }).table));
}

/** Number at (first row whose stub matches, first column whose header path matches). */
function num(item: OutputItem, title: RegExp, row: RegExp, colRe: RegExp | number, which = 0): number | undefined {
  for (const g of tablesOf(item, title)) {
    const rows = g.stub.map((s, i) => (row.test(s) ? i : -1)).filter((i) => i >= 0);
    const r = rows[which];
    if (r === undefined) continue;
    const c = typeof colRe === 'number' ? colRe : g.head.findIndex((h, i) => i >= (g.table.stubColumns ?? 1) && colRe.test(h ?? ''));
    if (c < 0) continue;
    const v = g.body[r][c]?.v;
    if (typeof v === 'number') return v;
    // Very small coefficients are shown as text in scientific notation ("1.455E-4"): 4 significant digits.
    if (typeof v === 'string' && /^-?\d*\.?\d+E[-+]?\d+$/i.test(v.trim())) return Number(v);
  }
  return undefined;
}

// ---------- case construction ----------

const byKind = (gd: GenDataset, kinds: VarKind[]) => gd.meta.filter((m) => kinds.includes(m.kind)).map((m) => gd.ds.variables.find((v) => v.id === m.id)!);

function valuesOf(ds: Dataset, v: Variable, rows: number[]): number[] {
  const c = ds.columns[v.id] as Float64Array;
  return rows.map((i) => c[i]);
}

interface OracleCase {
  label: string;
  seed: number;
  item: OutputItem;
  req: Record<string, unknown>;
  compare: Array<{ name: string; ours: number | undefined; key: string; idx?: number; abs?: boolean; tol?: number }>;
  repro: string;
}

function weightsFor(ds: Dataset, rows: number[], w: Float64Array): number[] | null {
  return ds.weightVarId ? rows.map((_, k) => w[k]) : null;
}

function buildCases(rng: Rng, seed: number): OracleCase[] {
  const weight = rng.pick(['none', 'int'] as const);
  const gd = genDataset(rng, { nCases: rng.pick([15, 40, 120]), weight, filter: rng.bool(0.3), extra: rng.int(0, 2), sysmisRate: 0.05, unicode: false });
  const ds = gd.ds;
  const scale = byKind(gd, ['scale', 'scaleTies']);
  const bins = byKind(gd, ['binary']);
  const cats = byKind(gd, ['cat', 'likert']);
  const cases: OracleCase[] = [];
  const run = (id: string, slots: SlotValues, o: OptionValues = {}) => {
    const def = getProcedure(id)!;
    try {
      return def.run(ds, slots, { ...defaultOptions(def), ...o });
    } catch {
      return null;
    }
  };
  const repro = (id: string, slots: SlotValues, o: OptionValues = {}) =>
    `${datasetToCode(keepVariables(ds, new Set(Object.values(slots).flat())))}\nconst def = getProcedure(${JSON.stringify(id)})!;\ndef.run(ds, ${JSON.stringify(slots)}, { ...defaultOptions(def), ...${JSON.stringify(o)} });`;
  const add = (c: Omit<OracleCase, 'seed'>) => cases.push({ ...c, seed });
  const [y, x1, x2] = rng.shuffle(scale.slice());
  const g = bins[0];

  // Descriptives
  {
    const slots = { variables: [y.id] };
    const item = run('descriptives', slots, { skewness: true, kurtosis: true });
    const sel = selectCases(ds, [y.id]);
    if (item && sel.rows.length >= 4)
      add({
        label: 'descriptives', item, repro: repro('descriptives', slots, { skewness: true, kurtosis: true }),
        req: { kind: 'descriptives', x: valuesOf(ds, y, sel.rows), w: weightsFor(ds, sel.rows, sel.weights) },
        compare: [
          { name: 'Mean', ours: num(item, /^Descriptive Statistics$/, /./, /^Mean/), key: 'mean' },
          { name: 'Std. Deviation', ours: num(item, /^Descriptive Statistics$/, /./, /^Std\. Deviation/), key: 'sd' },
          { name: 'Skewness', ours: num(item, /^Descriptive Statistics$/, /./, /^Skewness \| Statistic/), key: 'skew' },
          { name: 'Kurtosis', ours: num(item, /^Descriptive Statistics$/, /./, /^Kurtosis \| Statistic/), key: 'kurt' },
        ],
      });
  }
  // One-sample t
  {
    const mu = rng.pick([0, 50, 1]);
    const slots = { variables: [y.id] };
    const item = run('ttest-one-sample', slots, { testValue: mu });
    const sel = selectCases(ds, [y.id]);
    if (item && sel.rows.length >= 3)
      add({
        label: 'ttest-one-sample', item, repro: repro('ttest-one-sample', slots, { testValue: mu }),
        req: { kind: 'ttest_1samp', x: valuesOf(ds, y, sel.rows), w: weightsFor(ds, sel.rows, sel.weights), mu },
        compare: [
          { name: 't', ours: num(item, /^One-Sample Test$/, /./, /(^| )t$/), key: 't' },
          { name: 'p', ours: num(item, /^One-Sample Test$/, /./, /Two-Sided p/), key: 'p', abs: true },
        ],
      });
  }
  // Independent t / Mann-Whitney on a binary group
  if (g) {
    const sel = selectCases(ds, [y.id, g.id]);
    const gc = ds.columns[g.id] as Float64Array;
    const vals = [...new Set(sel.rows.map((i) => gc[i]))].sort((a, b) => a - b);
    if (vals.length === 2) {
      const split = (v: number) => {
        const k = sel.rows.map((i, j) => (gc[i] === v ? j : -1)).filter((j) => j >= 0);
        return { x: k.map((j) => (ds.columns[y.id] as Float64Array)[sel.rows[j]]), w: ds.weightVarId ? k.map((j) => sel.weights[j]) : null };
      };
      const A = split(vals[0]), B = split(vals[1]);
      if (A.x.length >= 2 && B.x.length >= 2) {
        const slots = { variables: [y.id], group: [g.id] };
        const item = run('ttest-independent', slots, { groups: vals });
        if (item)
          add({
            label: 'ttest-independent', item, repro: repro('ttest-independent', slots, { groups: vals }),
            req: { kind: 'ttest_ind', a: A.x, wa: A.w, b: B.x, wb: B.w },
            compare: [
              { name: 't (equal var)', ours: num(item, /^Independent Samples Test$/, /Equal variances assumed/, /\| t$/), key: 't' },
              { name: 'p (equal var)', ours: num(item, /^Independent Samples Test$/, /Equal variances assumed/, /Two-Sided p/), key: 'p', abs: true },
              { name: 't (Welch)', ours: num(item, /^Independent Samples Test$/, /not assumed/, /\| t$/), key: 'tw' },
              { name: 'df (Welch)', ours: num(item, /^Independent Samples Test$/, /not assumed/, /\| df$/), key: 'dfw' },
              { name: 'p (Welch)', ours: num(item, /^Independent Samples Test$/, /not assumed/, /Two-Sided p/), key: 'pw', abs: true },
              { name: 'Levene F', ours: num(item, /^Independent Samples Test$/, /Equal variances assumed/, /Levene.*\| F$/), key: 'levene' },
            ],
          });
        const mw = run('mann-whitney', slots, { groups: vals });
        if (mw)
          add({
            label: 'mann-whitney', item: mw, repro: repro('mann-whitney', slots, { groups: vals }),
            req: { kind: 'mannwhitney', a: A.x, wa: A.w, b: B.x, wb: B.w },
            compare: [
              { name: 'U', ours: num(mw, /^Test Statistics$/, /Mann-Whitney U/, 1), key: 'U' },
              { name: 'Asymp. p', ours: num(mw, /^Test Statistics$/, /Asymp\. Sig/, 1), key: 'p', abs: true },
            ],
          });
      }
    }
  }
  // One-way ANOVA / Kruskal-Wallis on a categorical factor
  const f = cats[0];
  if (f) {
    const sel = selectCases(ds, [y.id, f.id]);
    const fc = ds.columns[f.id] as Float64Array;
    const levels = [...new Set(sel.rows.map((i) => fc[i]))].sort((a, b) => a - b);
    const groups = levels.map((lv) => sel.rows.map((i, j) => (fc[i] === lv ? j : -1)).filter((j) => j >= 0));
    if (levels.length >= 2 && groups.every((gr) => gr.length >= 2)) {
      const gx = groups.map((gr) => gr.map((j) => (ds.columns[y.id] as Float64Array)[sel.rows[j]]));
      const gw = ds.weightVarId ? groups.map((gr) => gr.map((j) => sel.weights[j])) : null;
      const slots = { dependents: [y.id], factor: [f.id] };
      const item = run('oneway-anova', slots);
      // Welch's test is undefined when a group has zero variance (SPSS omits it); pingouin still reports one.
      const zeroVar = gx.some((xs) => xs.every((x) => x === xs[0]));
      if (item)
        add({
          label: 'oneway-anova', item, repro: repro('oneway-anova', slots),
          req: { kind: 'anova', groups: gx, gw },
          compare: [
            { name: 'F', ours: num(item, /^ANOVA$/, /Between Groups/, /^F$/), key: 'F' },
            { name: 'p', ours: num(item, /^ANOVA$/, /Between Groups/, /^Sig/), key: 'p', abs: true },
            { name: 'Levene (mean)', ours: num(item, /Homogeneity/, /Based on Mean/, /Levene/), key: 'levene' },
            ...(zeroVar ? [] : [{ name: 'Welch F', ours: num(item, /Robust Tests/, /Welch/, /Statistic/), key: 'welchF' },
            { name: 'Welch df2', ours: num(item, /Robust Tests/, /Welch/, /df2/), key: 'welchDf2' },
            { name: 'Welch p', ours: num(item, /Robust Tests/, /Welch/, /Sig/), key: 'welchP', abs: true }]),
          ],
        });
      const kslots = { variables: [y.id], group: [f.id] };
      const kw = run('kruskal-wallis', kslots);
      if (kw)
        add({
          label: 'kruskal-wallis', item: kw, repro: repro('kruskal-wallis', kslots),
          req: { kind: 'kruskal', groups: gx, gw },
          compare: [
            { name: 'H', ours: num(kw, /^Test Statistics$/, /Kruskal-Wallis H/, 1), key: 'H' },
            { name: 'p', ours: num(kw, /^Test Statistics$/, /Asymp\. Sig/, 1), key: 'p', abs: true },
          ],
        });
    }
  }
  // Correlations, Wilcoxon, Friedman, OLS
  if (x1 && x2) {
    const sel = selectCases(ds, [y.id, x1.id]);
    if (sel.rows.length >= 4) {
      const slots = { variables: [y.id, x1.id] };
      const o = { spearman: true, kendall: true, missing: 'listwise' };
      const item = run('correlations', slots, o);
      if (item)
        add({
          label: 'correlations', item, repro: repro('correlations', slots, o),
          req: { kind: 'corr', x: valuesOf(ds, y, sel.rows), y: valuesOf(ds, x1, sel.rows), w: weightsFor(ds, sel.rows, sel.weights) },
          compare: [
            { name: 'Pearson r', ours: num(item, /^Correlations$/, /Pearson Correlation/, -1 as never), key: 'r' },
            { name: 'Pearson p', ours: undefined, key: 'p', abs: true },
            { name: "Spearman's rho", ours: undefined, key: 'rho' },
            { name: "Kendall's tau-b", ours: undefined, key: 'tau' },
          ],
        });
      // Correlation cells: the first variable's rows, the second variable's column (the last one).
      if (item) {
        const c = cases[cases.length - 1];
        const lastCol = (title: RegExp, row: RegExp, which = 0) => {
          for (const g2 of tablesOf(item, title)) {
            const rows = g2.stub.map((s, i) => (row.test(s) ? i : -1)).filter((i) => i >= 0);
            const r = rows[which];
            if (r === undefined) continue;
            const v = g2.body[r][g2.head.length - 1]?.v;
            if (typeof v === 'number') return v;
          }
          return undefined;
        };
        c.compare[0].ours = lastCol(/^Correlations$/, /Pearson Correlation/);
        c.compare[1].ours = lastCol(/^Correlations$/, /Sig\./);
        c.compare[2].ours = lastCol(/Nonparametric/, /Spearman.*Correlation Coefficient/);
        c.compare[3].ours = lastCol(/Nonparametric/, /Kendall.*Correlation Coefficient/);
      }
      const wslots = { first: [y.id], second: [x1.id] };
      const wx = run('wilcoxon', wslots);
      if (wx)
        add({
          label: 'wilcoxon', item: wx, repro: repro('wilcoxon', wslots),
          req: { kind: 'wilcoxon', x: valuesOf(ds, y, sel.rows), y: valuesOf(ds, x1, sel.rows), w: weightsFor(ds, sel.rows, sel.weights) },
          compare: [{ name: 'Asymp. p', ours: num(wx, /^Test Statistics$/, /Asymp\. Sig/, 1), key: 'p', abs: true }],
        });
    }
    const sel3 = selectCases(ds, [y.id, x1.id, x2.id]);
    if (sel3.rows.length >= 6) {
      const fslots = { variables: [y.id, x1.id, x2.id] };
      const fr = run('friedman', fslots);
      const cols3 = [y, x1, x2].map((v) => valuesOf(ds, v, sel3.rows));
      if (fr)
        add({
          label: 'friedman', item: fr, repro: repro('friedman', fslots),
          req: { kind: 'friedman', cols: cols3, w: weightsFor(ds, sel3.rows, sel3.weights) },
          compare: [
            { name: 'Chi-square', ours: num(fr, /^Test Statistics$/, /Chi-Square/, 1), key: 'chi2' },
            { name: 'p', ours: num(fr, /^Test Statistics$/, /Asymp\. Sig/, 1), key: 'p', abs: true },
          ],
        });
      const lslots = { dependent: [y.id], block1: [x1.id, x2.id] };
      const lr = run('models.linear', lslots);
      if (lr)
        add({
          label: 'models.linear', item: lr, repro: repro('models.linear', lslots),
          req: { kind: 'ols', y: cols3[0], X: [cols3[1], cols3[2]], w: weightsFor(ds, sel3.rows, sel3.weights) },
          compare: [
            { name: 'B (Constant)', ours: num(lr, /^Coefficients$/, /Constant/, /\| B$|^B$/), key: 'b', idx: 0 },
            // Rows in order: (Constant), then the predictors as entered (labels may repeat, so go by position).
            { name: 'B first predictor', ours: num(lr, /^Coefficients$/, /./, /\| B$|^B$/, 1), key: 'b', idx: 1 },
            { name: 'SE second predictor', ours: num(lr, /^Coefficients$/, /./, /Std\. Error$/, 2), key: 'se', idx: 2 },
            { name: 'R Square', ours: num(lr, /^Model Summary$/, /./, /^R Square$/), key: 'r2' },
            { name: 'F', ours: num(lr, /^ANOVA$/, /Regression/, /^F$/), key: 'F' },
          ],
        });
      const aslots = { items: [y.id, x1.id, x2.id] };
      const rel = run('models.reliability', aslots);
      if (rel)
        add({
          label: 'models.reliability', item: rel, repro: repro('models.reliability', aslots),
          req: { kind: 'alpha', cols: cols3, w: weightsFor(ds, sel3.rows, sel3.weights) },
          compare: [{ name: "Cronbach's alpha", ours: num(rel, /^Reliability Statistics$/, /.*/, 0), key: 'alpha' }],
        });
    }
  }
  // Chi-square on two categorical variables
  if (cats.length >= 2 || (cats.length && g)) {
    const a = cats[0], b = cats[1] ?? g;
    const sel = selectCases(ds, [a.id, b.id]);
    const ac = ds.columns[a.id] as Float64Array, bc = ds.columns[b.id] as Float64Array;
    const av = [...new Set(sel.rows.map((i) => ac[i]))].sort((p, q) => p - q);
    const bv = [...new Set(sel.rows.map((i) => bc[i]))].sort((p, q) => p - q);
    if (av.length >= 2 && bv.length >= 2 && !isMissingValue(a, NaN)) {
      const table = av.map(() => bv.map(() => 0));
      sel.rows.forEach((i, j) => (table[av.indexOf(ac[i])][bv.indexOf(bc[i])] += ds.weightVarId ? sel.weights[j] : 1));
      const slots = { rows: [a.id], columns: [b.id] };
      const item = run('crosstabs', slots);
      if (item)
        add({
          label: 'crosstabs', item, repro: repro('crosstabs', slots),
          req: { kind: 'chi2', table },
          compare: [
            { name: 'Pearson chi-square', ours: num(item, /^Chi-Square Tests$/, /Pearson Chi-Square/, /^Value/), key: 'chi2' },
            { name: 'p', ours: num(item, /^Chi-Square Tests$/, /Pearson Chi-Square/, /Asymptotic/), key: 'p', abs: true },
            { name: 'Likelihood ratio', ours: num(item, /^Chi-Square Tests$/, /Likelihood Ratio/, /^Value/), key: 'G' },
          ],
        });
    }
  }
  return cases;
}

describe('procedures vs scipy / statsmodels', () => {
  it.skipIf(!HAS_ORACLE)('random datasets agree with the oracle', () => {
    const cases: OracleCase[] = [];
    const N = Math.round(150 * fuzzScale());
    for (let t = 0; t < N; t++) {
      const seed = makeRng(SEED).fork(`oracle#${t}`).seed;
      cases.push(...buildCases(makeRng(seed), seed));
    }
    const res = JSON.parse(execFileSync(PYTHON, [ORACLE], { input: JSON.stringify(cases.map((c) => c.req)), encoding: 'utf-8', maxBuffer: 1 << 28 })) as Array<Record<string, number | number[] | null | string>>;
    let compared = 0, missing = 0;
    cases.forEach((c, k) => {
      const r = res[k];
      if (!r || 'error' in r) return;
      for (const cmp of c.compare) {
        let want = r[cmp.key] as number | number[] | null;
        if (Array.isArray(want)) want = want[cmp.idx ?? 0];
        if (want === null || want === undefined || !Number.isFinite(want)) continue;
        if (cmp.ours === undefined || !Number.isFinite(cmp.ours)) {
          missing++;
          if (Number.isFinite(want)) col.add({ area: 'procedures', subject: c.label, check: 'oracle-missing', detail: `${cmp.name}: not found or not a number in the output, oracle has ${want}`, seed: c.seed, repro: c.repro });
          continue;
        }
        compared++;
        const ours = cmp.ours;
        const tol = cmp.tol ?? 1e-6;
        const ok = cmp.abs ? Math.abs(ours - want) <= Math.max(1e-9, tol * Math.abs(want)) : Math.abs(ours - want) <= tol * Math.max(1, Math.abs(want));
        if (!ok) col.add({ area: 'procedures', subject: c.label, check: 'oracle', detail: `${cmp.name}: Socius ${ours} vs scipy/statsmodels ${want}`, seed: c.seed, repro: c.repro });
      }
    });
    out(`[fuzz:oracle] ${cases.length} procedure runs, ${compared} statistics compared, ${missing} not found`);
  }, 120_000);

  it('gate: no new failures (known ones are listed in tests/fuzz/known-issues.ts)', () => {
    if (!HAS_ORACLE) out('[fuzz:oracle] Python oracle not available: numerical cross-check skipped');
    const g = col.gate();
    out(`[fuzz:oracle] seed ${SEED}\n${g.summary}`);
    expect(g.unknown, g.summary).toEqual([]);
  });
});
