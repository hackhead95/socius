// Analyze > Descriptive Statistics > Descriptives (SPSS DESCRIPTIVES) and Explore (SPSS EXAMINE).

import { selectCases } from '../../core/data';
import type { Dataset, Variable } from '../../core/types';
import type { ChartSpec, OutputBlock, OutputTable } from '../../core/output';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import { boxStats, expandIntegerWeights, exploreStats, ksLilliefors, shapiroWilk, summarize, DEFAULT_PERCENTILES, type ExploreStats } from '../../lib/stats/descriptives';
import { histogram } from './chartUtil';
import {
  apaNum,
  apaP,
  blank,
  caseNote,
  caseNoteRange,
  listProse,
  categoriesOf,
  cell,
  decFmt,
  fmtN,
  hcell,
  item,
  numericValues,
  optBool,
  optNum,
  optStr,
  pcell,
  requireNumeric,
  sameValue,
  selN,
  tableBlock,
  text,
  valueText,
  vars,
  vlabel,
  vprose,
  type Cell,
} from './common';

// ---------------------------------------------------------------------------------------------
// Descriptives
// ---------------------------------------------------------------------------------------------

function runDescriptives(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (!vs.length) throw new Error('Choose at least one numeric variable.');
  vs.forEach((v) => requireNumeric(v, 'Descriptives variables'));
  const want = (k: string, d = false) => optBool(opts, k, d);
  const stats = vs.map((v) => {
    const sel = selectCases(ds, [v.id]);
    const x = numericValues(ds, v, sel.rows);
    return { v, sel, s: x.length ? summarize(x, sel.weights) : null };
  });
  const order = optStr(opts, 'order', 'variables');
  if (order === 'ascendingMeans') stats.sort((a, b) => (a.s?.mean ?? Infinity) - (b.s?.mean ?? Infinity));
  if (order === 'descendingMeans') stats.sort((a, b) => (b.s?.mean ?? -Infinity) - (a.s?.mean ?? -Infinity));
  const listwise = selectCases(ds, vs.map((v) => v.id));
  const cols: Array<{ label: string; se?: boolean; get: (s: NonNullable<(typeof stats)[number]['s']>) => number; fmt?: 'int' | 'dec3'; raw?: boolean }> = [];
  cols.push({ label: 'N', get: (s) => s.N, fmt: 'int' });
  if (want('range')) cols.push({ label: 'Range', get: (s) => s.range, raw: true });
  if (want('min', true)) cols.push({ label: 'Minimum', get: (s) => s.min, raw: true });
  if (want('max', true)) cols.push({ label: 'Maximum', get: (s) => s.max, raw: true });
  if (want('sum')) cols.push({ label: 'Sum', get: (s) => s.sum, raw: true });
  if (want('mean', true)) cols.push({ label: 'Mean', get: (s) => s.mean });
  if (want('seMean')) cols.push({ label: 'Mean', se: true, get: (s) => s.seMean });
  if (want('sd', true)) cols.push({ label: 'Std. Deviation', get: (s) => s.sd });
  if (want('variance')) cols.push({ label: 'Variance', get: (s) => s.variance });
  if (want('skewness')) {
    cols.push({ label: 'Skewness', get: (s) => s.skewness, fmt: 'dec3' });
    cols.push({ label: 'Skewness', se: true, get: (s) => s.seSkewness, fmt: 'dec3' });
  }
  if (want('kurtosis')) {
    cols.push({ label: 'Kurtosis', get: (s) => s.kurtosis, fmt: 'dec3' });
    cols.push({ label: 'Kurtosis', se: true, get: (s) => s.seKurtosis, fmt: 'dec3' });
  }
  // header: row 1 grouped labels, row 2 Statistic / Std. Error
  const h1: Cell[] = [hcell('', { rowSpan: 2 })];
  const h2: Cell[] = [];
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    if (c.se) continue;
    const hasSe = i + 1 < cols.length && cols[i + 1].se && cols[i + 1].label === c.label;
    h1.push(hcell(c.label, hasSe ? { colSpan: 2 } : {}));
    h2.push(hcell('Statistic'));
    if (hasSe) h2.push(hcell('Std. Error'));
  }
  const rows: Cell[][] = stats.map(({ v, s }) => [hcell(vlabel(v)), ...cols.map((c, k) => (s ? cell(c.get(s), c.fmt ?? decFmt(v, c.raw ? 0 : 2)) : k === 0 ? cell(0, 'int') : cell(NaN)))]);
  rows.push([hcell('Valid N (listwise)'), cell(selN(listwise), 'int'), ...cols.slice(1).map(() => blank())]);
  const table: OutputTable = { title: 'Descriptive Statistics', header: [h1, h2], rows, ruleBefore: [rows.length - 1] };
  const blocks: OutputBlock[] = [tableBlock(table)];
  const valid = stats.filter((x) => x.s && x.s.N > 0);
  if (valid.length) {
    const val = (x: number) => apaNum(x, Number.isInteger(x) ? 0 : 2);
    const sentences = valid.map(({ v, s }) => `${vprose(v)} averaged ${apaNum(s!.mean)} (SD = ${apaNum(s!.sd)}, range ${val(s!.min)} to ${val(s!.max)}, N = ${fmtN(Math.round(s!.N))})`);
    let interp = sentences.join('; ') + '.';
    const skewed = valid.filter(({ s }) => Number.isFinite(s!.skewness) && Math.abs(s!.skewness) > 1);
    if (want('skewness') && skewed.length) interp += ` ${skewed.map(({ v }) => vprose(v)).join(', ')} ${skewed.length === 1 ? 'is' : 'are'} strongly skewed (|skewness| > 1); the mean may not describe a typical case well.`;
    if (vs.length > 1 && selN(listwise) < Math.max(...valid.map(({ s }) => s!.N))) interp += ` Only ${fmtN(Math.round(selN(listwise)))} cases have valid values on all ${vs.length} variables.`;
    blocks.push(text('interpretation', interp));
    blocks.push(text('apa', valid.map(({ v, s }) => `${vprose(v)}: M = ${apaNum(s!.mean)}, SD = ${apaNum(s!.sd)}`).join('; ') + '.'));
  }
  const empty = stats.filter((x) => !x.s || !(x.s.N > 0));
  if (empty.length) blocks.push(text('warning', `${listProse(empty.map(({ v }) => v.name))} ${empty.length === 1 ? 'has' : 'have'} no valid values among the selected cases (every case is missing or filtered out), so no statistics can be computed.`));
  const small = valid.filter(({ s }) => s!.N < 3);
  if (small.length) blocks.push(text('warning', `${small.map(({ v }) => v.name).join(', ')}: fewer than three valid cases, so the standard deviation and shape statistics are unreliable or not computable.`));
  const statList = [want('mean', true) ? 'MEAN' : '', want('sum') ? 'SUM' : '', want('sd', true) ? 'STDDEV' : '', want('variance') ? 'VARIANCE' : '', want('range') ? 'RANGE' : '', want('min', true) ? 'MIN' : '', want('max', true) ? 'MAX' : '', want('seMean') ? 'SEMEAN' : '', want('kurtosis') ? 'KURTOSIS' : '', want('skewness') ? 'SKEWNESS' : ''].filter(Boolean);
  const syntax = `DESCRIPTIVES VARIABLES=${vs.map((v) => v.name).join(' ')}\n  /STATISTICS=${statList.join(' ')}${order !== 'variables' ? `\n  /SORT=MEAN (${order === 'ascendingMeans' ? 'A' : 'D'})` : ''}.`;
  const note = vs.length > 1 ? caseNoteRange(ds, stats.map((x) => selN(x.sel)), selN(listwise)) : caseNote(ds, selN(stats[0].sel), stats[0].sel.nMissing);
  return item('descriptives', 'Descriptives', ds, blocks, syntax, note);
}

export const descriptives: ProcedureDef = {
  id: 'descriptives',
  menu: 'Descriptive Statistics',
  title: 'Descriptives',
  description: 'Mean, standard deviation, minimum and maximum for numeric variables, side by side.',
  guidance: 'Use for scale variables (age, income, index scores). Each variable uses all of its valid cases; the last row shows how many cases are complete on every variable.',
  slots: [{ key: 'variables', label: 'Variable(s)', min: 1, max: Infinity, types: ['numeric'], measures: ['scale', 'ordinal'] }],
  options: [
    { key: 'mean', label: 'Mean', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'sum', label: 'Sum', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'sd', label: 'Std. deviation', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'variance', label: 'Variance', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'range', label: 'Range', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'min', label: 'Minimum', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'max', label: 'Maximum', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'seMean', label: 'S.E. mean', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'skewness', label: 'Skewness', type: 'checkbox', default: false, group: 'Distribution' },
    { key: 'kurtosis', label: 'Kurtosis', type: 'checkbox', default: false, group: 'Distribution' },
    {
      key: 'order',
      label: 'Display order',
      type: 'select',
      default: 'variables',
      choices: [
        { value: 'variables', label: 'Variable list' },
        { value: 'ascendingMeans', label: 'Ascending means' },
        { value: 'descendingMeans', label: 'Descending means' },
      ],
      group: 'Display',
    },
  ],
  run: runDescriptives,
};

// ---------------------------------------------------------------------------------------------
// Explore
// ---------------------------------------------------------------------------------------------

interface Cellish {
  dep: Variable;
  level: string | null;
  x: Float64Array;
  w: Float64Array;
  rows: number[];
}

function runExplore(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const deps = vars(ds, slots, 'dependents');
  if (!deps.length) throw new Error('Choose at least one dependent variable.');
  deps.forEach((v) => requireNumeric(v, 'Explore dependent variables'));
  const factors = vars(ds, slots, 'factor');
  const factor = factors[0] ?? null;
  const conf = optNum(opts, 'ciLevel', 95) / 100;
  if (!(conf > 0 && conf < 1)) throw new Error('The confidence level must be between 1 and 99 percent.');
  const listwise = optStr(opts, 'missing', 'listwise') === 'listwise';
  const blocks: OutputBlock[] = [];
  const allIds = [...deps.map((d) => d.id), ...(factor ? [factor.id] : [])];
  const selAll = selectCases(ds, allIds);
  const groupsFor = (dep: Variable): Cellish[] => {
    const sel = listwise ? selAll : selectCases(ds, [dep.id, ...(factor ? [factor.id] : [])]);
    if (!factor) return [{ dep, level: null, x: numericValues(ds, dep, sel.rows), w: sel.weights, rows: sel.rows }];
    const cats = categoriesOf(ds, factor, sel.rows);
    const fcol = ds.columns[factor.id];
    return cats.map((c) => {
      const idx: number[] = [];
      sel.rows.forEach((r, k) => {
        if (sameValue(fcol[r], c)) idx.push(k);
      });
      const rows = idx.map((k) => sel.rows[k]);
      return { dep, level: valueText(factor, c), x: numericValues(ds, dep, rows), w: Float64Array.from(idx.map((k) => sel.weights[k])), rows };
    });
  };
  const cellsByDep = deps.map((d) => groupsFor(d));
  // Case Processing Summary
  {
    const rows: Cell[][] = [];
    const totalActive = selectCases(ds, [], {});
    const Wtot = selN(totalActive);
    deps.forEach((d, di) => {
      const sel = listwise ? selAll : selectCases(ds, [d.id, ...(factor ? [factor.id] : [])]);
      const cells = cellsByDep[di];
      if (!factor) {
        const valid = selN(sel);
        rows.push([hcell(vlabel(d)), cell(valid, 'int'), cell((100 * valid) / Wtot, 'pct'), cell(Wtot - valid, 'int'), cell((100 * (Wtot - valid)) / Wtot, 'pct'), cell(Wtot, 'int'), cell(100, 'pct')]);
      } else {
        // per factor level: totals among cases with a valid factor value
        const fsel = selectCases(ds, [factor.id]);
        const fcol = ds.columns[factor.id];
        cells.forEach((c, ci) => {
          let tot = 0;
          fsel.rows.forEach((r, k) => {
            if (valueText(factor, fcol[r]) === c.level) tot += fsel.weights[k];
          });
          const valid = c.w.reduce((a, b) => a + b, 0);
          rows.push([
            ...(ci === 0 ? [hcell(vlabel(d), { rowSpan: cells.length })] : []),
            hcell(c.level ?? ''),
            cell(valid, 'int'),
            cell(tot > 0 ? (100 * valid) / tot : NaN, 'pct'),
            cell(tot - valid, 'int'),
            cell(tot > 0 ? (100 * (tot - valid)) / tot : NaN, 'pct'),
            cell(tot, 'int'),
            cell(100, 'pct'),
          ]);
        });
      }
    });
    const stub = factor ? 2 : 1;
    blocks.push(
      tableBlock({
        title: 'Case Processing Summary',
        header: [
          [hcell('', { colSpan: stub, rowSpan: 2 }), hcell('Cases', { colSpan: 6 })],
          [hcell('Valid N'), hcell('Percent'), hcell('Missing N'), hcell('Percent'), hcell('Total N'), hcell('Percent')],
        ],
        rows,
        stubColumns: stub,
      }),
    );
  }
  const statsBy: Array<Array<{ c: Cellish; e: ExploreStats | null }>> = cellsByDep.map((cells) => cells.map((c) => ({ c, e: c.x.length ? exploreStats(c.x, c.w, conf) : null })));
  // Descriptives
  if (optBool(opts, 'descriptives', true)) {
    const rows: Cell[][] = [];
    const ruleBefore: number[] = [];
    const labels: Array<[string, (e: ExploreStats) => number, ((e: ExploreStats) => number) | null, boolean]> = [
      ['Mean', (e) => e.mean, (e) => e.seMean, false],
      [`${Math.round(conf * 100)}% Confidence Interval for Mean: Lower Bound`, (e) => e.ciLower, null, false],
      [`${Math.round(conf * 100)}% Confidence Interval for Mean: Upper Bound`, (e) => e.ciUpper, null, false],
      ['5% Trimmed Mean', (e) => e.trimmedMean, null, false],
      ['Median', (e) => e.median, null, false],
      ['Variance', (e) => e.variance, null, false],
      ['Std. Deviation', (e) => e.sd, null, false],
      ['Minimum', (e) => e.min, null, false],
      ['Maximum', (e) => e.max, null, false],
      ['Range', (e) => e.range, null, false],
      ['Interquartile Range', (e) => e.iqr, null, false],
      ['Skewness', (e) => e.skewness, (e) => e.seSkewness, true],
      ['Kurtosis', (e) => e.kurtosis, (e) => e.seKurtosis, true],
    ];
    statsBy.forEach((list, di) => {
      list.forEach(({ c, e }, ci) => {
        if (rows.length) ruleBefore.push(rows.length);
        labels.forEach(([lab, fn, se, three], li) => {
          const f = three ? 'dec3' : decFmt(c.dep);
          const r: Cell[] = [];
          if (ci === 0 && li === 0) r.push(hcell(vlabel(deps[di]), { rowSpan: labels.length * list.length }));
          if (factor && li === 0) r.push(hcell(c.level ?? '', { rowSpan: labels.length }));
          r.push(hcell(lab));
          r.push(e ? cell(fn(e), f) : cell(NaN));
          r.push(e && se ? cell(se(e), 'dec3') : blank());
          rows.push(r);
        });
      });
    });
    const stub = factor ? 3 : 2;
    blocks.push(tableBlock({ title: 'Descriptives', header: [[hcell('', { colSpan: stub }), hcell('Statistic'), hcell('Std. Error')]], rows, stubColumns: stub, ruleBefore }));
  }
  // Percentiles
  if (optBool(opts, 'percentiles', false)) {
    const rows: Cell[][] = [];
    statsBy.forEach((list, di) => {
      list.forEach(({ c, e }, ci) => {
        const base: Cell[] = [];
        if (ci === 0) base.push(hcell(vlabel(deps[di]), { rowSpan: 2 * list.length }));
        if (factor) base.push(hcell(c.level ?? '', { rowSpan: 2 }));
        rows.push([...base, hcell('Weighted Average (Definition 1)'), ...DEFAULT_PERCENTILES.map((p, k) => (e ? cell(e.percentiles[k].value, decFmt(c.dep)) : cell(NaN)))]);
        rows.push([
          hcell("Tukey's Hinges"),
          ...DEFAULT_PERCENTILES.map((p) => {
            if (!e) return cell(NaN);
            if (p === 25) return cell(e.hinges[0], decFmt(c.dep));
            if (p === 50) return cell(e.hinges[1], decFmt(c.dep));
            if (p === 75) return cell(e.hinges[2], decFmt(c.dep));
            return blank();
          }),
        ]);
      });
    });
    const stub = factor ? 3 : 2;
    blocks.push(
      tableBlock({
        title: 'Percentiles',
        header: [
          [hcell('', { colSpan: stub, rowSpan: 2 }), hcell('Percentiles', { colSpan: DEFAULT_PERCENTILES.length })],
          DEFAULT_PERCENTILES.map((p) => hcell(String(p))),
        ],
        rows,
        stubColumns: stub,
      }),
    );
  }
  // Tests of normality
  const normalityNotes: string[] = [];
  const nonNormal: string[] = [];
  const normalOk: string[] = [];
  if (optBool(opts, 'normality', true)) {
    const rows: Cell[][] = [];
    let anyLower = false;
    let anyNonInteger = false;
    let anyTooSmall = false;
    statsBy.forEach((list, di) => {
      list.forEach(({ c }, ci) => {
        const r: Cell[] = [];
        if (ci === 0) r.push(hcell(vlabel(deps[di]), { rowSpan: list.length }));
        if (factor) r.push(hcell(c.level ?? ''));
        const N = c.w.reduce((a, b) => a + b, 0);
        const constant = c.x.length > 0 && c.x.every((v) => v === c.x[0]);
        if (N < 3 || constant) {
          anyTooSmall = true;
          r.push(cell(NaN), cell(N, 'int'), cell(NaN), cell(NaN), cell(N, 'int'), cell(NaN));
          rows.push(r);
          return;
        }
        const ks = ksLilliefors(c.x, c.w);
        if (ks.lowerBound) anyLower = true;
        r.push(cell(ks.D, 'r'), cell(N, 'int'), cell(ks.p, 'p', ks.lowerBound ? { mark: '*' } : ks.p < 0.05 ? { tone: 'good' } : {}));
        const ex = expandIntegerWeights(c.x, c.w);
        let swP = NaN;
        if (!ex.integer) {
          anyNonInteger = true;
          r.push(cell(NaN), cell(N, 'int'), cell(NaN));
        } else if (ex.values.length > 5000) {
          r.push(cell(NaN), cell(N, 'int'), cell(NaN));
          normalityNotes.push(`Shapiro-Wilk is only available for up to 5,000 cases (${vlabel(c.dep)}${c.level ? `, ${c.level}` : ''}); use the Kolmogorov-Smirnov result or a Q-Q plot.`);
        } else {
          const sw = shapiroWilk(ex.values);
          swP = sw.p;
          r.push(cell(sw.W, 'r'), cell(ex.values.length, 'int'), pcell(sw.p));
        }
        const who = `${vprose(c.dep)}${c.level ? ` (${c.level})` : ''}`;
        const decisive = Number.isFinite(swP) ? swP : ks.p;
        if (decisive < 0.05) nonNormal.push(`${who}: ${Number.isFinite(swP) ? `Shapiro-Wilk W = ${apaNum(shapiroWilk(ex.values).W, 3, true)}, ${apaP(swP)}` : `D = ${apaNum(ks.D, 3, true)}, ${apaP(ks.p)}`}`);
        else normalOk.push(who);
        rows.push(r);
      });
    });
    const foot: string[] = [];
    if (anyLower) foot.push('*. This is a lower bound of the true significance.');
    foot.push('a. Lilliefors Significance Correction');
    if (anyNonInteger) foot.push('Shapiro-Wilk is not computed when case weights are not whole numbers.');
    if (anyTooSmall) foot.push('Normality tests need at least 3 cases with some variation.');
    const stub = factor ? 2 : 1;
    blocks.push(
      tableBlock({
        title: 'Tests of Normality',
        header: [
          [hcell('', { colSpan: stub, rowSpan: 2 }), hcell('Kolmogorov-Smirnov', { colSpan: 3, mark: 'a' }), hcell('Shapiro-Wilk', { colSpan: 3 })],
          [hcell('Statistic'), hcell('df'), hcell('Sig.'), hcell('Statistic'), hcell('df'), hcell('Sig.')],
        ],
        rows,
        stubColumns: stub,
        footnotes: foot,
      }),
    );
  }
  // Charts
  if (optBool(opts, 'boxplot', true)) {
    deps.forEach((d, di) => {
      const groups = statsBy[di]
        .filter(({ c }) => c.x.length > 0)
        .map(({ c, e }) => {
          const b = boxStats(c.x, c.w);
          return {
            name: c.level ?? vlabel(d),
            min: b.lowWhisker,
            q1: b.q1,
            median: b.median,
            q3: b.q3,
            max: b.highWhisker,
            mean: e?.mean,
            outliers: b.outliers.slice(0, 200).map((o) => ({ value: o.value, caseIndex: c.rows[o.index] + 1, extreme: o.extreme })),
            n: b.n,
          };
        });
      if (groups.length) {
        const chart: ChartSpec = { type: 'box', title: vlabel(d), xLabel: factor ? vlabel(factor) : undefined, yLabel: vlabel(d), groups };
        blocks.push({ kind: 'chart', chart });
      }
    });
  }
  if (optBool(opts, 'histogram', false)) {
    statsBy.forEach((list) =>
      list.forEach(({ c, e }) => {
        if (!c.x.length || !e) return;
        const h = histogram(c.x, c.w);
        blocks.push({ kind: 'chart', chart: { type: 'histogram', title: `${vlabel(c.dep)}${c.level ? ` (${c.level})` : ''}`, xLabel: vlabel(c.dep), yLabel: 'Frequency', edges: h.edges, counts: h.counts, normal: e.sd > 0 ? { mean: e.mean, sd: e.sd, n: e.N } : undefined } });
      }),
    );
  }
  // Interpretation
  const parts: string[] = [];
  statsBy.forEach((list) =>
    list.forEach(({ c, e }) => {
      if (!e) return;
      const who = `${vprose(c.dep)}${c.level ? ` for ${c.level}` : ''}`;
      let s = `${who}: mean ${apaNum(e.mean)} (${Math.round(conf * 100)}% CI ${apaNum(e.ciLower)} to ${apaNum(e.ciUpper)}), median ${apaNum(e.median)}, SD ${apaNum(e.sd)}, N = ${fmtN(Math.round(e.N))}.`;
      if (Number.isFinite(e.skewness) && Math.abs(e.skewness) > 2 * e.seSkewness) s += ` The distribution is ${e.skewness > 0 ? 'right' : 'left'}-skewed (skewness ${apaNum(e.skewness)} is more than twice its standard error).`;
      const b = boxStats(c.x, c.w);
      if (b.outliers.length) s += ` The boxplot flags ${b.outliers.length} outlying value${b.outliers.length === 1 ? '' : 's'}${b.outliers.some((o) => o.extreme) ? ', including extreme ones (more than 3 box-lengths from the box)' : ''}.`;
      parts.push(s);
    }),
  );
  if (nonNormal.length) parts.push(`Normality is doubtful for ${nonNormal.join('; ')}. With large samples these tests flag even small departures, so also look at the histogram or boxplot; t tests and ANOVA tolerate moderate departures from normality when groups are large and similar in size.`);
  else if (normalOk.length && optBool(opts, 'normality', true)) parts.push('The normality tests do not indicate a significant departure from a normal distribution.');
  if (parts.length) blocks.push(text('interpretation', parts.join(' ')));
  const apaParts = statsBy.flatMap((list) => list.filter(({ e }) => e).map(({ c, e }) => `${vprose(c.dep)}${c.level ? ` (${c.level})` : ''}: M = ${apaNum(e!.mean)}, SD = ${apaNum(e!.sd)}, Mdn = ${apaNum(e!.median)}`));
  if (apaParts.length) blocks.push(text('apa', apaParts.join('; ') + '.'));
  for (const n of normalityNotes) blocks.push(text('note', n));
  const small = statsBy.flatMap((l) => l.filter(({ c }) => c.w.reduce((a, b) => a + b, 0) < 10).map(({ c }) => `${c.dep.name}${c.level ? ` (${c.level})` : ''}`));
  if (small.length) blocks.push(text('warning', `Very small groups (fewer than 10 cases): ${small.join(', ')}. Normality tests have little power and descriptive statistics are unstable.`));
  const plots = [optBool(opts, 'boxplot', true) ? 'BOXPLOT' : '', optBool(opts, 'histogram', false) ? 'HISTOGRAM' : '', optBool(opts, 'normality', true) ? 'NPPLOT' : ''].filter(Boolean);
  const syntax = `EXAMINE VARIABLES=${deps.map((d) => d.name).join(' ')}${factor ? ` BY ${factor.name}` : ''}\n  /PLOT ${plots.length ? plots.join(' ') : 'NONE'}\n  /COMPARE GROUPS\n  /STATISTICS DESCRIPTIVES\n  /CINTERVAL ${Math.round(conf * 100)}${optBool(opts, 'percentiles', false) ? '\n  /PERCENTILES(5,10,25,50,75,90,95) HAVERAGE' : ''}\n  /MISSING ${listwise ? 'LISTWISE' : 'PAIRWISE'}\n  /NOTOTAL.`;
  return item('explore', 'Explore', ds, blocks, syntax, caseNote(ds, selN(selAll), selAll.nMissing, listwise ? 'listwise deletion across all listed variables' : undefined));
}

export const explore: ProcedureDef = {
  id: 'explore',
  menu: 'Descriptive Statistics',
  title: 'Explore',
  description: 'Look closely at a scale variable, overall or by group: confidence intervals, percentiles, normality tests and boxplots.',
  guidance:
    'Use before a t test or ANOVA to check assumptions: are there outliers, is the distribution roughly normal within each group? Shapiro-Wilk is usually more powerful than Kolmogorov-Smirnov for n up to 5,000.',
  slots: [
    { key: 'dependents', label: 'Dependent List', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
    { key: 'factor', label: 'Factor List', min: 0, max: 1, measures: ['nominal', 'ordinal'], help: 'Optional grouping variable.' },
  ],
  options: [
    { key: 'descriptives', label: 'Descriptives', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'ciLevel', label: 'Confidence interval for mean (%)', type: 'number', default: 95, min: 50, max: 99.9, step: 1, group: 'Statistics' },
    { key: 'percentiles', label: 'Percentiles', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'normality', label: 'Normality tests', type: 'checkbox', default: true, group: 'Plots' },
    { key: 'boxplot', label: 'Boxplot', type: 'checkbox', default: true, group: 'Plots' },
    { key: 'histogram', label: 'Histogram', type: 'checkbox', default: false, group: 'Plots' },
    {
      key: 'missing',
      label: 'Missing values',
      type: 'select',
      default: 'listwise',
      choices: [
        { value: 'listwise', label: 'Exclude cases listwise' },
        { value: 'pairwise', label: 'Exclude cases pairwise' },
      ],
      group: 'Options',
    },
  ],
  run: runExplore,
};
