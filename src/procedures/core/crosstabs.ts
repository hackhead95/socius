// Analyze > Descriptive Statistics > Crosstabs (SPSS CROSSTABS), including layered tables for the
// elaboration model (a control variable), chi-square tests, exact tests, measures of association,
// risk estimates, McNemar and Cochran-Mantel-Haenszel statistics.

import { selectCases } from '../../core/data';
import type { Dataset, Variable } from '../../core/types';
import type { ChartSpec, OutputBlock, OutputTable } from '../../core/output';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import {
  cellStats,
  chiSquareTests,
  cmh,
  kappa,
  lambdaTau,
  margins,
  mcnemar,
  nominalMeasures,
  ordinalMeasures,
  pearsonFromTable,
  populated,
  riskEstimate,
  spearmanFromTable,
  type ChiSquareTests,
  type Measure,
  type Table,
} from '../../lib/stats/crosstabs';
import {
  apaNum,
  apaP,
  blank,
  caseNote,
  categoriesOf,
  cell,
  COHEN_NOTE,
  fmtN,
  hcell,
  heading,
  item,
  labelR,
  labelV,
  optBool,
  optStr,
  pcell,
  pct,
  sameValue,
  selN,
  sigWord,
  tableBlock,
  text,
  valueText,
  vars,
  vlabel,
  vprose,
  type Cell,
} from './common';

const MAX_CATEGORIES = 60;

interface Layer {
  /** null = all cases (the "Total" layer) */
  label: string | null;
  table: Table;
}

interface Pair {
  row: Variable;
  col: Variable;
  layer: Variable | null;
  rowCats: Array<number | string>;
  colCats: Array<number | string>;
  layers: Layer[];
  total: Layer;
  N: number;
  nMissing: number;
  nTotal: number;
}

function adjustCount(v: number, mode: string): number {
  if (mode === 'round') return Math.round(v);
  if (mode === 'truncate') return Math.trunc(v);
  return v;
}

function buildPair(ds: Dataset, row: Variable, col: Variable, layer: Variable | null, weightMode: string): Pair {
  const ids = [row.id, col.id, ...(layer ? [layer.id] : [])];
  const sel = selectCases(ds, ids);
  const rowCats = categoriesOf(ds, row, sel.rows);
  const colCats = categoriesOf(ds, col, sel.rows);
  if (rowCats.length > MAX_CATEGORIES) throw new Error(`${row.name} has ${rowCats.length} distinct values. Crosstabs is meant for categorical variables (at most ${MAX_CATEGORIES} categories); recode it into groups first.`);
  if (colCats.length > MAX_CATEGORIES) throw new Error(`${col.name} has ${colCats.length} distinct values. Crosstabs is meant for categorical variables (at most ${MAX_CATEGORIES} categories); recode it into groups first.`);
  const layerCats = layer ? categoriesOf(ds, layer, sel.rows) : [];
  if (layerCats.length > MAX_CATEGORIES) throw new Error(`The layer variable ${layer!.name} has too many categories (${layerCats.length}).`);
  const rc = ds.columns[row.id];
  const cc = ds.columns[col.id];
  const lc = layer ? ds.columns[layer.id] : null;
  const idx = <T extends number | string>(cats: T[], x: number | string) => cats.findIndex((c) => sameValue(c, x));
  const empty = () => rowCats.map(() => colCats.map(() => 0));
  const tot = empty();
  const lt = layerCats.map(() => empty());
  sel.rows.forEach((r, k) => {
    const i = idx(rowCats, rc[r]);
    const j = idx(colCats, cc[r]);
    const w = sel.weights[k];
    tot[i][j] += w;
    if (lc) lt[idx(layerCats, lc[r])][i][j] += w;
  });
  const adj = (t: Table) => t.map((rr) => rr.map((v) => adjustCount(v, weightMode)));
  const N = selN(sel);
  return {
    row,
    col,
    layer,
    rowCats,
    colCats,
    layers: layerCats.map((c, k) => ({ label: valueText(layer!, c), table: adj(lt[k]) })),
    total: { label: null, table: adj(tot) },
    N,
    nMissing: sel.nMissing,
    nTotal: N + sel.nMissing,
  };
}

interface CellOpts {
  observed: boolean;
  expected: boolean;
  rowPct: boolean;
  colPct: boolean;
  totPct: boolean;
  stdRes: boolean;
  adjRes: boolean;
}

function crosstabTable(p: Pair, co: CellOpts): OutputTable {
  const stats: Array<{ label: string; fmt: 'int' | 'dec1' | 'pct' | 'dec2'; value: (t: Table, cs: ReturnType<typeof cellStats>, m: ReturnType<typeof margins>, i: number, j: number) => number; total?: (t: Table, m: ReturnType<typeof margins>, i: number | null, j: number | null) => number }> = [];
  if (co.observed) stats.push({ label: 'Count', fmt: 'int', value: (t, _cs, _m, i, j) => t[i][j], total: (t, m, i, j) => (i === null && j === null ? m.N : i === null ? m.cols[j!] : m.rows[i]) });
  if (co.expected) stats.push({ label: 'Expected Count', fmt: 'dec1', value: (_t, cs, _m, i, j) => cs.expected[i][j], total: (t, m, i, j) => (i === null && j === null ? m.N : i === null ? m.cols[j!] : m.rows[i]) });
  if (co.rowPct) stats.push({ label: `% within ${p.row.name}`, fmt: 'pct', value: (t, _cs, m, i, j) => (m.rows[i] > 0 ? (100 * t[i][j]) / m.rows[i] : NaN), total: (t, m, i, j) => (i === null ? (j === null ? 100 : (100 * m.cols[j]) / m.N) : m.rows[i] > 0 ? 100 : NaN) });
  if (co.colPct) stats.push({ label: `% within ${p.col.name}`, fmt: 'pct', value: (t, _cs, m, i, j) => (m.cols[j] > 0 ? (100 * t[i][j]) / m.cols[j] : NaN), total: (t, m, i, j) => (j === null ? (i === null ? 100 : (100 * m.rows[i]) / m.N) : m.cols[j] > 0 ? 100 : NaN) });
  if (co.totPct) stats.push({ label: '% of Total', fmt: 'pct', value: (t, _cs, m, i, j) => (100 * t[i][j]) / m.N, total: (t, m, i, j) => (i === null && j === null ? 100 : i === null ? (100 * m.cols[j!]) / m.N : (100 * m.rows[i]) / m.N) });
  if (co.stdRes) stats.push({ label: 'Standardized Residual', fmt: 'dec1', value: (_t, cs, _m, i, j) => cs.standardized[i][j] });
  if (co.adjRes) stats.push({ label: 'Adjusted Residual', fmt: 'dec1', value: (_t, cs, _m, i, j) => cs.adjusted[i][j] });
  if (!stats.length) stats.push({ label: 'Count', fmt: 'int', value: (t, _cs, _m, i, j) => t[i][j], total: (t, m, i, j) => (i === null && j === null ? m.N : i === null ? m.cols[j!] : m.rows[i]) });
  const layers = p.layer ? [...p.layers, p.total] : [p.total];
  const rows: Cell[][] = [];
  const ruleBefore: number[] = [];
  const ns = stats.length;
  const R = p.rowCats.length;
  const totStats = stats.filter((s) => s.total);
  const nt = Math.max(1, totStats.length);
  layers.forEach((L) => {
    const t = L.table;
    const m = margins(t);
    const cs = safeCellStats(t);
    const layerRows = R * ns + nt;
    for (let i = 0; i <= R; i++) {
      if (rows.length) ruleBefore.push(rows.length);
      const list = i < R ? stats : totStats.length ? totStats : [{ label: 'Count', fmt: 'int' as const, value: () => NaN, total: (tt: Table, mm: ReturnType<typeof margins>, a: number | null, b: number | null) => (a === null && b === null ? mm.N : a === null ? mm.cols[b!] : mm.rows[a]) }];
      list.forEach((s, si) => {
        const r: Cell[] = [];
        if (p.layer && i === 0 && si === 0) r.push(hcell(L.label ?? 'Total', { rowSpan: layerRows, bold: L.label === null }));
        if (i < R && si === 0) {
          if (i === 0) r.push(hcell(p.row.name, { rowSpan: R * ns }));
          r.push(hcell(valueText(p.row, p.rowCats[i]), { rowSpan: ns }));
        }
        if (i === R && si === 0) r.push(hcell('Total', { colSpan: 2, rowSpan: list.length, bold: true }));
        r.push(hcell(s.label));
        for (let j = 0; j < p.colCats.length; j++) r.push(i < R ? cell(s.value(t, cs, m, i, j), s.fmt) : s.total ? cell(s.total(t, m, null, j), s.fmt) : blank());
        r.push(i < R ? (s.total ? cell(s.total(t, m, i, null), s.fmt) : blank()) : s.total ? cell(s.total(t, m, null, null), s.fmt) : blank());
        rows.push(r);
      });
    }
  });
  const stub = (p.layer ? 1 : 0) + 3;
  return {
    title: `${p.row.name} * ${p.col.name}${p.layer ? ` * ${p.layer.name}` : ''} Crosstabulation`,
    subtitle: [vlabel(p.row), vlabel(p.col), p.layer ? vlabel(p.layer) : ''].filter(Boolean).join(' by '),
    header: [
      [...(p.layer ? [hcell(p.layer.name, { rowSpan: 2 })] : []), hcell('', { colSpan: 3, rowSpan: 2 }), hcell(p.col.name, { colSpan: p.colCats.length }), hcell('Total', { rowSpan: 2 })],
      p.colCats.map((c) => hcell(valueText(p.col, c))),
    ],
    rows,
    stubColumns: stub,
    ruleBefore,
  };
}

/** cellStats on a table that may contain empty rows/columns (those get NaN residuals). */
function safeCellStats(t: Table): ReturnType<typeof cellStats> {
  const m = margins(t);
  if (m.N === 0) {
    const z = t.map((r) => r.map(() => NaN));
    return { expected: z, residual: z, standardized: z, adjusted: z };
  }
  return cellStats(t);
}

interface LayerStats {
  label: string | null;
  N: number;
  r: number;
  c: number;
  chi?: ChiSquareTests;
  nominal?: ReturnType<typeof nominalMeasures>;
  ordinal?: ReturnType<typeof ordinalMeasures>;
  dir?: ReturnType<typeof lambdaTau>;
  pearsonR?: Measure;
  spearman?: Measure;
  kappa?: Measure;
  risk?: ReturnType<typeof riskEstimate>;
  mcnemar?: ReturnType<typeof mcnemar>;
  degenerate: boolean;
}

function computeLayer(p: Pair, L: Layer, opts: OptionValues): LayerStats {
  const pop = populated(L.table);
  const t = pop.table;
  const r = t.length;
  const c = r ? t[0].length : 0;
  const N = margins(L.table).N;
  const out: LayerStats = { label: L.label, N, r, c, degenerate: r < 2 || c < 2 };
  if (out.degenerate) return out;
  const numeric = p.row.type === 'numeric' && p.col.type === 'numeric';
  const rowScores = numeric ? (p.rowCats as number[]) : null;
  const colScores = numeric ? (p.colCats as number[]) : null;
  out.chi = chiSquareTests(L.table, rowScores, colScores, { exact: optStr(opts, 'exact', 'asymptotic') === 'exact' });
  out.nominal = nominalMeasures(L.table);
  if (optBool(opts, 'ordinal') || optBool(opts, 'gamma') || optBool(opts, 'tauB') || optBool(opts, 'tauC') || optBool(opts, 'somersD')) out.ordinal = ordinalMeasures(L.table);
  if (optBool(opts, 'lambda')) out.dir = lambdaTau(L.table);
  if (optBool(opts, 'correlations')) {
    out.spearman = spearmanFromTable(t);
    if (numeric) out.pearsonR = pearsonFromTable(t, pop.rowIdx.map((i) => rowScores![i]), pop.colIdx.map((j) => colScores![j]));
  }
  const square = p.rowCats.length === p.colCats.length && p.rowCats.every((v, i) => sameValue(v, p.colCats[i]));
  if (optBool(opts, 'kappa') && square) out.kappa = kappa(L.table);
  if (optBool(opts, 'risk') && r === 2 && c === 2) out.risk = riskEstimate(t);
  if (optBool(opts, 'mcnemar') && square) out.mcnemar = mcnemar(L.table);
  return out;
}

function chiSquareTable(p: Pair, all: LayerStats[], opts: OptionValues): OutputTable {
  const rows: Cell[][] = [];
  const ruleBefore: number[] = [];
  const foot: string[] = [];
  let fnLetter = 0;
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const nextMark = () => letters[fnLetter++];
  let contMark = '';
  const exactCols = all.some((s) => s.chi?.fisher || s.mcnemar?.exactP !== undefined);
  const monteCarlo = all.find((s) => s.chi?.fisher?.method === 'monte-carlo');
  all.forEach((s) => {
    const body: Cell[][] = [];
    const add = (label: string, v: Cell, df: Cell, asym: Cell, ex2: Cell = blank(), ex1: Cell = blank()) => body.push([hcell(label), v, df, asym, ...(exactCols ? [ex2, ex1] : [])]);
    if (s.degenerate || !s.chi) {
      add('Pearson Chi-Square', cell(NaN), blank(), blank());
      body.push([hcell('N of Valid Cases'), cell(s.N, 'int'), blank(), blank(), ...(exactCols ? [blank(), blank()] : [])]);
    } else {
      const c = s.chi;
      const mark = nextMark();
      const pct5 = (100 * c.cellsBelow5) / c.cellsTotal;
      foot.push(`${mark}. ${c.cellsBelow5} cells (${pct5.toFixed(1)}%) have expected count less than 5. The minimum expected count is ${c.minExpected.toFixed(2)}.${p.layer && s.label !== null ? ` (${s.label})` : ''}`);
      add('Pearson Chi-Square', cell(c.pearson.value, 'dec3', { mark }), cell(c.df, 'int'), pcell(c.pearson.p));
      if (c.continuity) {
        if (!contMark) {
          contMark = nextMark();
          foot.push(`${contMark}. Computed only for a 2x2 table`);
        }
        const m2 = contMark;
        add('Continuity Correction', cell(c.continuity.value, 'dec3', { mark: m2 }), cell(1, 'int'), pcell(c.continuity.p));
      }
      add('Likelihood Ratio', cell(c.likelihoodRatio.value, 'dec3'), cell(c.df, 'int'), pcell(c.likelihoodRatio.p));
      if (c.fisher) {
        const f = c.fisher;
        const lab = s.r === 2 && s.c === 2 ? "Fisher's Exact Test" : 'Fisher-Freeman-Halton Exact Test';
        add(lab, blank(), blank(), blank(), pcell(f.p2), f.p1 !== undefined ? pcell(f.p1) : blank());
      }
      if (c.linearByLinear) add('Linear-by-Linear Association', cell(c.linearByLinear.value, 'dec3'), cell(1, 'int'), pcell(c.linearByLinear.p));
      if (s.mcnemar) {
        if (s.mcnemar.exactP !== undefined) {
          const m3 = nextMark();
          foot.push(`${m3}. Binomial distribution used.`);
          add('McNemar Test', blank(), blank(), blank(), pcell(s.mcnemar.exactP), blank());
          body[body.length - 1][4] = cell(s.mcnemar.exactP, 'p', { mark: m3, ...(s.mcnemar.exactP < 0.05 ? { tone: 'good' } : {}) });
        } else if (s.mcnemar.bowker) add('McNemar-Bowker Test', cell(s.mcnemar.bowker.value, 'dec3'), cell(s.mcnemar.bowker.df, 'int'), pcell(s.mcnemar.bowker.p));
      }
      body.push([hcell('N of Valid Cases'), cell(s.N, 'int'), blank(), blank(), ...(exactCols ? [blank(), blank()] : [])]);
    }
    if (rows.length) ruleBefore.push(rows.length);
    if (p.layer) body[0].unshift(hcell(s.label ?? 'Total', { rowSpan: body.length, bold: s.label === null }));
    rows.push(...body);
  });
  if (monteCarlo) {
    const f = monteCarlo.chi!.fisher!;
    foot.push(`The table is too large for complete enumeration; the exact significance is a Monte Carlo estimate from ${fmtN(f.samples!)} random tables (seed 2000000), 99% CI ${f.ci99![0].toFixed(3)} to ${f.ci99![1].toFixed(3)}.`);
  }
  const header: Cell[] = [...(p.layer ? [hcell(p.layer.name)] : []), hcell(''), hcell('Value'), hcell('df'), hcell('Asymptotic Significance (2-sided)')];
  if (exactCols) header.push(hcell('Exact Sig. (2-sided)'), hcell('Exact Sig. (1-sided)'));
  return { title: 'Chi-Square Tests', header: [header], rows, stubColumns: p.layer ? 2 : 1, ruleBefore, footnotes: foot };
}

function measureRow(label: string, m: Measure | undefined, fmt: 'r' | 'coef' = 'r', marks: { ase?: string; t?: string; p?: string } = {}): Cell[] {
  if (!m) return [hcell(label), cell(NaN), blank(), blank(), blank()];
  return [
    hcell(label),
    cell(m.value, fmt),
    m.ase !== undefined ? cell(m.ase, 'r', marks.ase ? { mark: marks.ase } : {}) : blank(),
    m.t !== undefined ? cell(m.t, 'dec3', marks.t ? { mark: marks.t } : {}) : blank(),
    m.p !== undefined ? cell(m.p, 'p', { ...(marks.p ? { mark: marks.p } : {}), ...(m.p < 0.05 ? { tone: 'good' as const } : {}) }) : blank(),
  ];
}

function symmetricTable(p: Pair, all: LayerStats[], opts: OptionValues): OutputTable | null {
  const wantPhi = optBool(opts, 'phi', true);
  const wantCC = optBool(opts, 'cc');
  const wantG = optBool(opts, 'gamma');
  const wantTb = optBool(opts, 'tauB');
  const wantTc = optBool(opts, 'tauC');
  const wantCorr = optBool(opts, 'correlations');
  const wantK = optBool(opts, 'kappa');
  if (!(wantPhi || wantCC || wantG || wantTb || wantTc || wantCorr || wantK)) return null;
  const rows: Cell[][] = [];
  const ruleBefore: number[] = [];
  const foot = new Set<string>();
  all.forEach((s) => {
    const body: Cell[][] = [];
    const group = (name: string, items: Cell[][]) => {
      if (!items.length) return;
      items[0].unshift(hcell(name, { rowSpan: items.length }));
      body.push(...items);
    };
    if (!s.degenerate) {
      const nom: Cell[][] = [];
      if (wantPhi) {
        nom.push(measureRow('Phi', s.nominal!.phi));
        nom.push(measureRow("Cramer's V", s.nominal!.cramersV));
      }
      if (wantCC) nom.push(measureRow('Contingency Coefficient', s.nominal!.contingency));
      group('Nominal by Nominal', nom);
      const ord: Cell[][] = [];
      const am = { ase: 'a', t: 'b' };
      if (wantTb && s.ordinal) ord.push(measureRow("Kendall's tau-b", s.ordinal.tauB, 'r', am));
      if (wantTc && s.ordinal) ord.push(measureRow("Kendall's tau-c", s.ordinal.tauC, 'r', am));
      if (wantG && s.ordinal) ord.push(measureRow('Gamma', s.ordinal.gamma, 'r', am));
      if (wantCorr && s.spearman) ord.push(measureRow('Spearman Correlation', s.spearman, 'r', { ase: 'a', t: 'b', p: 'c' }));
      group('Ordinal by Ordinal', ord);
      if (wantCorr && s.pearsonR) group('Interval by Interval', [measureRow("Pearson's R", s.pearsonR, 'r', { ase: 'a', t: 'b', p: 'c' })]);
      if (wantK && s.kappa) group('Measure of Agreement', [measureRow('Kappa', s.kappa, 'r', am)]);
      if (ord.length || (wantK && s.kappa) || (wantCorr && s.pearsonR)) {
        foot.add('a. Not assuming the null hypothesis.');
        foot.add('b. Using the asymptotic standard error assuming the null hypothesis.');
      }
      if (wantCorr) foot.add('c. Based on the t distribution with N - 2 degrees of freedom.');
    } else {
      body.push([hcell('Not computed: the table needs at least two non-empty rows and columns.', { colSpan: 2 }), blank(), blank(), blank(), blank()]);
    }
    body.push([hcell('N of Valid Cases', { colSpan: 2 }), cell(s.N, 'int'), blank(), blank(), blank()]);
    if (rows.length) ruleBefore.push(rows.length);
    if (p.layer) body[0].unshift(hcell(s.label ?? 'Total', { rowSpan: body.length, bold: s.label === null }));
    rows.push(...body);
  });
  const header: Cell[] = [...(p.layer ? [hcell(p.layer.name)] : []), hcell('', { colSpan: 2 }), hcell('Value'), hcell('Asymptotic Standard Error'), hcell('Approximate T'), hcell('Approximate Significance')];
  return { title: 'Symmetric Measures', header: [header], rows, stubColumns: p.layer ? 3 : 2, ruleBefore, footnotes: [...foot].sort() };
}

function directionalTable(p: Pair, all: LayerStats[], opts: OptionValues): OutputTable | null {
  const wantL = optBool(opts, 'lambda');
  const wantD = optBool(opts, 'somersD');
  if (!wantL && !wantD) return null;
  const rows: Cell[][] = [];
  const ruleBefore: number[] = [];
  const am = { ase: 'a', t: 'b' };
  all.forEach((s) => {
    const body: Cell[][] = [];
    if (s.degenerate) body.push([hcell('Not computed (fewer than two non-empty rows or columns)', { colSpan: 3 }), blank(), blank(), blank(), blank()]);
    else {
      if (wantL && s.dir) {
        const l = s.dir.lambda;
        const g = s.dir.gkTau;
        const nb: Cell[][] = [
          measureRow('Symmetric', l.symmetric, 'r', am),
          measureRow(`${p.row.name} Dependent`, l.rowDependent, 'r', am),
          measureRow(`${p.col.name} Dependent`, l.colDependent, 'r', am),
        ];
        nb[0].unshift(hcell('Lambda', { rowSpan: 3 }));
        const gk: Cell[][] = [
          measureRow(`${p.row.name} Dependent`, { ...g.rowDependent, t: undefined }, 'r', { ase: 'a', p: 'c' }),
          measureRow(`${p.col.name} Dependent`, { ...g.colDependent, t: undefined }, 'r', { ase: 'a', p: 'c' }),
        ];
        gk[0].unshift(hcell('Goodman and Kruskal tau', { rowSpan: 2 }));
        const all2 = [...nb, ...gk];
        all2[0].unshift(hcell('Nominal by Nominal', { rowSpan: all2.length }));
        body.push(...all2);
      }
      if (wantD && s.ordinal) {
        const d = s.ordinal.somersD;
        const od: Cell[][] = [
          measureRow('Symmetric', d.symmetric, 'r', am),
          measureRow(`${p.row.name} Dependent`, d.rowDependent, 'r', am),
          measureRow(`${p.col.name} Dependent`, d.colDependent, 'r', am),
        ];
        od[0].unshift(hcell("Somers' d", { rowSpan: 3 }));
        od[0].unshift(hcell('Ordinal by Ordinal', { rowSpan: 3 }));
        body.push(...od);
      }
    }
    if (rows.length) ruleBefore.push(rows.length);
    if (p.layer) body[0].unshift(hcell(s.label ?? 'Total', { rowSpan: body.length, bold: s.label === null }));
    rows.push(...body);
  });
  const foot = ['a. Not assuming the null hypothesis.', 'b. Using the asymptotic standard error assuming the null hypothesis.'];
  if (wantL) foot.push('c. Based on the chi-square approximation (N - 1)(J - 1) tau, J = categories of the dependent variable (Light and Margolin).');
  const header: Cell[] = [...(p.layer ? [hcell(p.layer.name)] : []), hcell('', { colSpan: 3 }), hcell('Value'), hcell('Asymptotic Standard Error'), hcell('Approximate T'), hcell('Approximate Significance')];
  return { title: 'Directional Measures', header: [header], rows, stubColumns: p.layer ? 4 : 3, ruleBefore, footnotes: foot };
}

function riskTable(p: Pair, all: LayerStats[]): OutputTable | null {
  const withRisk = all.filter((s) => s.risk);
  if (!withRisk.length) return null;
  const rows: Cell[][] = [];
  const ruleBefore: number[] = [];
  withRisk.forEach((s) => {
    const pop = s.risk!;
    const rc = p.rowCats;
    const cc = p.colCats;
    const body: Cell[][] = [
      [hcell(`Odds Ratio for ${p.row.name} (${valueText(p.row, rc[0])} / ${valueText(p.row, rc[1])})`), cell(pop.oddsRatio.value, 'dec3'), cell(pop.oddsRatio.lo, 'dec3'), cell(pop.oddsRatio.hi, 'dec3')],
      [hcell(`For cohort ${p.col.name} = ${valueText(p.col, cc[0])}`), cell(pop.rrFirst.value, 'dec3'), cell(pop.rrFirst.lo, 'dec3'), cell(pop.rrFirst.hi, 'dec3')],
      [hcell(`For cohort ${p.col.name} = ${valueText(p.col, cc[1])}`), cell(pop.rrSecond.value, 'dec3'), cell(pop.rrSecond.lo, 'dec3'), cell(pop.rrSecond.hi, 'dec3')],
      [hcell('N of Valid Cases'), cell(pop.N, 'int'), blank(), blank()],
    ];
    if (rows.length) ruleBefore.push(rows.length);
    if (p.layer) body[0].unshift(hcell(s.label ?? 'Total', { rowSpan: body.length, bold: s.label === null }));
    rows.push(...body);
  });
  return {
    title: 'Risk Estimate',
    header: [
      [...(p.layer ? [hcell(p.layer.name, { rowSpan: 2 })] : []), hcell('', { rowSpan: 2 }), hcell('Value', { rowSpan: 2 }), hcell('95% Confidence Interval', { colSpan: 2 })],
      [hcell('Lower'), hcell('Upper')],
    ],
    rows,
    stubColumns: p.layer ? 2 : 1,
    ruleBefore,
  };
}

function cmhBlocks(p: Pair): OutputBlock[] {
  const tables = p.layers.map((l) => populated(l.table)).filter((x) => x.table.length === 2 && x.table[0].length === 2).map((x) => x.table);
  if (tables.length < 1 || tables.length !== p.layers.length) return [text('note', 'Cochran-Mantel-Haenszel statistics need a 2x2 table in every layer; they were not computed.')];
  const r = cmh(tables);
  const out: OutputBlock[] = [];
  if (r.breslowDay) {
    out.push(
      tableBlock({
        title: 'Tests of Homogeneity of the Odds Ratio',
        header: [[hcell(''), hcell('Chi-Squared'), hcell('df'), hcell('Asymptotic Significance (2-sided)')]],
        rows: [
          [hcell('Breslow-Day'), cell(r.breslowDay.value, 'dec3'), cell(r.breslowDay.df, 'int'), pcell(r.breslowDay.p)],
          [hcell("Tarone's"), cell(r.tarone!.value, 'dec3'), cell(r.tarone!.df, 'int'), pcell(r.tarone!.p)],
        ],
      }),
    );
  }
  out.push(
    tableBlock({
      title: 'Tests of Conditional Independence',
      header: [[hcell(''), hcell('Chi-Squared'), hcell('df'), hcell('Asymptotic Significance (2-sided)')]],
      rows: [
        [hcell("Cochran's"), cell(r.cochran.value, 'dec3'), cell(1, 'int'), pcell(r.cochran.p)],
        [hcell('Mantel-Haenszel'), cell(r.mantelHaenszel.value, 'dec3'), cell(1, 'int'), pcell(r.mantelHaenszel.p)],
      ],
      footnotes: ['Under the conditional independence assumption, the Mantel-Haenszel statistic (with continuity correction) is asymptotically chi-square with 1 df.'],
    }),
  );
  const o = r.commonOR;
  out.push(
    tableBlock({
      title: 'Mantel-Haenszel Common Odds Ratio Estimate',
      header: [[hcell('', { colSpan: 3 }), hcell('Value')]],
      rows: [
        [hcell('Estimate', { colSpan: 3 }), cell(o.value, 'dec3')],
        [hcell('ln(Estimate)', { colSpan: 3 }), cell(o.lnValue, 'dec3')],
        [hcell('Standard Error of ln(Estimate)', { colSpan: 3 }), cell(o.seLn, 'dec3')],
        [hcell('Asymptotic Significance (2-sided)', { colSpan: 3 }), pcell(o.p)],
        [hcell('Asymptotic 95% Confidence Interval', { rowSpan: 4 }), hcell('Common Odds Ratio', { rowSpan: 2 }), hcell('Lower Bound'), cell(o.lo, 'dec3')],
        [hcell('Upper Bound'), cell(o.hi, 'dec3')],
        [hcell('ln(Common Odds Ratio)', { rowSpan: 2 }), hcell('Lower Bound'), cell(Math.log(o.lo), 'dec3')],
        [hcell('Upper Bound'), cell(Math.log(o.hi), 'dec3')],
      ],
      stubColumns: 3,
      footnotes: ['The Mantel-Haenszel common odds ratio estimate is asymptotically normally distributed under the common odds ratio of 1.000 assumption. So is the natural log of the estimate.'],
    }),
  );
  let s = `Pooling the ${tables.length} layers of ${vprose(p.layer!)}, the Mantel-Haenszel common odds ratio is ${apaNum(o.value)} (95% CI ${apaNum(o.lo)} to ${apaNum(o.hi)}), and the test of conditional independence is ${sigWord(r.mantelHaenszel.p)} (${apaP(r.mantelHaenszel.p)}).`;
  if (r.breslowDay) s += r.breslowDay.p < 0.05 ? ` The Breslow-Day test indicates the odds ratio differs between layers (${apaP(r.breslowDay.p)}), so the pooled estimate hides an interaction: report the layers separately.` : ` The Breslow-Day test gives no evidence that the odds ratio differs between layers (${apaP(r.breslowDay.p)}).`;
  out.push(text('interpretation', s));
  return out;
}

function describeAssociation(p: Pair, L: Layer, s: LayerStats, groupsAreRows: boolean): { text: string; apa: string | null } {
  if (s.degenerate || !s.chi) return { text: `${L.label ? `In ${L.label}, ` : ''}there are too few categories with cases to test an association.`, apa: null };
  const t = L.table;
  const m = margins(t);
  const G = groupsAreRows ? p.row : p.col;
  const O = groupsAreRows ? p.col : p.row;
  const gCats = groupsAreRows ? p.rowCats : p.colCats;
  const oCats = groupsAreRows ? p.colCats : p.rowCats;
  const count = (g: number, o: number) => (groupsAreRows ? t[g][o] : t[o][g]);
  const gTot = groupsAreRows ? m.rows : m.cols;
  // Choose the outcome category whose conditional percentage varies most across groups.
  let best = { o: 0, spread: -1, hi: 0, lo: 0 };
  for (let o = 0; o < oCats.length; o++) {
    let hi = -1;
    let lo = -1;
    for (let g = 0; g < gCats.length; g++) {
      if (!(gTot[g] > 0)) continue;
      const pc = count(g, o) / gTot[g];
      if (hi < 0 || pc > count(hi, o) / gTot[hi]) hi = g;
      if (lo < 0 || pc < count(lo, o) / gTot[lo]) lo = g;
    }
    if (hi < 0) continue;
    const spread = count(hi, o) / gTot[hi] - count(lo, o) / gTot[lo];
    if (spread > best.spread) best = { o, spread, hi, lo };
  }
  const c = s.chi;
  const V = s.nominal!.cramersV.value;
  const dfStar = Math.min(s.r, s.c) - 1;
  const strength = labelV(V, dfStar);
  const useFisher = s.r === 2 && s.c === 2 && c.fisher && (100 * c.cellsBelow5) / c.cellsTotal > 20;
  const pMain = useFisher ? c.fisher!.p2 : c.pearson.p;
  const where = L.label ? `Among ${vprose(p.layer!)} = ${L.label}, ` : '';
  const outcome = `"${valueText(O, oCats[best.o])}"`;
  const pHi = (100 * count(best.hi, best.o)) / gTot[best.hi];
  const pLo = (100 * count(best.lo, best.o)) / gTot[best.lo];
  const hiLab = `"${valueText(G, gCats[best.hi])}"`;
  const loLab = `"${valueText(G, gCats[best.lo])}"`;
  let s1: string;
  if (best.spread < 0.02) s1 = `${where ? `${where}the` : 'The'} distribution of ${vprose(O)} is almost identical across the categories of ${vprose(G)}.`;
  else if (pMain >= 0.05 && best.spread < 0.05) s1 = `${where ? `${where}respondents` : 'Respondents'} in the ${hiLab} and ${loLab} groups of ${vprose(G)} were about equally likely to answer ${outcome} on ${vprose(O)} (${pct(pHi)} and ${pct(pLo)}).`;
  else s1 = `${where ? `${where}respondents` : 'Respondents'} in the ${hiLab} group of ${vprose(G)} were ${pMain < 0.05 ? 'more likely' : 'somewhat more likely'} to answer ${outcome} on ${vprose(O)} (${pct(pHi)}) than those in the ${loLab} group (${pct(pLo)}).`;
  const vText = `Cramer's V = ${apaNum(V, 2, true)}`;
  const s2 = pMain < 0.05 ? ` The association is statistically significant and ${strength} (${vText}; ${useFisher ? "Fisher's exact " : ''}${apaP(pMain)}).` : ` The association is not statistically significant (${useFisher ? "Fisher's exact " : ''}${apaP(pMain)}; ${vText}), so these differences could plausibly arise by chance.`;
  // Largest adjusted residuals
  let s3 = '';
  if (pMain < 0.05) {
    const cs = safeCellStats(t);
    const cells: Array<{ i: number; j: number; z: number }> = [];
    cs.adjusted.forEach((row, i) => row.forEach((z, j) => Number.isFinite(z) && Math.abs(z) > 1.96 && cells.push({ i, j, z })));
    cells.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    const top = cells.slice(0, 3).map((q) => `${q.z > 0 ? 'more' : 'fewer'} "${valueText(p.row, p.rowCats[q.i])}" respondents answering "${valueText(p.col, p.colCats[q.j])}" than expected (adjusted residual ${q.z > 0 ? '+' : ''}${q.z.toFixed(1)})`);
    if (top.length) s3 = ` The cells that differ most from independence are: ${top.join('; ')}.`;
  }
  const apa = `A chi-square test of independence ${pMain < 0.05 ? 'showed a significant' : 'did not show a significant'} association between ${vprose(p.row)} and ${vprose(p.col)}${L.label ? ` among ${vprose(p.layer!)} = ${L.label}` : ''}, χ²(${c.df}, N = ${fmtN(Math.round(c.N))}) = ${apaNum(c.pearson.value)}, ${apaP(c.pearson.p)}, Cramér's V = ${apaNum(V, 2, true)}${useFisher ? ` (Fisher's exact ${apaP(c.fisher!.p2)})` : ''}.`;
  return { text: s1 + s2 + s3, apa };
}

function clusteredBar(p: Pair, groupsAreRows: boolean): ChartSpec {
  const t = p.total.table;
  const m = margins(t);
  const G = groupsAreRows ? p.row : p.col;
  const O = groupsAreRows ? p.col : p.row;
  const gCats = groupsAreRows ? p.rowCats : p.colCats;
  const oCats = groupsAreRows ? p.colCats : p.rowCats;
  return {
    type: 'bar',
    title: `${vlabel(O)} by ${vlabel(G)}`,
    xLabel: vlabel(G),
    yLabel: `Percent within ${G.name}`,
    categories: gCats.map((c) => valueText(G, c)),
    series: oCats.map((oc, o) => ({
      name: valueText(O, oc),
      values: gCats.map((_, g) => {
        const tot = groupsAreRows ? m.rows[g] : m.cols[g];
        const v = groupsAreRows ? t[g][o] : t[o][g];
        return tot > 0 ? (100 * v) / tot : 0;
      }),
    })),
    percent: true,
  };
}

function run(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const rowsV = vars(ds, slots, 'rows');
  const colsV = vars(ds, slots, 'columns');
  const layerV = vars(ds, slots, 'layer')[0] ?? null;
  if (!rowsV.length || !colsV.length) throw new Error('Choose at least one row variable and one column variable.');
  const weightMode = optStr(opts, 'weights', 'round');
  const co: CellOpts = {
    observed: optBool(opts, 'observed', true),
    expected: optBool(opts, 'expected'),
    rowPct: optBool(opts, 'rowPct', true),
    colPct: optBool(opts, 'colPct'),
    totPct: optBool(opts, 'totPct'),
    stdRes: optBool(opts, 'stdRes'),
    adjRes: optBool(opts, 'adjRes'),
  };
  const groupsAreRows = !(co.colPct && !co.rowPct);
  const blocks: OutputBlock[] = [];
  const pairs: Pair[] = [];
  for (const r of rowsV) for (const c of colsV) {
    if (r.id === c.id) throw new Error(`${r.name} cannot be both a row and a column variable.`);
    if (layerV && (layerV.id === r.id || layerV.id === c.id)) throw new Error(`${layerV.name} cannot be both a layer and a row or column variable.`);
    pairs.push(buildPair(ds, r, c, layerV, weightMode));
  }
  // Case processing summary
  blocks.push(
    tableBlock({
      title: 'Case Processing Summary',
      header: [
        [hcell('', { rowSpan: 2 }), hcell('Cases', { colSpan: 6 })],
        [hcell('Valid N'), hcell('Percent'), hcell('Missing N'), hcell('Percent'), hcell('Total N'), hcell('Percent')],
      ],
      rows: pairs.map((p) => [
        hcell(`${p.row.name} * ${p.col.name}${p.layer ? ` * ${p.layer.name}` : ''}`),
        cell(p.N, 'int'),
        cell(p.nTotal ? (100 * p.N) / p.nTotal : NaN, 'pct'),
        cell(p.nMissing, 'int'),
        cell(p.nTotal ? (100 * p.nMissing) / p.nTotal : NaN, 'pct'),
        cell(p.nTotal, 'int'),
        cell(100, 'pct'),
      ]),
    }),
  );
  const wantChi = optBool(opts, 'chisq', true);
  for (const p of pairs) {
    if (pairs.length > 1) blocks.push(heading(`${vlabel(p.row)} by ${vlabel(p.col)}`));
    if (p.N === 0) {
      blocks.push(text('warning', `No valid cases for ${p.row.name} by ${p.col.name}.`));
      continue;
    }
    blocks.push(tableBlock(crosstabTable(p, co)));
    const layersAll = p.layer ? [...p.layers, p.total] : [p.total];
    const statsAll = layersAll.map((L) => computeLayer(p, L, opts));
    if (wantChi) blocks.push(tableBlock(chiSquareTable(p, statsAll, opts)));
    const sym = symmetricTable(p, statsAll, opts);
    if (sym) blocks.push(tableBlock(sym));
    const dir = directionalTable(p, statsAll, opts);
    if (dir) blocks.push(tableBlock(dir));
    if (optBool(opts, 'risk')) {
      const rk = riskTable(p, statsAll);
      if (rk) blocks.push(tableBlock(rk));
      else blocks.push(text('note', 'The risk estimate is only available for 2x2 tables.'));
    }
    if (optBool(opts, 'kappa') && !statsAll.some((s) => s.kappa)) blocks.push(text('note', 'Kappa needs a square table with the same categories in rows and columns.'));
    if (optBool(opts, 'mcnemar') && !statsAll.some((s) => s.mcnemar)) blocks.push(text('note', 'The McNemar test needs a square table with the same categories in rows and columns.'));
    if (p.layer && optBool(opts, 'cmh')) blocks.push(...cmhBlocks(p));
    if (optBool(opts, 'chart')) blocks.push({ kind: 'chart', chart: clustered(p, groupsAreRows) });
    // Interpretation
    const totalStats = statsAll[statsAll.length - 1];
    const main = describeAssociation(p, p.total, totalStats, groupsAreRows);
    let interp = main.text;
    if (p.layer) {
      const layerTexts = p.layers.map((L, k) => {
        const s = statsAll[k];
        if (s.degenerate || !s.chi) return `${L.label}: too few cases to test`;
        return `${L.label}: Cramer's V = ${apaNum(s.nominal!.cramersV.value, 2, true)}, ${apaP(s.chi.pearson.p)}, N = ${fmtN(Math.round(s.N))}`;
      });
      const sigLayers = p.layers.filter((_, k) => statsAll[k].chi && statsAll[k].chi!.pearson.p < 0.05).length;
      const overallSig = totalStats.chi && totalStats.chi.pearson.p < 0.05;
      let pattern: string;
      if (overallSig && sigLayers === p.layers.length) pattern = 'The association holds within every layer, so it is not explained by the control variable (replication).';
      else if (overallSig && sigLayers === 0) pattern = 'The association disappears within the layers: the control variable may explain it (an explanation or interpretation pattern, depending on causal order).';
      else if (sigLayers > 0 && sigLayers < p.layers.length) pattern = 'The association appears in some layers but not others, which suggests the relationship depends on the control variable (specification). Compare the layer percentages directly.';
      else if (!overallSig && sigLayers > 0) pattern = 'Although there is no overall association, one appears within some layers (a suppressor pattern).';
      else pattern = 'There is no significant association overall or within the layers.';
      interp += ` Controlling for ${vprose(p.layer)} gives ${layerTexts.join('; ')}. ${pattern}`;
    }
    blocks.push(text('interpretation', interp + ` ${COHEN_NOTE}`));
    if (main.apa) blocks.push(text('apa', main.apa));
    for (const s of statsAll) {
      if (!s.chi) continue;
      const share = (100 * s.chi.cellsBelow5) / s.chi.cellsTotal;
      const where = p.layer ? ` (${s.label ?? 'all layers'})` : '';
      if (share > 20 || s.chi.minExpected < 1) {
        const exactHint = s.r === 2 && s.c === 2 ? "Use Fisher's exact test (shown in the table)" : 'Choose the exact test option or combine sparse categories';
        blocks.push(text('warning', `${fmtN(s.chi.cellsBelow5)} of ${s.chi.cellsTotal} cells${where} (${share.toFixed(1)}%) have expected counts below 5${s.chi.minExpected < 1 ? ', and at least one is below 1' : ''}. The chi-square approximation may be unreliable. ${exactHint}.`));
      }
    }
    if (weightMode === 'none' && layersAll.some((L) => L.table.some((r) => r.some((v) => !Number.isInteger(v))))) blocks.push(text('note', 'Cell counts are not whole numbers (non-integer weights, no adjustment). Exact tests are not available for such tables.'));
  }
  const cellsList = [co.observed ? 'COUNT' : '', co.expected ? 'EXPECTED' : '', co.rowPct ? 'ROW' : '', co.colPct ? 'COLUMN' : '', co.totPct ? 'TOTAL' : '', co.stdRes ? 'SRESID' : '', co.adjRes ? 'ASRESID' : ''].filter(Boolean);
  const statsList = [
    wantChi ? 'CHISQ' : '',
    optBool(opts, 'cc') ? 'CC' : '',
    optBool(opts, 'phi', true) ? 'PHI' : '',
    optBool(opts, 'lambda') ? 'LAMBDA' : '',
    optBool(opts, 'correlations') ? 'CORR' : '',
    optBool(opts, 'gamma') ? 'GAMMA' : '',
    optBool(opts, 'somersD') ? 'D' : '',
    optBool(opts, 'tauB') ? 'BTAU' : '',
    optBool(opts, 'tauC') ? 'CTAU' : '',
    optBool(opts, 'kappa') ? 'KAPPA' : '',
    optBool(opts, 'risk') ? 'RISK' : '',
    optBool(opts, 'mcnemar') ? 'MCNEMAR' : '',
    optBool(opts, 'cmh') && layerV ? 'CMH(1)' : '',
  ].filter(Boolean);
  let syntax = `CROSSTABS\n  /TABLES=${rowsV.map((v) => v.name).join(' ')} BY ${colsV.map((v) => v.name).join(' ')}${layerV ? ` BY ${layerV.name}` : ''}\n  /FORMAT=AVALUE TABLES`;
  if (statsList.length) syntax += `\n  /STATISTICS=${statsList.join(' ')}`;
  syntax += `\n  /CELLS=${cellsList.join(' ') || 'COUNT'}\n  /COUNT ${weightMode === 'round' ? 'ROUND CELL' : weightMode === 'truncate' ? 'TRUNCATE CELL' : 'ASIS'}`;
  if (optBool(opts, 'chart')) syntax += '\n  /BARCHART';
  if (optStr(opts, 'exact', 'asymptotic') === 'exact') syntax += '\n  /METHOD=EXACT TIMER(5)';
  syntax += '.';
  const p0 = pairs[0];
  return item('crosstabs', 'Crosstabs', ds, blocks, syntax, caseNote(ds, p0.N, p0.nMissing, pairs.length > 1 ? 'each table uses the cases valid on its own variables' : undefined));
}

const clustered = clusteredBar;

export const crosstabs: ProcedureDef = {
  id: 'crosstabs',
  menu: 'Descriptive Statistics',
  title: 'Crosstabs',
  description: 'Cross-tabulate two categorical variables, test whether they are associated, and add a control variable to elaborate the relationship.',
  guidance:
    'Put the independent variable (e.g. education) in Rows and the outcome (e.g. trust) in Columns, and read the row percentages. Add a Layer variable to check whether the association holds within groups of a control variable (the elaboration model).',
  slots: [
    { key: 'rows', label: 'Row(s)', min: 1, max: Infinity, measures: ['nominal', 'ordinal'] },
    { key: 'columns', label: 'Column(s)', min: 1, max: Infinity, measures: ['nominal', 'ordinal'] },
    { key: 'layer', label: 'Layer (control variable)', min: 0, max: 1, measures: ['nominal', 'ordinal'], help: 'Optional: produces a table per category of the control variable plus the total.' },
  ],
  options: [
    { key: 'observed', label: 'Observed counts', type: 'checkbox', default: true, group: 'Cells' },
    { key: 'expected', label: 'Expected counts', type: 'checkbox', default: false, group: 'Cells' },
    { key: 'rowPct', label: 'Row percentages', type: 'checkbox', default: true, group: 'Cells' },
    { key: 'colPct', label: 'Column percentages', type: 'checkbox', default: false, group: 'Cells' },
    { key: 'totPct', label: 'Total percentages', type: 'checkbox', default: false, group: 'Cells' },
    { key: 'stdRes', label: 'Standardized residuals', type: 'checkbox', default: false, group: 'Cells' },
    { key: 'adjRes', label: 'Adjusted standardized residuals', type: 'checkbox', default: false, group: 'Cells' },
    { key: 'chisq', label: 'Chi-square', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'phi', label: "Phi and Cramer's V", type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'cc', label: 'Contingency coefficient', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'lambda', label: 'Lambda and Goodman-Kruskal tau', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'gamma', label: 'Gamma', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'somersD', label: "Somers' d", type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'tauB', label: "Kendall's tau-b", type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'tauC', label: "Kendall's tau-c", type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'correlations', label: 'Correlations (Spearman, Pearson)', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'kappa', label: 'Kappa', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'risk', label: 'Risk (odds ratio, 2x2)', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'mcnemar', label: 'McNemar', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'cmh', label: 'Cochran-Mantel-Haenszel (layered 2x2)', type: 'checkbox', default: false, group: 'Statistics' },
    {
      key: 'exact',
      label: 'Exact tests',
      type: 'select',
      default: 'asymptotic',
      choices: [
        { value: 'asymptotic', label: "Asymptotic only (Fisher's exact test for 2x2 tables)" },
        { value: 'exact', label: 'Exact (Fisher-Freeman-Halton for larger tables)' },
      ],
      group: 'Exact',
      help: 'Large tables are estimated by Monte Carlo sampling with a fixed seed.',
    },
    {
      key: 'weights',
      label: 'Non-integer weights',
      type: 'select',
      default: 'round',
      choices: [
        { value: 'round', label: 'Round cell counts' },
        { value: 'truncate', label: 'Truncate cell counts' },
        { value: 'none', label: 'No adjustment' },
      ],
      group: 'Cells',
    },
    { key: 'chart', label: 'Clustered bar chart', type: 'checkbox', default: false, group: 'Charts' },
  ],
  run,
};
