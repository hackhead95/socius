// Graphs menu: chart procedures that build OutputItems with a chart, a small summary table, SPSS
// syntax and a one-line interpretation. Filter, weights and missing values follow core/data.ts.

import { allFinite, cleanBlocks, countText, labelOf, numText } from '../text';
import type { Dataset, Variable } from '../../core/types';
import { newId } from '../../core/types';
import { distinctValues, requireVariable, selectCases, varDisplayName, type CaseSelection } from '../../core/data';
import type { ProcedureDef } from '../../core/procedure';
import { cell, hcell, type Cell, type ChartSpec, type OutputBlock, type OutputItem } from '../../core/output';
import { formatP } from '../../features/output/format';
import { binCounts, boxStats, histogramEdges, linearFit, meanCI, tTwoSidedP, wMoments, wPercentile } from './stats';
import { vprose } from '../core/common';

// ---------- helpers ----------

const fmt = (x: number, d = 1) => (Number.isFinite(x) ? numText(x, d) : '.');
const fmtN = countText;
const dropZero = (s: string) => s.replace(/^(-?)0\./, '$1.');

function name(v: Variable): string {
  return varDisplayName(v, 'label');
}

/** How a variable is named inside a sentence (short label, else the variable name). */
const prose = vprose;

/** A data value in prose: whole numbers without decimals, others with two. */
const fmtVal = (x: number) => (Number.isFinite(x) && Number.isInteger(x) ? fmt(x, 0) : fmt(x, 2));

function caseNote(ds: Dataset, sel: CaseSelection): string {
  const W = sel.weights.reduce((a, b) => a + b, 0);
  const parts = [`N = ${fmtN(Math.round(W * 10) / 10)}`];
  if (ds.weightVarId) {
    const wv = ds.variables.find((v) => v.id === ds.weightVarId);
    parts[0] += ` (weighted by ${wv?.name ?? 'weight'}; ${fmtN(sel.rows.length)} cases)`;
  }
  const extra: string[] = [];
  if (sel.nMissing) extra.push(`${fmtN(sel.nMissing)} case${sel.nMissing === 1 ? "" : "s"} excluded for missing values`);
  const fv = ds.filterVarId ? ds.variables.find((v) => v.id === ds.filterVarId) : undefined;
  if (sel.nFiltered) extra.push(`${fmtN(sel.nFiltered)} ${fv ? `filtered out by ${fv.name}` : 'with zero or missing weight'}`);
  return [parts[0], ...extra].join('; ') + '.';
}

function syntaxPrefix(ds: Dataset): string {
  const lines: string[] = [];
  if (ds.filterVarId) lines.push(`FILTER BY ${ds.variables.find((v) => v.id === ds.filterVarId)?.name}.`);
  if (ds.weightVarId) lines.push(`WEIGHT BY ${ds.variables.find((v) => v.id === ds.weightVarId)?.name}.`);
  return lines.length ? lines.join('\n') + '\n' : '';
}

function item(ds: Dataset, procedure: string, title: string, syntax: string, sel: CaseSelection, blocks: OutputBlock[]): OutputItem {
  return { id: newId('out'), procedure, title, createdAt: Date.now(), datasetName: ds.name, syntax: syntaxPrefix(ds) + syntax, caseNote: caseNote(ds, sel), blocks: cleanBlocks(blocks) };
}

interface Category {
  value: number | string;
  label: string;
}

function categoriesOf(ds: Dataset, v: Variable, rows: number[]): Category[] {
  return distinctValues(ds, v, rows).map((value) => ({ value, label: labelOf(v, value) }));
}

function keyOf(x: number | string): string {
  return typeof x === 'string' ? 's:' + x.trimEnd() : 'n:' + x;
}

function valueAt(ds: Dataset, v: Variable, row: number): number | string {
  const x = ds.columns[v.id][row];
  return typeof x === 'string' ? x.trimEnd() : x;
}

function need(sel: CaseSelection, what = 'this chart'): void {
  if (!sel.rows.length) throw new Error(`No cases are left for ${what} after removing missing values and filtered cases.`);
}

function numericValues(ds: Dataset, v: Variable, rows: number[]): number[] {
  const col = ds.columns[v.id];
  if (!(col instanceof Float64Array)) throw new Error(`${v.name} is not numeric.`);
  return rows.map((r) => col[r]);
}

const CAT_MEASURES: Variable['measure'][] = ['nominal', 'ordinal'];

// ---------- Bar chart ----------

const barChart: ProcedureDef = {
  id: 'graph-bar',
  menu: 'Graphs',
  title: 'Bar Chart',
  description: 'Show how often each category occurs, or compare the mean of a scale variable across categories.',
  guidance:
    'Use a bar chart for categorical variables (education, region, party). Choose "Percent" to compare groups of different sizes. ' +
    'Add a cluster variable to compare categories across groups (for example education by sex); "Percentages within" controls which percentages add up to 100. ' +
    'For a scale variable such as income, choose "Mean" to get one bar per category with 95% confidence intervals.',
  slots: [
    { key: 'category', label: 'Category axis', min: 1, max: 1, measures: CAT_MEASURES, help: 'One bar (or group of bars) per category.' },
    { key: 'cluster', label: 'Cluster by (optional)', min: 0, max: 1, measures: CAT_MEASURES, help: 'Separate bars for each group, up to 8.' },
    { key: 'variable', label: 'Variable for means (optional)', min: 0, max: 1, types: ['numeric'], measures: ['scale'], help: 'Used when the statistic is "Mean".' },
  ],
  options: [
    { key: 'stat', label: 'Bars show', type: 'select', default: 'count', group: 'Chart', choices: [
      { value: 'count', label: 'Number of cases' },
      { value: 'percent', label: 'Percent of cases' },
      { value: 'mean', label: 'Mean of a variable' },
    ] },
    { key: 'pctBase', label: 'Percentages within', type: 'select', default: 'cluster', group: 'Chart', choices: [
      { value: 'cluster', label: 'Each cluster group' },
      { value: 'category', label: 'Each category' },
      { value: 'total', label: 'All cases' },
    ], help: 'With a cluster variable and "Percent": "Each cluster group" makes the bars of one colour add to 100%; "Each category" makes each group of bars add to 100%.' },
    { key: 'layout', label: 'Clustered bars', type: 'select', default: 'clustered', group: 'Chart', choices: [
      { value: 'clustered', label: 'Side by side' },
      { value: 'stacked', label: 'Stacked' },
    ] },
    { key: 'orientation', label: 'Orientation', type: 'select', default: 'vertical', group: 'Chart', choices: [
      { value: 'vertical', label: 'Vertical bars' },
      { value: 'horizontal', label: 'Horizontal bars (long labels)' },
    ] },
    { key: 'errorBars', label: 'Show 95% confidence intervals (means)', type: 'checkbox', default: true, group: 'Chart' },
  ],
  validate: (ds, vars, opts) => {
    if (opts.stat === 'mean' && !vars.variable?.length) return 'Choose a scale variable in "Variable for means", or change "Bars show".';
    if (opts.stat !== 'mean' && vars.variable?.length) return 'You added a variable for means. Set "Bars show" to "Mean of a variable", or remove it.';
    return null;
  },
  run: (ds, vars, opts) => {
    const cv = requireVariable(ds, vars.category[0]);
    const kv = vars.cluster?.[0] ? requireVariable(ds, vars.cluster[0]) : null;
    const mv = vars.variable?.[0] ? requireVariable(ds, vars.variable[0]) : null;
    const stat = String(opts.stat ?? 'count');
    const ids = [cv.id, ...(kv ? [kv.id] : []), ...(stat === 'mean' && mv ? [mv.id] : [])];
    const sel = selectCases(ds, ids);
    need(sel);
    const cats = categoriesOf(ds, cv, sel.rows);
    if (cats.length > 60) throw new Error(`${cv.name} has ${cats.length} categories; a bar chart needs 60 or fewer. Use a histogram for scale variables, or recode into groups.`);
    const groups = kv ? categoriesOf(ds, kv, sel.rows) : [{ value: '', label: stat === 'mean' && mv ? `Mean ${name(mv)}` : stat === 'percent' ? 'Percent' : 'Count' }];
    if (kv && groups.length > 8) throw new Error(`${kv.name} has ${groups.length} categories; clustered bars can show up to 8. Recode it into fewer groups.`);
    const ci = new Map(cats.map((c, i) => [keyOf(c.value), i]));
    const gi = new Map(groups.map((g, i) => [keyOf(g.value), i]));
    const C = cats.length;
    const G = groups.length;
    const counts = Array.from({ length: G }, () => new Array(C).fill(0));
    const xs: number[][][] = Array.from({ length: G }, () => Array.from({ length: C }, () => []));
    const ws: number[][][] = Array.from({ length: G }, () => Array.from({ length: C }, () => []));
    const mcol = mv ? (ds.columns[mv.id] as Float64Array) : null;
    sel.rows.forEach((r, k) => {
      const c = ci.get(keyOf(valueAt(ds, cv, r)))!;
      const g = kv ? gi.get(keyOf(valueAt(ds, kv, r)))! : 0;
      const w = sel.weights[k];
      counts[g][c] += w;
      if (stat === 'mean' && mcol) {
        xs[g][c].push(mcol[r]);
        ws[g][c].push(w);
      }
    });
    const total = counts.flat().reduce((a, b) => a + b, 0);
    const horizontal = opts.orientation === 'horizontal';
    const stacked = !!kv && opts.layout === 'stacked' && stat !== 'mean';
    const blocks: OutputBlock[] = [];
    let chart: ChartSpec;
    let tableRows: Cell[][];
    let header: Cell[][];
    let interp: string;
    let syntax: string;
    const kind = kv ? (stacked ? 'STACK' : 'GROUPED') : 'SIMPLE';
    const byClause = `${cv.name}${kv ? ` BY ${kv.name}` : ''}`;

    if (stat === 'mean' && mv) {
      const stats = counts.map((_, g) => cats.map((__, c) => meanCI(xs[g][c], ws[g][c])));
      const errors = opts.errorBars !== false ? stats.map((row) => row.map((s) => (Number.isFinite(s.lo) ? ([s.lo, s.hi] as [number, number]) : null))) : undefined;
      chart = {
        type: 'bar',
        title: `Mean ${name(mv)} by ${name(cv)}${kv ? ` and ${name(kv)}` : ''}`,
        xLabel: name(cv),
        yLabel: `Mean ${name(mv)}`,
        categories: cats.map((c) => c.label),
        series: groups.map((g, gidx) => ({ name: kv ? g.label : `Mean ${name(mv)}`, values: stats[gidx].map((s) => (Number.isFinite(s.mean) ? s.mean : NaN)) })),
        horizontal,
        errors,
      };
      header = [[hcell(name(cv)), ...(kv ? [hcell(name(kv))] : []), hcell('Mean'), hcell('95% CI lower'), hcell('95% CI upper'), hcell('Std. Deviation'), hcell('N')]];
      tableRows = [];
      cats.forEach((c, ci_) =>
        groups.forEach((g, gidx) => {
          const s = stats[gidx][ci_];
          tableRows.push([
            ...(gidx === 0 ? [hcell(c.label, { rowSpan: kv ? G : 1 })] : []),
            ...(kv ? [hcell(g.label)] : []),
            cell(s.n > 0 ? s.mean : NaN, 'dec2'),
            cell(s.lo, 'dec2'),
            cell(s.hi, 'dec2'),
            cell(s.sd, 'dec2'),
            cell(s.n, 'int'),
          ]);
        }),
      );
      const flat: Array<{ label: string; m: number }> = [];
      cats.forEach((c, ci_) => groups.forEach((g, gidx) => { const m = stats[gidx][ci_].mean; if (Number.isFinite(m)) flat.push({ label: kv ? `${c.label} (${g.label})` : c.label, m }); }));
      flat.sort((a, b) => b.m - a.m);
      interp = flat.length >= 2
        ? `Mean ${prose(mv)} is highest for ${flat[0].label} (M = ${fmt(flat[0].m, 2)}) and lowest for ${flat[flat.length - 1].label} (M = ${fmt(flat[flat.length - 1].m, 2)}).` +
          (errors ? ' Error bars are 95% confidence intervals: bars whose intervals do not overlap differ reliably, but overlapping intervals do not prove the groups are equal. Use a t-test or ANOVA to test the difference.' : '')
        : `Mean ${prose(mv)}: ${flat.length ? fmt(flat[0].m, 2) : 'not computable'}.`;
      syntax = `GRAPH\n  /BAR(${kind})=MEAN(${mv.name}) BY ${byClause}${errors ? '\n  /INTERVAL CI(95.0)' : ''}.`;
    } else {
      const pct = stat === 'percent';
      const base = String(opts.pctBase ?? 'cluster');
      const catTotals = cats.map((_, c) => counts.reduce((a, row) => a + row[c], 0));
      const grpTotals = counts.map((row) => row.reduce((a, b) => a + b, 0));
      const val = (g: number, c: number) => {
        if (!pct) return counts[g][c];
        const den = !kv || base === 'total' ? total : base === 'category' ? catTotals[c] : grpTotals[g];
        return den > 0 ? (counts[g][c] / den) * 100 : 0;
      };
      chart = {
        type: 'bar',
        title: `${name(cv)}${kv ? ` by ${name(kv)}` : ''}`,
        xLabel: name(cv),
        yLabel: pct ? (kv && base === 'cluster' ? `Percent within ${name(kv)}` : kv && base === 'category' ? `Percent within ${name(cv)}` : 'Percent') : 'Count',
        categories: cats.map((c) => c.label),
        series: groups.map((g, gidx) => ({ name: kv ? g.label : pct ? 'Percent' : 'Count', values: cats.map((_, c) => val(gidx, c)) })),
        stacked,
        percent: pct,
        horizontal,
      };
      if (kv) {
        header = [
          [hcell(name(cv), { rowSpan: 2 }), hcell(name(kv), { colSpan: G }), hcell('Total', { rowSpan: 2 })],
          groups.map((g) => hcell(g.label)),
        ];
        tableRows = cats.map((c, ci_) => [hcell(c.label), ...groups.map((_, g) => (pct ? cell(val(g, ci_), 'pct') : cell(counts[g][ci_], 'int'))), pct ? cell(base === 'category' ? 100 : base === 'total' ? (catTotals[ci_] / total) * 100 : (catTotals[ci_] / total) * 100, 'pct') : cell(catTotals[ci_], 'int')]);
        tableRows.push([hcell('Total', { bold: true }), ...groups.map((_, g) => (pct ? cell(base === 'cluster' ? 100 : (grpTotals[g] / total) * 100, 'pct') : cell(grpTotals[g], 'int'))), pct ? cell(100, 'pct') : cell(total, 'int')]);
      } else {
        header = [[hcell(name(cv)), hcell('Count'), hcell('Percent')]];
        tableRows = cats.map((c, ci_) => [hcell(c.label), cell(counts[0][ci_], 'int'), cell(total ? (counts[0][ci_] / total) * 100 : 0, 'pct')]);
        tableRows.push([hcell('Total', { bold: true }), cell(total, 'int'), cell(100, 'pct')]);
      }
      if (!kv) {
        const order = cats.map((c, i) => ({ c, n: counts[0][i] })).sort((a, b) => b.n - a.n);
        const p0 = total ? (order[0].n / total) * 100 : 0;
        interp = order.length >= 2
          ? `The most common category of ${prose(cv)} is ${order[0].c.label} (${fmt(p0)}% of cases), followed by ${order[1].c.label} (${fmt(total ? (order[1].n / total) * 100 : 0)}%).`
          : `All cases fall in ${order[0].c.label}.`;
      } else {
        // Largest gap between groups within a category, on the within-cluster percentages.
        // Small groups give unstable percentages: compare only groups with enough cases when possible.
        let eligible = groups.map((_, g) => g).filter((g) => grpTotals[g] >= Math.max(30, total * 0.05));
        if (eligible.length < 2) eligible = groups.map((_, g) => g);
        let best = { c: 0, d: -1, hi: eligible[0], lo: eligible[0] };
        cats.forEach((_, c) => {
          let hi = eligible[0];
          let lo = eligible[0];
          const pct = (g: number) => (grpTotals[g] ? (counts[g][c] / grpTotals[g]) * 100 : 0);
          for (const g of eligible) {
            if (pct(g) > pct(hi)) hi = g;
            if (pct(g) < pct(lo)) lo = g;
          }
          if (pct(hi) - pct(lo) > best.d) best = { c, d: pct(hi) - pct(lo), hi, lo };
        });
        const ph = grpTotals[best.hi] ? (counts[best.hi][best.c] / grpTotals[best.hi]) * 100 : 0;
        const pl = grpTotals[best.lo] ? (counts[best.lo][best.c] / grpTotals[best.lo]) * 100 : 0;
        interp = `The biggest difference between groups of ${prose(kv)} is in "${cats[best.c].label}": ${fmt(ph)}% of the "${groups[best.hi].label}" group compared with ${fmt(pl)}% of the "${groups[best.lo].label}" group. Run Crosstabs with a chi-square test to check whether the difference is statistically significant.`;
      }
      syntax = `GRAPH\n  /BAR(${kind})=${pct ? 'PCT' : 'COUNT'} BY ${byClause}.`;
    }
    blocks.push({ kind: 'chart', chart });
    blocks.push({ kind: 'text', style: 'interpretation', text: interp });
    blocks.push({ kind: 'table', table: { title: stat === 'mean' ? 'Means shown in the chart' : 'Values shown in the chart', header, rows: tableRows, stubColumns: stat === 'mean' && kv ? 2 : 1, ruleBefore: stat === 'mean' ? undefined : [tableRows.length - 1] } });
    if (stat === 'mean') {
      const small = counts.flat().filter((n) => n > 0 && n < 10).length;
      if (small) blocks.push({ kind: 'text', style: 'warning', text: `${small} bar${small === 1 ? ' is' : 's are'} based on fewer than 10 cases, so ${small === 1 ? 'its mean is' : 'their means are'} imprecise.` });
    }
    return item(ds, 'graph-bar', `Bar chart: ${chart.title}`, syntax, sel, blocks);
  },
};

// ---------- Histogram ----------

function skewWords(s: number): string {
  if (!Number.isFinite(s)) return '';
  const a = Math.abs(s);
  if (a < 0.5) return 'roughly symmetric';
  const dir = s > 0 ? 'right-skewed, with a long tail of high values' : 'left-skewed, with a long tail of low values';
  return a < 1 ? `moderately ${dir}` : `strongly ${dir}`;
}

const histogram: ProcedureDef = {
  id: 'graph-histogram',
  menu: 'Graphs',
  title: 'Histogram',
  description: 'See the shape of a scale variable: where values cluster, how spread out they are, and whether the distribution is skewed.',
  guidance:
    'Use a histogram for scale variables such as age, income or hours worked. The normal curve helps you judge whether the variable is roughly normal, which matters for t-tests, ANOVA and regression with small samples. ' +
    'Strong skew (for example income) often calls for a median instead of a mean, a log transformation, or a nonparametric test.',
  slots: [{ key: 'variable', label: 'Variable', min: 1, max: 1, types: ['numeric'], measures: ['scale'] }],
  options: [
    { key: 'normal', label: 'Show normal curve', type: 'checkbox', default: true, group: 'Chart' },
    { key: 'bins', label: 'Number of bars (0 = automatic)', type: 'number', default: 0, min: 0, max: 100, step: 1, group: 'Chart' },
  ],
  run: (ds, vars, opts) => {
    const v = requireVariable(ds, vars.variable[0]);
    const sel = selectCases(ds, [v.id]);
    need(sel);
    const xs = numericValues(ds, v, sel.rows);
    const ws = Array.from(sel.weights);
    const m = wMoments(xs, ws);
    let lo = Infinity, hi = -Infinity;
    for (const x of xs) { if (x < lo) lo = x; if (x > hi) hi = x; }
    const sorted = xs.map((x, i) => ({ x, w: ws[i] })).sort((a, b) => a.x - b.x);
    const med = wPercentile(sorted, 0.5);
    const q1 = wPercentile(sorted, 0.25);
    const q3 = wPercentile(sorted, 0.75);
    const edges = histogramEdges(lo, hi, m.n, Number(opts.bins) || 0, q3 - q1);
    const counts = binCounts(xs, ws, edges);
    const chart: ChartSpec = {
      type: 'histogram',
      title: name(v),
      xLabel: name(v),
      yLabel: ds.weightVarId ? 'Frequency (weighted)' : 'Frequency',
      edges,
      counts,
      normal: opts.normal !== false && m.sd > 0 ? { mean: m.mean, sd: m.sd, n: m.n } : undefined,
    };
    const table = {
      title: 'Statistics',
      header: [[hcell(''), hcell(name(v))]],
      rows: [
        [hcell('N'), cell(m.n, 'int')],
        [hcell('Mean'), cell(m.mean, 'dec2')],
        [hcell('Median'), cell(med, 'dec2')],
        [hcell('Std. Deviation'), cell(m.sd, 'dec2')],
        [hcell('Skewness'), cell(m.skew, 'dec3')],
        [hcell('Minimum'), cell(lo, 'dec2')],
        [hcell('Maximum'), cell(hi, 'dec2')],
      ],
    };
    const shape = skewWords(m.skew);
    const interp = `${prose(v)} ranges from ${fmtVal(lo)} to ${fmtVal(hi)}; the middle half of cases lies between ${fmtVal(q1)} and ${fmtVal(q3)}.` +
      (shape ? ` The distribution is ${shape}${Number.isFinite(m.skew) ? ` (skewness = ${fmt(m.skew, 2)})` : ''}.` : '') +
      (Number.isFinite(m.skew) && Math.abs(m.skew) >= 1 ? ' Report the median rather than the mean, or consider a transformation.' : '');
    const blocks: OutputBlock[] = [
      { kind: 'chart', chart },
      { kind: 'text', style: 'interpretation', text: interp },
      { kind: 'table', table },
    ];
    return item(ds, 'graph-histogram', `Histogram: ${name(v)}`, `GRAPH\n  /HISTOGRAM${chart.normal ? '(NORMAL)' : ''}=${v.name}.`, sel, blocks);
  },
};

// ---------- Box plot ----------

const boxPlot: ProcedureDef = {
  id: 'graph-box',
  menu: 'Graphs',
  title: 'Box Plot',
  description: 'Compare medians and spread of scale variables, overall or across groups, and spot outliers.',
  guidance:
    'The box covers the middle half of the cases (from the 25th to the 75th percentile), the line inside is the median, and the whiskers reach the most extreme values that are not outliers. ' +
    'Circles are outliers (more than 1.5 box-lengths from the box) and stars are extreme values (more than 3 box-lengths). Point at them to see case numbers, then check those cases in Data View.',
  slots: [
    { key: 'variables', label: 'Variables', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
    { key: 'group', label: 'Group by (optional)', min: 0, max: 1, measures: CAT_MEASURES },
  ],
  options: [
    { key: 'showMean', label: 'Mark the mean (+)', type: 'checkbox', default: true, group: 'Chart' },
    { key: 'missing', label: 'Missing values', type: 'select', default: 'listwise', group: 'Options', choices: [
      { value: 'listwise', label: 'Exclude cases listwise (same cases for every variable)' },
      { value: 'pairwise', label: 'Exclude cases variable by variable' },
    ] },
  ],
  run: (ds, vars, opts) => {
    const vs = vars.variables.map((id) => requireVariable(ds, id));
    const gv = vars.group?.[0] ? requireVariable(ds, vars.group[0]) : null;
    const listwise = opts.missing !== 'pairwise';
    const allSel = selectCases(ds, [...vs.map((v) => v.id), ...(gv ? [gv.id] : [])]);
    if (listwise) need(allSel);
    const blocks: OutputBlock[] = [];
    const summaryRows: Cell[][] = [];
    const interps: string[] = [];
    const showMean = opts.showMean !== false;
    const mkGroup = (label: string, xs: number[], ws: number[], rows: number[]) => {
      const b = boxStats(xs, ws, rows);
      return { name: label, min: b.min, q1: b.q1, median: b.median, q3: b.q3, max: b.max, mean: showMean ? b.mean : undefined, outliers: b.outliers, n: b.n };
    };
    let usedSel = allSel;
    if (gv) {
      for (const v of vs) {
        const sel = listwise ? allSel : selectCases(ds, [v.id, gv.id]);
        need(sel, v.name);
        usedSel = sel;
        const cats = categoriesOf(ds, gv, sel.rows);
        if (cats.length > 30) throw new Error(`${gv.name} has ${cats.length} categories; box plots can compare up to 30 groups.`);
        const col = ds.columns[v.id] as Float64Array;
        const groups = cats.map((c) => {
          const xs: number[] = [], ws: number[] = [], rows: number[] = [];
          sel.rows.forEach((r, k) => {
            if (keyOf(valueAt(ds, gv, r)) === keyOf(c.value)) {
              xs.push(col[r]);
              ws.push(sel.weights[k]);
              rows.push(r);
            }
          });
          return mkGroup(c.label, xs, ws, rows);
        });
        blocks.push({ kind: 'chart', chart: { type: 'box', title: `${name(v)} by ${name(gv)}`, xLabel: name(gv), yLabel: name(v), groups } });
        groups.forEach((g, i) => summaryRows.push([...(vs.length > 1 && i === 0 ? [hcell(name(v), { rowSpan: groups.length })] : []), hcell(g.name), ...summaryCells(g)]));
        const sorted = [...groups].filter((g) => Number.isFinite(g.median)).sort((a, b) => b.median - a.median);
        if (sorted.length >= 2) {
          const hiMed = sorted[0].median;
          const loMed = sorted[sorted.length - 1].median;
          interps.push(
            hiMed === loMed
              ? `The median ${prose(v)} is the same (${fmtVal(hiMed)}) in every group of ${prose(gv)}; compare the heights of the boxes (the middle half of cases) to see differences in spread.`
              : `The median ${prose(v)} is highest for ${sorted[0].name} (${fmtVal(hiMed)}) and lowest for ${sorted[sorted.length - 1].name} (${fmtVal(loMed)}).`,
          );
        } else if (sorted.length === 1) {
          const g = sorted[0];
          interps.push(`Only one group of ${prose(gv)} (${g.name}) has cases, so there is nothing to compare: its median ${prose(v)} is ${fmtVal(g.median)}${allFinite(g.q1, g.q3) ? ` and the middle half of cases lies between ${fmtVal(g.q1)} and ${fmtVal(g.q3)}` : ''}.`);
        }
      }
    } else {
      const groups = vs.map((v) => {
        const sel = listwise ? allSel : selectCases(ds, [v.id]);
        need(sel, v.name);
        usedSel = sel;
        const col = ds.columns[v.id] as Float64Array;
        return mkGroup(name(v), sel.rows.map((r) => col[r]), Array.from(sel.weights), sel.rows);
      });
      blocks.push({ kind: 'chart', chart: { type: 'box', title: vs.length === 1 ? name(vs[0]) : 'Box plots', yLabel: vs.length === 1 ? name(vs[0]) : undefined, groups } });
      groups.forEach((g) => summaryRows.push([hcell(g.name), ...summaryCells(g)]));
      const g0 = groups[0];
      interps.push(vs.length === 1
        ? `The median ${prose(vs[0])} is ${fmtVal(g0.median)}; the middle half of cases lies between ${fmtVal(g0.q1)} and ${fmtVal(g0.q3)}.`
        : `The chart compares the medians and spread of ${vs.length} variables; compare them only if they are measured on the same scale.`);
    }
    const nOut = summaryRows.reduce((a, r) => a + (Number((r[r.length - 2] as Cell).v) || 0) + (Number((r[r.length - 1] as Cell).v) || 0), 0);
    if (nOut) interps.push(`${nOut} outlying value${nOut === 1 ? ' is' : 's are'} marked; point at a mark to see its case number.`);
    if (interps.length) blocks.push({ kind: 'text', style: 'interpretation', text: interps.join(' ') });
    blocks.push({
      kind: 'table',
      table: {
        title: gv && vs.length === 1 ? `Box plot summary: ${name(vs[0])}` : 'Box plot summary',
        header: [[...(gv ? [...(vs.length > 1 ? [hcell('Variable')] : []), hcell(name(gv))] : [hcell('Variable')]), hcell('N'), hcell('Median'), hcell('25th percentile'), hcell('75th percentile'), hcell('IQR'), hcell('Lower whisker'), hcell('Upper whisker'), hcell('Outliers'), hcell('Extremes')]],
        rows: summaryRows,
        stubColumns: gv && vs.length > 1 ? 2 : 1,
        footnotes: [vs.length && usedSel.weights.some((w) => w !== 1) ? 'Percentiles use the weighted average definition (SPSS HAVERAGE).' : "Percentiles are Tukey's hinges, as in SPSS box plots."],
      },
    });
    const syntax = `EXAMINE VARIABLES=${vs.map((v) => v.name).join(' ')}${gv ? ` BY ${gv.name}` : ''}\n  /PLOT=BOXPLOT\n  /STATISTICS=NONE\n  /MISSING=${listwise ? 'LISTWISE' : 'PAIRWISE'}\n  /NOTOTAL.`;
    return item(ds, 'graph-box', `Box plot: ${vs.map(name).join(', ')}${gv ? ` by ${name(gv)}` : ''}`, syntax, usedSel, blocks);
  },
};

function summaryCells(g: { n: number; median: number; q1: number; q3: number; min: number; max: number; outliers: Array<{ extreme: boolean }> }): Cell[] {
  const nExt = g.outliers.filter((o) => o.extreme).length;
  return [cell(g.n, 'int'), cell(g.median, 'dec2'), cell(g.q1, 'dec2'), cell(g.q3, 'dec2'), cell(g.q3 - g.q1, 'dec2'), cell(g.min, 'dec2'), cell(g.max, 'dec2'), cell(g.outliers.length - nExt, 'int'), cell(nExt, 'int')];
}

// ---------- Scatter plot ----------

function strength(r: number): string {
  const a = Math.abs(r);
  if (a < 0.1) return 'almost no';
  if (a < 0.3) return 'a weak';
  if (a < 0.5) return 'a moderate';
  return 'a strong';
}

const MAX_POINTS = 20000;

const scatter: ProcedureDef = {
  id: 'graph-scatter',
  menu: 'Graphs',
  title: 'Scatter Plot',
  description: 'Look at the relationship between two scale variables, optionally coloured by group, with a fitted line.',
  guidance:
    'Put the variable you think of as the outcome on the Y axis. Look for the direction (up or down), the strength (how tightly points follow a line), curves, and outliers. ' +
    'The fit line and r describe only the straight-line part of the relationship. A curve or a few extreme cases can make r misleading, which is why looking at the plot matters.',
  slots: [
    { key: 'x', label: 'X axis', min: 1, max: 1, types: ['numeric'], measures: ['scale', 'ordinal'] },
    { key: 'y', label: 'Y axis', min: 1, max: 1, types: ['numeric'], measures: ['scale', 'ordinal'] },
    { key: 'group', label: 'Colour by (optional)', min: 0, max: 1, measures: CAT_MEASURES, help: 'Up to 8 groups; more are combined into "Other".' },
  ],
  options: [{ key: 'fit', label: 'Show linear fit line with r and R²', type: 'checkbox', default: true, group: 'Chart' }],
  run: (ds, vars, opts) => {
    const xv = requireVariable(ds, vars.x[0]);
    const yv = requireVariable(ds, vars.y[0]);
    const gv = vars.group?.[0] ? requireVariable(ds, vars.group[0]) : null;
    const sel = selectCases(ds, [xv.id, yv.id, ...(gv ? [gv.id] : [])]);
    need(sel);
    if (sel.rows.length < 2) throw new Error('At least two cases are needed for a scatter plot.');
    const xc = ds.columns[xv.id] as Float64Array;
    const yc = ds.columns[yv.id] as Float64Array;
    let groupLabel: ((r: number) => string) | null = null;
    let groupOrder: string[] | undefined;
    const notes: string[] = [];
    if (gv) {
      const cats = categoriesOf(ds, gv, sel.rows);
      const counts = new Map<string, number>();
      sel.rows.forEach((r, k) => counts.set(keyOf(valueAt(ds, gv, r)), (counts.get(keyOf(valueAt(ds, gv, r))) ?? 0) + sel.weights[k]));
      const keep = new Set(cats.length > 8 ? [...cats].sort((a, b) => (counts.get(keyOf(b.value)) ?? 0) - (counts.get(keyOf(a.value)) ?? 0)).slice(0, 7).map((c) => keyOf(c.value)) : cats.map((c) => keyOf(c.value)));
      const labels = new Map(cats.map((c) => [keyOf(c.value), c.label]));
      groupOrder = [...cats.filter((c) => keep.has(keyOf(c.value))).map((c) => c.label), ...(cats.length > 8 ? ['Other'] : [])];
      if (cats.length > 8) notes.push(`${gv.name} has ${cats.length} categories; the 7 largest are coloured and the rest are shown as "Other".`);
      groupLabel = (r) => {
        const k = keyOf(valueAt(ds, gv, r));
        return keep.has(k) ? labels.get(k)! : 'Other';
      };
    }
    const n = sel.rows.length;
    const stride = n > MAX_POINTS ? Math.ceil(n / MAX_POINTS) : 1;
    if (stride > 1) notes.push(`The plot shows every ${stride}th case (${Math.ceil(n / stride).toLocaleString('en-US')} of ${n.toLocaleString('en-US')}) to stay responsive; the fit line and r use all cases.`);
    const points: Array<{ x: number; y: number; group?: string }> = [];
    for (let k = 0; k < n; k += stride) {
      const r = sel.rows[k];
      points.push(groupLabel ? { x: xc[r], y: yc[r], group: groupLabel(r) } : { x: xc[r], y: yc[r] });
    }
    const X = sel.rows.map((r) => xc[r]);
    const Y = sel.rows.map((r) => yc[r]);
    const fitRes = linearFit(X, Y, sel.weights);
    const showFit = opts.fit !== false && Number.isFinite(fitRes.b);
    const chart: ChartSpec = {
      type: 'scatter',
      title: `${name(yv)} by ${name(xv)}`,
      xLabel: name(xv),
      yLabel: name(yv),
      points,
      groups: groupOrder,
      fit: showFit ? { a: fitRes.a, b: fitRes.b, r2: fitRes.r2 } : undefined,
    };
    const blocks: OutputBlock[] = [{ kind: 'chart', chart }];
    // A significance test needs at least 3 (weighted) cases: df = N - 2 > 0.
    const df = fitRes.n - 2;
    const testable = df >= 1;
    const t = Number.isFinite(fitRes.r) && testable ? fitRes.r * Math.sqrt(df / Math.max(1e-300, 1 - fitRes.r * fitRes.r)) : NaN;
    const p = Number.isFinite(t) ? tTwoSidedP(t, df) : NaN;
    if (Number.isFinite(fitRes.r)) {
      const dir = fitRes.r > 0 ? 'higher' : 'lower';
      blocks.push({
        kind: 'text',
        style: 'interpretation',
        text: `There is ${strength(fitRes.r)} ${fitRes.r >= 0 ? 'positive' : 'negative'} linear relationship between ${prose(xv)} and ${prose(yv)} (r = ${dropZero(fmt(fitRes.r, 2))}).` +
          (Math.abs(fitRes.r) >= 0.1 ? ` Cases with higher ${prose(xv)} tend to have ${dir} ${prose(yv)}; ${prose(xv)} accounts for ${fmt(fitRes.r2 * 100)}% of the variation in ${prose(yv)}.` : ''),
      });
      if (Number.isFinite(p)) {
        const pText = formatP(p, 'apa');
        // The APA wording follows the significance test (a tiny but significant r is still "significantly correlated").
        const apaDir = !(p < 0.05) ? 'not significantly' : `${Math.abs(fitRes.r) < 0.1 ? 'very weakly ' : ''}${fitRes.r > 0 ? 'positively' : 'negatively'}`;
        blocks.push({ kind: 'text', style: 'apa', text: `${prose(xv)} and ${prose(yv)} were ${apaDir} correlated, r(${fmtN(Math.round(df))}) = ${numText(fitRes.r, 2, true)}, p ${/^[<>]/.test(pText) ? pText : '= ' + pText}.` });
      } else {
        blocks.push({ kind: 'text', style: 'note', text: `The correlation cannot be tested for significance: a test needs at least 3 cases (N = ${fmtN(fitRes.n)}).` });
      }
      blocks.push({
        kind: 'table',
        table: {
          title: 'Linear fit',
          header: [[hcell('N'), hcell('r'), hcell('R²'), hcell('Intercept'), hcell('Slope'), hcell('p')]],
          rows: [[cell(fitRes.n, 'int'), cell(fitRes.r, 'r'), cell(fitRes.r2, 'r'), cell(fitRes.a, 'coef'), cell(fitRes.b, 'coef'), cell(p, 'p')]],
          stubColumns: 0,
          footnotes: [`Fit line: ${yv.name} = ${fmt(fitRes.a, 3)} ${fitRes.b < 0 ? '-' : '+'} ${fmt(Math.abs(fitRes.b), 3)} × ${xv.name}.`],
        },
      });
    } else {
      blocks.push({
        kind: 'text',
        style: 'note',
        text: fitRes.n < 3
          ? 'Too few cases to fit a line or compute a correlation.'
          : `${prose(xv)} or ${prose(yv)} has the same value for every case plotted, so no fit line or correlation can be computed.`,
      });
    }
    for (const nt of notes) blocks.push({ kind: 'text', style: 'note', text: nt });
    const syntax = `GRAPH\n  /SCATTERPLOT(BIVAR)=${xv.name} WITH ${yv.name}${gv ? ` BY ${gv.name}` : ''}\n  /MISSING=LISTWISE.${showFit ? '\n* Fit line: add "Fit Line at Total" in the SPSS Chart Editor, or use CORRELATIONS for r.' : ''}`;
    return item(ds, 'graph-scatter', `Scatter plot: ${name(yv)} by ${name(xv)}`, syntax, sel, blocks);
  },
};

// ---------- Line chart ----------

const lineChart: ProcedureDef = {
  id: 'graph-line',
  menu: 'Graphs',
  title: 'Line Chart',
  description: 'Show how the mean (or count) of a variable changes across ordered categories such as age groups or survey years.',
  guidance:
    'Line charts suit ordered categories (years, age groups, education levels). For unordered categories such as region, use a bar chart instead. Add "Separate lines for" to compare groups, for example men and women.',
  slots: [
    { key: 'x', label: 'Category axis (ordered)', min: 1, max: 1, measures: ['ordinal', 'scale'] },
    { key: 'y', label: 'Variable (for means)', min: 0, max: 1, types: ['numeric'], measures: ['scale'], help: 'Leave empty to plot counts or percentages.' },
    { key: 'group', label: 'Separate lines for (optional)', min: 0, max: 1, measures: CAT_MEASURES, help: 'Up to 8 groups.' },
  ],
  options: [
    { key: 'stat', label: 'Lines show', type: 'select', default: 'mean', group: 'Chart', choices: [
      { value: 'mean', label: 'Mean of the variable' },
      { value: 'count', label: 'Number of cases' },
      { value: 'percent', label: 'Percent of cases (within each line)' },
    ] },
  ],
  validate: (ds, vars, opts) => {
    if (opts.stat === 'mean' && !vars.y?.length) return 'Choose a variable for means, or set "Lines show" to a count or percent.';
    return null;
  },
  run: (ds, vars, opts) => {
    const xv = requireVariable(ds, vars.x[0]);
    const yv = vars.y?.[0] ? requireVariable(ds, vars.y[0]) : null;
    const gv = vars.group?.[0] ? requireVariable(ds, vars.group[0]) : null;
    const stat = yv && opts.stat === 'mean' ? 'mean' : opts.stat === 'percent' ? 'percent' : opts.stat === 'mean' ? 'count' : String(opts.stat);
    const sel = selectCases(ds, [xv.id, ...(stat === 'mean' && yv ? [yv.id] : []), ...(gv ? [gv.id] : [])]);
    need(sel);
    const cats = categoriesOf(ds, xv, sel.rows);
    if (cats.length > 100) throw new Error(`${xv.name} has ${cats.length} distinct values; a line chart needs 100 or fewer categories. Recode into groups first.`);
    const groups = gv ? categoriesOf(ds, gv, sel.rows) : [{ value: '', label: '' }];
    if (groups.length > 8) throw new Error(`${gv!.name} has ${groups.length} categories; separate lines work for up to 8. Recode it into fewer groups.`);
    const ci = new Map(cats.map((c, i) => [keyOf(c.value), i]));
    const gi = new Map(groups.map((g, i) => [keyOf(g.value), i]));
    const W = groups.map(() => new Array(cats.length).fill(0));
    const S = groups.map(() => new Array(cats.length).fill(0));
    const ycol = yv ? (ds.columns[yv.id] as Float64Array) : null;
    sel.rows.forEach((r, k) => {
      const c = ci.get(keyOf(valueAt(ds, xv, r)))!;
      const g = gv ? gi.get(keyOf(valueAt(ds, gv, r)))! : 0;
      const w = sel.weights[k];
      W[g][c] += w;
      if (stat === 'mean' && ycol) S[g][c] += w * ycol[r];
    });
    const values = groups.map((_, g) => {
      const tot = W[g].reduce((a, b) => a + b, 0);
      return cats.map((__, c) => (stat === 'mean' ? (W[g][c] > 0 ? S[g][c] / W[g][c] : null) : stat === 'percent' ? (tot > 0 ? (W[g][c] / tot) * 100 : null) : W[g][c]));
    });
    const what = stat === 'mean' && yv ? `Mean ${name(yv)}` : stat === 'percent' ? 'Percent' : 'Count';
    const chart: ChartSpec = {
      type: 'line',
      title: `${what} by ${name(xv)}${gv ? ` and ${name(gv)}` : ''}`,
      xLabel: name(xv),
      yLabel: what,
      categories: cats.map((c) => c.label),
      series: groups.map((g, i) => ({ name: gv ? g.label : what, values: values[i] })),
    };
    const fmtCell = (v: number | null) => cell(v === null ? NaN : v, stat === 'mean' ? 'dec2' : stat === 'percent' ? 'pct' : 'int');
    const header: Cell[][] = [[hcell(name(xv)), ...groups.map((g) => hcell(gv ? g.label : what)), ...(gv ? [] : [hcell('N')])]];
    const rows: Cell[][] = cats.map((c, i) => [hcell(c.label), ...groups.map((_, g) => fmtCell(values[g][i])), ...(gv ? [] : [cell(W[0][i], 'int')])]);
    const describe = (vals: Array<number | null>, label: string) => {
      const pts = vals.map((v, i) => ({ v, i })).filter((p) => p.v !== null) as Array<{ v: number; i: number }>;
      if (pts.length < 2) return '';
      const first = pts[0];
      const last = pts[pts.length - 1];
      const d = stat === 'percent' ? 1 : stat === 'count' ? 0 : 2;
      const unit = stat === 'percent' ? '%' : '';
      const show = (p: { v: number; i: number }) => `${fmt(p.v, d)}${unit} (${cats[p.i].label})`;
      const change = last.v - first.v;
      // Only call the line rising/falling when it moves in one direction; otherwise name its peak and low.
      let up = false;
      let down = false;
      for (let k = 1; k < pts.length; k++) {
        if (pts[k].v > pts[k - 1].v + 1e-9) up = true;
        if (pts[k].v < pts[k - 1].v - 1e-9) down = true;
      }
      if (up && down) {
        const hi = pts.reduce((a, b) => (b.v > a.v ? b : a));
        const lo = pts.reduce((a, b) => (b.v < a.v ? b : a));
        const at = (p: { v: number; i: number }) => `${cats[p.i].label} (${fmt(p.v, d)}${unit})`;
        return `${label}is highest for ${at(hi)} and lowest for ${at(lo)}; it does not change steadily across the categories.`;
      }
      const word = Math.abs(change) < 1e-9 ? 'stays level' : change > 0 ? 'rises' : 'falls';
      return `${label}${word} from ${show(first)} to ${show(last)}.`;
    };
    const interp = gv
      ? groups.map((g, i) => describe(values[i], `For ${g.label}, the ${stat === 'mean' ? 'mean' : stat === 'percent' ? 'percentage' : 'count'} `)).filter(Boolean).join(' ')
      : describe(values[0], `${what} `);
    const blocks: OutputBlock[] = [
      { kind: 'chart', chart },
      ...(interp ? [{ kind: 'text' as const, style: 'interpretation' as const, text: interp }] : []),
      { kind: 'table', table: { title: 'Values shown in the chart', header, rows } },
    ];
    const fn = stat === 'mean' && yv ? `MEAN(${yv.name})` : stat === 'percent' ? 'PCT' : 'COUNT';
    const syntax = `GRAPH\n  /LINE(${gv ? 'MULTIPLE' : 'SIMPLE'})=${fn} BY ${xv.name}${gv ? ` BY ${gv.name}` : ''}.`;
    return item(ds, 'graph-line', `Line chart: ${chart.title}`, syntax, sel, blocks);
  },
};

// ---------- Pie chart ----------

const pieChart: ProcedureDef = {
  id: 'graph-pie',
  menu: 'Graphs',
  title: 'Pie Chart',
  description: 'Show the parts of a whole for a variable with a few categories.',
  guidance:
    'Pie charts work only for a handful of categories that add up to a meaningful whole. People compare bar lengths much more accurately than angles, so a bar chart of percentages is usually the better choice in a paper. ' +
    'More than 8 categories are combined: the 7 largest are shown and the rest become "Other".',
  slots: [{ key: 'category', label: 'Slices by', min: 1, max: 1, measures: CAT_MEASURES }],
  options: [],
  run: (ds, vars) => {
    const v = requireVariable(ds, vars.category[0]);
    const sel = selectCases(ds, [v.id]);
    need(sel);
    const cats = categoriesOf(ds, v, sel.rows);
    const idx = new Map(cats.map((c, i) => [keyOf(c.value), i]));
    const counts = new Array(cats.length).fill(0);
    sel.rows.forEach((r, k) => (counts[idx.get(keyOf(valueAt(ds, v, r)))!] += sel.weights[k]));
    let slices = cats.map((c, i) => ({ name: c.label, value: counts[i] }));
    const notes: OutputBlock[] = [];
    if (slices.length > 8) {
      const order = [...slices].sort((a, b) => b.value - a.value);
      const keep = new Set(order.slice(0, 7).map((s) => s.name));
      const other = order.slice(7).reduce((a, s) => a + s.value, 0);
      slices = slices.filter((s) => keep.has(s.name));
      slices.push({ name: 'Other', value: other });
      notes.push({ kind: 'text', style: 'note', text: `${v.name} has ${cats.length} categories; the ${cats.length - 7} smallest are combined into "Other". The table lists every category.` });
    }
    const total = counts.reduce((a, b) => a + b, 0);
    const order = cats.map((c, i) => ({ c, n: counts[i] })).sort((a, b) => b.n - a.n);
    const chart: ChartSpec = { type: 'pie', title: name(v), slices };
    const rows: Cell[][] = cats.map((c, i) => [hcell(c.label), cell(counts[i], 'int'), cell(total ? (counts[i] / total) * 100 : 0, 'pct')]);
    rows.push([hcell('Total', { bold: true }), cell(total, 'int'), cell(100, 'pct')]);
    const blocks: OutputBlock[] = [
      { kind: 'chart', chart },
      { kind: 'text', style: 'interpretation', text: `${order[0].c.label} is the largest part (${fmt(total ? (order[0].n / total) * 100 : 0)}% of cases)${order.length > 1 ? `, followed by ${order[1].c.label} (${fmt(total ? (order[1].n / total) * 100 : 0)}%)` : ''}.` },
      { kind: 'table', table: { title: 'Values shown in the chart', header: [[hcell(name(v)), hcell('Count'), hcell('Percent')]], rows, ruleBefore: [rows.length - 1] } },
      ...notes,
    ];
    return item(ds, 'graph-pie', `Pie chart: ${name(v)}`, `GRAPH\n  /PIE=COUNT BY ${v.name}.`, sel, blocks);
  },
};

// ---------- Population pyramid ----------

const pyramid: ProcedureDef = {
  id: 'graph-pyramid',
  menu: 'Graphs',
  title: 'Population Pyramid',
  description: 'Show the age structure of your sample by sex (or any two-category variable), in 5- or 10-year age groups.',
  guidance:
    'A population pyramid puts one group on each side of a shared age axis, youngest at the bottom. Compare its shape with census figures to see whether your sample over- or under-represents some age groups; that is a common reason to weight survey data.',
  slots: [
    { key: 'age', label: 'Age variable', min: 1, max: 1, types: ['numeric'], measures: ['scale', 'ordinal'] },
    { key: 'sex', label: 'Split by', min: 1, max: 1, measures: ['nominal', 'ordinal'], help: 'For example sex. Choose which two categories go on the left and right below.' },
  ],
  options: [
    { key: 'sides', label: 'Left and right side', type: 'groupPair', slot: 'sex', group: 'Chart', help: 'Cases in any other category are left out of the pyramid.' },
    { key: 'width', label: 'Age groups', type: 'select', default: '5', group: 'Chart', choices: [
      { value: '5', label: '5-year groups' },
      { value: '10', label: '10-year groups' },
    ] },
    { key: 'top', label: 'Open-ended top group from age (0 = none)', type: 'number', default: 85, min: 0, max: 150, step: 5, group: 'Chart' },
    { key: 'display', label: 'Bars show', type: 'select', default: 'count', group: 'Chart', choices: [
      { value: 'count', label: 'Number of cases' },
      { value: 'percent', label: 'Percent of all cases' },
    ] },
  ],
  run: (ds, vars, opts) => {
    const av = requireVariable(ds, vars.age[0]);
    const sv = requireVariable(ds, vars.sex[0]);
    const all = selectCases(ds, [av.id, sv.id]);
    need(all);
    const allCats = categoriesOf(ds, sv, all.rows);
    const pair = Array.isArray(opts.sides) && opts.sides.length === 2 && opts.sides.every((x) => x !== null && x !== '') ? (opts.sides as Array<number | string>) : null;
    let cats: Category[];
    if (pair) {
      cats = pair.map((p) => allCats.find((c) => keyOf(c.value) === keyOf(typeof p === 'string' && sv.type === 'numeric' ? Number(p) : p)) ?? { value: p, label: labelOf(sv, p) });
      if (keyOf(cats[0].value) === keyOf(cats[1].value)) throw new Error('Choose two different categories for the left and right side.');
    } else if (allCats.length === 2) cats = allCats;
    else
      throw new Error(`${sv.name} has ${allCats.length} categor${allCats.length === 1 ? 'y' : 'ies'} among the cases used (${allCats.map((c) => c.label).join(', ')}). Choose the two to compare under "Left and right side".`);
    const keep = new Set(cats.map((c) => keyOf(c.value)));
    const rowsKept: number[] = [];
    const wKept: number[] = [];
    all.rows.forEach((r, k) => {
      if (keep.has(keyOf(valueAt(ds, sv, r)))) {
        rowsKept.push(r);
        wKept.push(all.weights[k]);
      }
    });
    const sel: CaseSelection = { rows: rowsKept, weights: Float64Array.from(wKept), nFiltered: all.nFiltered, nMissing: all.nMissing };
    need(sel);
    const nOther = all.rows.length - rowsKept.length;
    const width = Number(opts.width) === 10 ? 10 : 5;
    const top = Math.max(0, Number(opts.top) || 0);
    const ages = numericValues(ds, av, sel.rows);
    let lo = Infinity, hi = -Infinity;
    for (const a of ages) { if (a < lo) lo = a; if (a > hi) hi = a; }
    if (lo < 0) throw new Error(`${av.name} has negative values; check that it holds ages.`);
    const start = Math.floor(lo / width) * width;
    const openTop = top > 0 && hi >= top ? Math.max(start + width, Math.floor(top / width) * width) : Infinity;
    const lastStart = Number.isFinite(openTop) ? openTop : Math.floor(hi / width) * width;
    // Count the bands before building them: an age column in the billions would otherwise allocate
    // billions of bands (out of memory) before the size check.
    if (Math.floor((lastStart - start) / width) + 1 > 40) throw new Error(`${av.name} spans too wide a range for age groups (${fmt(lo, 0)} to ${fmt(hi, 0)}).`);
    const bands: Array<{ from: number; label: string }> = [];
    for (let a = start; a <= lastStart; a += width) bands.push({ from: a, label: Number.isFinite(openTop) && a === openTop ? `${a}+` : `${a}–${a + width - 1}` });
    if (bands.length > 40) throw new Error(`${av.name} spans too wide a range for age groups (${fmt(lo, 0)} to ${fmt(hi, 0)}).`);
    const left = new Array(bands.length).fill(0);
    const right = new Array(bands.length).fill(0);
    const sideKey = keyOf(cats[0].value);
    sel.rows.forEach((r, k) => {
      const a = ages[k];
      let b = Math.floor((Math.min(a, lastStart) - start) / width);
      if (Number.isFinite(openTop) && a >= openTop) b = bands.length - 1;
      b = Math.max(0, Math.min(bands.length - 1, b));
      if (keyOf(valueAt(ds, sv, r)) === sideKey) left[b] += sel.weights[k];
      else right[b] += sel.weights[k];
    });
    const total = left.reduce((a, b) => a + b, 0) + right.reduce((a, b) => a + b, 0);
    const pct = opts.display === 'percent';
    const conv = (x: number) => (pct ? (total ? (x / total) * 100 : 0) : x);
    const chart: ChartSpec = {
      type: 'pyramid',
      title: `${name(av)} by ${name(sv)}`,
      xLabel: pct ? 'Percent of all cases' : 'Count',
      yLabel: 'Age group',
      groups: bands.map((b) => b.label),
      left: { name: cats[0].label, values: left.map(conv) },
      right: { name: cats[1].label, values: right.map(conv) },
      percent: pct,
    };
    const f = (x: number) => (pct ? cell(conv(x), 'pct') : cell(x, 'int'));
    const rows: Cell[][] = bands.map((b, i) => [hcell(b.label), f(left[i]), f(right[i]), f(left[i] + right[i])]).reverse();
    const lt = left.reduce((a, b) => a + b, 0);
    const rt = right.reduce((a, b) => a + b, 0);
    rows.push([hcell('Total', { bold: true }), f(lt), f(rt), f(total)]);
    let peak = 0;
    for (let i = 1; i < bands.length; i++) if (left[i] + right[i] > left[peak] + right[peak]) peak = i;
    const meanAge = (side: string) => {
      let s = 0, w = 0;
      sel.rows.forEach((r, k) => { if ((keyOf(valueAt(ds, sv, r)) === sideKey) === (side === 'L')) { s += ages[k] * sel.weights[k]; w += sel.weights[k]; } });
      return w ? s / w : NaN;
    };
    const interp = `The largest age group is ${bands[peak].label} (${fmt(total ? ((left[peak] + right[peak]) / total) * 100 : 0)}% of cases). ` +
      `${cats[0].label}: ${fmtN(Math.round(lt))} (${fmt(total ? (lt / total) * 100 : 0)}%, mean age ${fmt(meanAge('L'))}); ${cats[1].label}: ${fmtN(Math.round(rt))} (${fmt(total ? (rt / total) * 100 : 0)}%, mean age ${fmt(meanAge('R'))}).`;
    const recode = bands
      .map((b, i) => (Number.isFinite(openTop) && i === bands.length - 1 ? `(${b.from} thru HI=${i + 1})` : `(${b.from} thru ${b.from + width - 1}.999=${i + 1})`))
      .join(' ');
    const lit = (v: number | string) => (typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`);
    const select = nOther ? `TEMPORARY.\nSELECT IF (${sv.name} = ${lit(cats[0].value)} OR ${sv.name} = ${lit(cats[1].value)}).\n` : '';
    const syntax =
      select +
      `RECODE ${av.name} ${recode} INTO agegrp.\nVALUE LABELS agegrp ${bands.map((b, i) => `${i + 1} '${b.label}'`).join(' ')}.\nEXECUTE.\n` +
      `GGRAPH\n  /GRAPHDATASET NAME="graphdataset" VARIABLES=agegrp COUNT()[name="COUNT"] ${sv.name}\n  /GRAPHSPEC SOURCE=INLINE.\nBEGIN GPL\n` +
      `  SOURCE: s=userSource(id("graphdataset"))\n  DATA: agegrp=col(source(s), name("agegrp"), unit.category())\n  DATA: COUNT=col(source(s), name("COUNT"))\n  DATA: ${sv.name}=col(source(s), name("${sv.name}"), unit.category())\n` +
      `  COORD: transpose(mirror(rect(dim(1,2))))\n  GUIDE: axis(dim(1), label("Age group"))\n  GUIDE: axis(dim(2), label("Count"))\n  ELEMENT: interval(position(agegrp*COUNT*${sv.name}))\nEND GPL.`;
    const blocks: OutputBlock[] = [
      { kind: 'chart', chart },
      { kind: 'text', style: 'interpretation', text: interp },
      ...(nOther ? [{ kind: 'text' as const, style: 'note' as const, text: `${fmtN(nOther)} case${nOther === 1 ? '' : 's'} in other categories of ${sv.name} ${nOther === 1 ? 'is' : 'are'} not shown.` }] : []),
      { kind: 'table', table: { title: 'Age groups', header: [[hcell('Age group'), hcell(cats[0].label), hcell(cats[1].label), hcell('Total')]], rows, ruleBefore: [rows.length - 1] } },
    ];
    return item(ds, 'graph-pyramid', `Population pyramid: ${name(av)} by ${name(sv)}`, syntax, sel, blocks);
  },
};

export const graphProcedures: ProcedureDef[] = [barChart, histogram, boxPlot, scatter, lineChart, pieChart, pyramid];
