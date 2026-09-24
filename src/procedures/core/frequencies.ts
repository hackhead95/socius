// Analyze > Descriptive Statistics > Frequencies (SPSS FREQUENCIES).

import { activeCaseMask, caseWeights, isUserMissing } from '../../core/data';
import type { Dataset, Variable } from '../../core/types';
import type { ChartSpec, OutputBlock, OutputTable } from '../../core/output';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import { frequencyTable, type FreqTable } from '../../lib/stats/frequencies';
import { distinctWeighted, kurtosis, modes, moments, percentileHaverage, skewness } from '../../lib/stats/util';
import { histogram } from './chartUtil';
import {
  apaNum,
  blank,
  caseNote,
  cell,
  decFmt,
  fmtN,
  hcell,
  item,
  listProse,
  optBool,
  optStr,
  parseNumberList,
  pct,
  tableBlock,
  text,
  valueText,
  vars,
  vlabel,
  vprose,
  type Cell,
} from './common';

interface VarFreq {
  v: Variable;
  table: FreqTable;
  /** valid numeric values and weights (numeric variables only) */
  x?: Float64Array;
  w?: Float64Array;
}

function collect(ds: Dataset, v: Variable, order: string): VarFreq {
  const mask = activeCaseMask(ds);
  const wts = caseWeights(ds);
  const col = ds.columns[v.id];
  const entries: Array<{ value: number | string; weight: number; kind: 'valid' | 'user' | 'system' }> = [];
  const xs: number[] = [];
  const ws: number[] = [];
  for (let i = 0; i < ds.nCases; i++) {
    if (!mask[i] || !(wts[i] > 0)) continue;
    const x = col[i];
    let kind: 'valid' | 'user' | 'system' = 'valid';
    if (typeof x === 'number' && Number.isNaN(x)) kind = 'system';
    else if (isUserMissing(v.missing, x)) kind = 'user';
    entries.push({ value: x, weight: wts[i], kind });
    if (kind === 'valid' && typeof x === 'number') {
      xs.push(x);
      ws.push(wts[i]);
    }
  }
  const ord = order === 'descendingCounts' || order === 'ascendingCounts' || order === 'descending' ? order : 'ascending';
  const table = frequencyTable(entries, ord as 'ascending');
  return { v, table, x: v.type === 'numeric' ? Float64Array.from(xs) : undefined, w: v.type === 'numeric' ? Float64Array.from(ws) : undefined };
}

function freqTableOut(f: VarFreq): OutputTable {
  const { v, table } = f;
  const rows: Cell[][] = [];
  const ruleBefore: number[] = [];
  const nValid = table.valid.length;
  table.valid.forEach((r, i) => {
    rows.push([
      i === 0 ? hcell('Valid', { rowSpan: nValid + 1 }) : null,
      hcell(valueText(v, r.value)),
      cell(r.count, 'int'),
      cell(r.percent, 'dec1'),
      cell(r.validPercent, 'dec1'),
      cell(r.cumPercent, 'dec1'),
    ].filter((c): c is Cell => c !== null));
  });
  if (nValid) {
    ruleBefore.push(rows.length);
    rows.push([hcell('Total', { bold: true }), cell(table.validTotal, 'int', { bold: true }), cell((100 * table.validTotal) / table.total, 'dec1', { bold: true }), cell(100, 'dec1', { bold: true }), blank()]);
  } else {
    rows.push([hcell('Valid'), hcell('(none)'), cell(0, 'int'), cell(0, 'dec1'), blank(), blank()]);
  }
  if (table.missing.length) {
    const nm = table.missing.length;
    ruleBefore.push(rows.length);
    table.missing.forEach((m, i) => {
      rows.push([
        i === 0 ? hcell('Missing', { rowSpan: nm + (nm > 1 ? 1 : 0) }) : null,
        hcell(m.value === null ? 'System' : valueText(v, m.value)),
        cell(m.count, 'int'),
        cell(m.percent, 'dec1'),
        blank(),
        blank(),
      ].filter((c): c is Cell => c !== null));
    });
    if (nm > 1) rows.push([hcell('Total', { bold: true }), cell(table.missingTotal, 'int', { bold: true }), cell((100 * table.missingTotal) / table.total, 'dec1', { bold: true }), blank(), blank()]);
    ruleBefore.push(rows.length);
    rows.push([hcell('Total', { colSpan: 2, bold: true }), cell(table.total, 'int', { bold: true }), cell(100, 'dec1', { bold: true }), blank(), blank()]);
  }
  return {
    title: vlabel(v),
    header: [[hcell('', { colSpan: 2 }), hcell('Frequency'), hcell('Percent'), hcell('Valid Percent'), hcell('Cumulative Percent')]],
    rows,
    stubColumns: 2,
    ruleBefore,
  };
}

interface StatSpec {
  key: string;
  label: string;
}

const STAT_KEYS: StatSpec[] = [
  { key: 'mean', label: 'Mean' },
  { key: 'seMean', label: 'Std. Error of Mean' },
  { key: 'median', label: 'Median' },
  { key: 'mode', label: 'Mode' },
  { key: 'sd', label: 'Std. Deviation' },
  { key: 'variance', label: 'Variance' },
  { key: 'skewness', label: 'Skewness' },
  { key: 'kurtosis', label: 'Kurtosis' },
  { key: 'range', label: 'Range' },
  { key: 'min', label: 'Minimum' },
  { key: 'max', label: 'Maximum' },
  { key: 'sum', label: 'Sum' },
];

function statisticsTable(fs: VarFreq[], opts: OptionValues, pcts: number[]): { table: OutputTable; multiMode: boolean } | null {
  const want = (k: string) => optBool(opts, k);
  const anyStat = STAT_KEYS.some((s) => want(s.key)) || pcts.length > 0;
  const rows: Cell[][] = [];
  const multiModeVars = new Set<number>();
  // N rows
  rows.push([hcell('N', { rowSpan: 2 }), hcell('Valid'), ...fs.map((f) => cell(f.table.validTotal, 'int'))]);
  rows.push([hcell('Missing'), ...fs.map((f) => cell(f.table.missingTotal, 'int'))]);
  if (!anyStat) return { table: { title: 'Statistics', header: [[hcell('', { colSpan: 2 }), ...fs.map((f) => hcell(f.v.name))]], rows, stubColumns: 2 }, multiMode: false };
  const computed = fs.map((f) => {
    if (!f.x || f.x.length === 0) return null;
    const m = moments(f.x, f.w);
    const d = distinctWeighted(f.x, f.w);
    return { m, d, sk: skewness(m), ku: kurtosis(m), modes: modes(d) };
  });
  const val = (i: number, fn: (c: NonNullable<(typeof computed)[number]>) => number, fmt = decFmt(fs[i].v)): Cell => {
    const c = computed[i];
    return c ? cell(fn(c), fmt) : cell(NaN);
  };
  const add = (label: string, fn: (i: number) => Cell) => rows.push([hcell(label, { colSpan: 2 }), ...fs.map((_, i) => fn(i))]);
  const addSE = (label: string, fn: (i: number) => Cell) => rows.push([hcell(label, { colSpan: 2 }), ...fs.map((_, i) => fn(i))]);
  if (want('mean')) add('Mean', (i) => val(i, (c) => c.m.mean));
  if (want('seMean')) addSE('Std. Error of Mean', (i) => val(i, (c) => c.m.sd / Math.sqrt(c.m.W)));
  if (want('median')) add('Median', (i) => val(i, (c) => percentileHaverage(c.d, 0.5)));
  if (want('mode'))
    add('Mode', (i) => {
      const c = computed[i];
      if (!c) {
        // string variables: mode of the valid categories
        const t = fs[i].table.valid;
        if (!t.length) return cell(NaN);
        const best = Math.max(...t.map((r) => r.count));
        const ms = t.filter((r) => r.count === best);
        if (ms.length > 1) multiModeVars.add(i);
        return cell(String(ms[0].value), 'text', ms.length > 1 ? { mark: 'a' } : {});
      }
      if (c.modes.length > 1) multiModeVars.add(i);
      return cell(c.modes[0], decFmt(fs[i].v, 0), c.modes.length > 1 ? { mark: 'a' } : {});
    });
  if (want('sd')) add('Std. Deviation', (i) => val(i, (c) => c.m.sd));
  if (want('variance')) add('Variance', (i) => val(i, (c) => c.m.variance));
  if (want('skewness')) {
    add('Skewness', (i) => val(i, (c) => c.sk.value, 'dec3'));
    addSE('Std. Error of Skewness', (i) => val(i, (c) => c.sk.se, 'dec3'));
  }
  if (want('kurtosis')) {
    add('Kurtosis', (i) => val(i, (c) => c.ku.value, 'dec3'));
    addSE('Std. Error of Kurtosis', (i) => val(i, (c) => c.ku.se, 'dec3'));
  }
  if (want('range')) add('Range', (i) => val(i, (c) => c.m.max - c.m.min));
  if (want('min')) add('Minimum', (i) => val(i, (c) => c.m.min));
  if (want('max')) add('Maximum', (i) => val(i, (c) => c.m.max));
  if (want('sum')) add('Sum', (i) => val(i, (c) => c.m.sum));
  if (pcts.length) {
    pcts.forEach((p, k) => {
      const r = [hcell(fmtN(p)), ...fs.map((_, i) => val(i, (c) => percentileHaverage(c.d, p / 100)))];
      if (k === 0) r.unshift(hcell('Percentiles', { rowSpan: pcts.length }));
      rows.push(r);
    });
  }
  const footnotes = multiModeVars.size ? ['a. Multiple modes exist. The smallest value is shown.'] : undefined;
  return {
    table: { title: 'Statistics', header: [[hcell('', { colSpan: 2 }), ...fs.map((f) => hcell(f.v.name))]], rows, stubColumns: 2, footnotes },
    multiMode: multiModeVars.size > 0,
  };
}

function chartFor(f: VarFreq, kind: string, normal: boolean, usePct: boolean): ChartSpec | null {
  const { v, table } = f;
  if (kind === 'bar' || kind === 'pie') {
    if (!table.valid.length) return null;
    const cats = table.valid.map((r) => valueText(v, r.value));
    if (kind === 'pie') return { type: 'pie', title: vlabel(v), slices: table.valid.map((r, i) => ({ name: cats[i], value: r.count })) };
    return {
      type: 'bar',
      title: vlabel(v),
      xLabel: vlabel(v),
      yLabel: usePct ? 'Percent' : 'Frequency',
      categories: cats,
      series: [{ name: usePct ? 'Percent' : 'Frequency', values: table.valid.map((r) => (usePct ? r.validPercent : r.count)) }],
      percent: usePct,
    };
  }
  if (kind === 'histogram') {
    if (!f.x || f.x.length === 0) return null;
    const h = histogram(f.x, f.w);
    const m = moments(f.x, f.w);
    return { type: 'histogram', title: vlabel(v), xLabel: vlabel(v), yLabel: 'Frequency', edges: h.edges, counts: h.counts, normal: normal && m.sd > 0 ? { mean: m.mean, sd: m.sd, n: m.W } : undefined };
  }
  return null;
}

function interpret(f: VarFreq): string {
  const { v, table } = f;
  const name = vprose(v);
  if (!table.validTotal) return `${name} has no valid responses in the selected cases.`;
  const missingPart = table.missingTotal > 0 ? ` ${fmtN(Math.round(table.missingTotal * 10) / 10)} case${table.missingTotal === 1 ? '' : 's'} (${pct((100 * table.missingTotal) / table.total)}) had no valid answer and are excluded from the valid percentages.` : '';
  const categorical = v.measure !== 'scale' || v.type === 'string' || table.valid.length <= 7;
  if (categorical) {
    const sorted = [...table.valid].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const tied = sorted.filter((r) => r.count === top.count);
    let s: string;
    if (tied.length > 1) {
      s = `For ${name}, the most common answers were ${listProse(tied.map((r) => `"${valueText(v, r.value)}"`))} (${pct(top.validPercent)} each of the ${fmtN(table.validTotal)} valid responses).`;
    } else {
      s = `For ${name}, the most common answer was "${valueText(v, top.value)}" (${pct(top.validPercent)} of ${fmtN(table.validTotal)} valid responses)`;
      if (sorted.length > 1) s += `, followed by "${valueText(v, sorted[1].value)}" (${pct(sorted[1].validPercent)})`;
      s += '.';
    }
    if (sorted.length > 2) {
      const least = sorted[sorted.length - 1];
      const leastTied = sorted.filter((r) => r.count === least.count);
      if (leastTied.length === 1 && least.count < sorted[1].count) s += ` The least common was "${valueText(v, least.value)}" (${pct(least.validPercent)}).`;
    }
    return s + missingPart;
  }
  const m = moments(f.x!, f.w);
  const d = distinctWeighted(f.x!, f.w);
  const med = percentileHaverage(d, 0.5);
  const sk = skewness(m).value;
  let shape = '';
  if (Number.isFinite(sk)) {
    if (sk > 1) shape = ' The distribution is clearly skewed to the right (a long tail of high values), so the median describes a typical case better than the mean.';
    else if (sk < -1) shape = ' The distribution is clearly skewed to the left (a long tail of low values), so the median describes a typical case better than the mean.';
    else if (Math.abs(sk) > 0.5) shape = ` The distribution is moderately skewed (skewness = ${apaNum(sk)}).`;
    else shape = ' The distribution is roughly symmetric.';
  }
  return `${name} ranged from ${apaNum(m.min)} to ${apaNum(m.max)}, with a mean of ${apaNum(m.mean)} (SD = ${apaNum(m.sd)}) and a median of ${apaNum(med)} (N = ${fmtN(m.W)}).${shape}${missingPart}`;
}

function apaFor(f: VarFreq): string | null {
  const { v, table } = f;
  if (!table.validTotal) return null;
  const categorical = v.measure !== 'scale' || v.type === 'string' || table.valid.length <= 7;
  if (categorical) {
    const parts = table.valid.map((r) => `${valueText(v, r.value)}: ${r.validPercent.toFixed(1)}% (n = ${fmtN(Math.round(r.count))})`);
    return `Responses to ${vprose(v)} (N = ${fmtN(Math.round(table.validTotal))}) were distributed as follows: ${parts.join('; ')}.`;
  }
  const m = moments(f.x!, f.w);
  return `${vprose(v)} had a mean of ${apaNum(m.mean)} (SD = ${apaNum(m.sd)}, range ${apaNum(m.min)} to ${apaNum(m.max)}, N = ${fmtN(Math.round(m.W))}).`;
}

function run(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (!vs.length) throw new Error('Choose at least one variable.');
  const order = optStr(opts, 'order', 'ascending');
  const fs = vs.map((v) => collect(ds, v, order));
  const pctText = optStr(opts, 'percentiles', '').trim();
  const pcts = pctText ? parseNumberList(pctText, 'Percentiles', 0, 100) : [];
  if (optBool(opts, 'quartiles')) for (const q of [25, 50, 75]) if (!pcts.includes(q)) pcts.push(q);
  pcts.sort((a, b) => a - b);
  const blocks: OutputBlock[] = [];
  const st = statisticsTable(fs, opts, pcts);
  if (st) blocks.push(tableBlock(st.table));
  const nonNumericStats = fs.filter((f) => !f.x) .map((f) => f.v.name);
  if (nonNumericStats.length && STAT_KEYS.some((s) => s.key !== 'mode' && optBool(opts, s.key)))
    blocks.push(text('note', `Numeric statistics are not computed for string variables (${nonNumericStats.join(', ')}).`));
  const showTables = optBool(opts, 'showTables', true);
  const chartKind = optStr(opts, 'chart', 'none');
  const normal = optBool(opts, 'normalCurve', true);
  const usePct = optStr(opts, 'chartValues', 'frequencies') === 'percentages';
  for (const f of fs) {
    if (showTables) {
      if (f.table.valid.length > 200) blocks.push(text('note', `${f.v.name} has ${f.table.valid.length} distinct values; the frequency table lists all of them. A histogram or Descriptives may be more useful for a continuous variable.`));
      blocks.push(tableBlock(freqTableOut(f)));
    }
    if (chartKind !== 'none') {
      const ch = chartFor(f, chartKind, normal, usePct);
      if (ch) blocks.push({ kind: 'chart', chart: ch });
      else if (chartKind === 'histogram' && !f.x) blocks.push(text('note', `A histogram needs a numeric variable; ${f.v.name} is a string variable.`));
    }
    blocks.push(text('interpretation', interpret(f)));
    const apa = apaFor(f);
    if (apa) blocks.push(text('apa', apa));
  }
  const total = fs[0].table.total;
  const statKeys = STAT_KEYS.filter((s) => optBool(opts, s.key)).map((s) => ({ mean: 'MEAN', seMean: 'SEMEAN', median: 'MEDIAN', mode: 'MODE', sd: 'STDDEV', variance: 'VARIANCE', skewness: 'SKEWNESS SESKEW', kurtosis: 'KURTOSIS SEKURT', range: 'RANGE', min: 'MINIMUM', max: 'MAXIMUM', sum: 'SUM' })[s.key as 'mean']);
  let syntax = `FREQUENCIES VARIABLES=${vs.map((v) => v.name).join(' ')}`;
  if (!showTables) syntax += '\n  /FORMAT=NOTABLE';
  else if (order !== 'ascending') syntax += `\n  /FORMAT=${{ descending: 'DVALUE', descendingCounts: 'DFREQ', ascendingCounts: 'AFREQ' }[order] ?? 'AVALUE'}`;
  if (optBool(opts, 'quartiles')) syntax += '\n  /NTILES=4';
  const custom = pcts.filter((p) => !(optBool(opts, 'quartiles') && [25, 50, 75].includes(p)));
  if (custom.length) syntax += `\n  /PERCENTILES=${custom.join(' ')}`;
  if (statKeys.length) syntax += `\n  /STATISTICS=${statKeys.join(' ')}`;
  if (chartKind === 'bar') syntax += `\n  /BARCHART ${usePct ? 'PERCENT' : 'FREQ'}`;
  if (chartKind === 'pie') syntax += `\n  /PIECHART ${usePct ? 'PERCENT' : 'FREQ'}`;
  if (chartKind === 'histogram') syntax += `\n  /HISTOGRAM${normal ? ' NORMAL' : ''}`;
  syntax += '\n  /ORDER=ANALYSIS.';
  const missingAny = fs.some((f) => f.table.missingTotal > 0);
  return item(
    'frequencies',
    'Frequencies',
    ds,
    blocks,
    syntax,
    caseNote(ds, total, 0, missingAny ? 'missing values are listed in each table and excluded from valid percentages' : undefined),
  );
}

export const frequencies: ProcedureDef = {
  id: 'frequencies',
  menu: 'Descriptive Statistics',
  title: 'Frequencies',
  description: 'Count how often each answer occurs, with percentages, summary statistics and charts.',
  guidance:
    'Use for categorical survey items (how many respondents chose each option) and for a first look at any variable. Missing values are listed separately and excluded from the valid percentages, as in SPSS.',
  slots: [{ key: 'variables', label: 'Variable(s)', min: 1, max: Infinity }],
  options: [
    { key: 'showTables', label: 'Display frequency tables', type: 'checkbox', default: true, group: 'Tables' },
    {
      key: 'order',
      label: 'Order categories by',
      type: 'select',
      default: 'ascending',
      choices: [
        { value: 'ascending', label: 'Ascending values' },
        { value: 'descending', label: 'Descending values' },
        { value: 'descendingCounts', label: 'Descending counts' },
        { value: 'ascendingCounts', label: 'Ascending counts' },
      ],
      group: 'Tables',
    },
    { key: 'mean', label: 'Mean', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'median', label: 'Median', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'mode', label: 'Mode', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'sum', label: 'Sum', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'sd', label: 'Std. deviation', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'variance', label: 'Variance', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'range', label: 'Range', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'min', label: 'Minimum', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'max', label: 'Maximum', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'seMean', label: 'S.E. mean', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'skewness', label: 'Skewness', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'kurtosis', label: 'Kurtosis', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'quartiles', label: 'Quartiles', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'percentiles', label: 'Percentiles', type: 'text', default: '', placeholder: 'e.g. 10, 90', group: 'Statistics', help: 'Values between 0 and 100, separated by commas.' },
    {
      key: 'chart',
      label: 'Chart',
      type: 'select',
      default: 'none',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'bar', label: 'Bar chart' },
        { value: 'pie', label: 'Pie chart' },
        { value: 'histogram', label: 'Histogram' },
      ],
      group: 'Charts',
    },
    { key: 'normalCurve', label: 'Show normal curve on histogram', type: 'checkbox', default: true, group: 'Charts' },
    {
      key: 'chartValues',
      label: 'Chart values',
      type: 'select',
      default: 'frequencies',
      choices: [
        { value: 'frequencies', label: 'Frequencies' },
        { value: 'percentages', label: 'Percentages' },
      ],
      group: 'Charts',
    },
  ],
  validate: (_ds, _slots, opts) => {
    const t = typeof opts.percentiles === 'string' ? opts.percentiles.trim() : '';
    if (!t) return null;
    try {
      parseNumberList(t, 'Percentiles', 0, 100);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  },
  run,
};
