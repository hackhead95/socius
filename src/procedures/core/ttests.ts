// Analyze > Compare Means: One-Sample, Independent-Samples and Paired-Samples T Test (SPSS T-TEST).

import { selectCases } from '../../core/data';
import type { Dataset } from '../../core/types';
import type { ChartSpec, OutputBlock } from '../../core/output';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import { independentT, oneSampleT, pairedT, type EffectSize } from '../../lib/stats/ttest';
import {
  apaNum,
  apaP,
  blank,
  caseNote,
  cell,
  COHEN_NOTE,
  decFmt,
  fmtDf,
  fmtN,
  hcell,
  item,
  labelD,
  labelR,
  numericValues,
  one,
  optBool,
  optNum,
  optStr,
  pcell,
  requireNumeric,
  selN,
  tableBlock,
  text,
  twoGroups,
  vars,
  vlabel,
  vprose,
  type Cell,
} from './common';

function confOpt(opts: OptionValues): number {
  const c = optNum(opts, 'ciLevel', 95) / 100;
  if (!(c > 0.5 && c < 1)) throw new Error('The confidence level must be between 50 and 99.9 percent.');
  return c;
}

function effectRows(label: string, effects: EffectSize[], first: boolean, span: number): Cell[][] {
  return effects.map((e, i) => [
    ...(first && i === 0 ? [hcell(label, { rowSpan: span })] : []),
    hcell(e.name),
    cell(e.standardizer, 'dec3'),
    cell(e.value, 'dec3'),
  ]);
}

const EFFECT_FOOT = [
  "The denominator used in estimating the effect sizes. Cohen's d uses the sample standard deviation. Hedges' correction multiplies d by the small-sample factor J(df) = Γ(df/2) / (√(df/2) Γ((df-1)/2)).",
];

// ---------------------------------------------------------------------------------------------
// One-sample
// ---------------------------------------------------------------------------------------------

function runOneSample(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (!vs.length) throw new Error('Choose at least one test variable.');
  vs.forEach((v) => requireNumeric(v, 'Test variables'));
  const tv = optNum(opts, 'testValue', 0);
  const conf = confOpt(opts);
  const listwise = optStr(opts, 'missing', 'analysis') === 'listwise';
  const selAll = selectCases(ds, vs.map((v) => v.id));
  const results = vs.map((v) => {
    const sel = listwise ? selAll : selectCases(ds, [v.id]);
    const x = numericValues(ds, v, sel.rows);
    if (selN(sel) < 2) throw new Error(`${v.name}: at least two valid cases are needed for a t test.`);
    const r = oneSampleT(x, sel.weights, tv, conf);
    if (!(r.stats.sd > 0)) throw new Error(`${v.name} has the same value for every case, so the t test cannot be computed.`);
    return { v, sel, r };
  });
  const blocks: OutputBlock[] = [];
  blocks.push(
    tableBlock({
      title: 'One-Sample Statistics',
      header: [[hcell(''), hcell('N'), hcell('Mean'), hcell('Std. Deviation'), hcell('Std. Error Mean')]],
      rows: results.map(({ v, r }) => [hcell(vlabel(v)), cell(r.stats.N, 'int'), cell(r.stats.mean, decFmt(v)), cell(r.stats.sd, decFmt(v)), cell(r.stats.se, decFmt(v, 3))]),
    }),
  );
  const pc = Math.round(conf * 1000) / 10;
  blocks.push(
    tableBlock({
      title: 'One-Sample Test',
      subtitle: `Test Value = ${tv}`,
      header: [
        [hcell('', { rowSpan: 3 }), hcell(`Test Value = ${tv}`, { colSpan: 7 })],
        [hcell('t', { rowSpan: 2 }), hcell('df', { rowSpan: 2 }), hcell('Significance', { colSpan: 2 }), hcell('Mean Difference', { rowSpan: 2 }), hcell(`${pc}% Confidence Interval of the Difference`, { colSpan: 2 })],
        [hcell('One-Sided p'), hcell('Two-Sided p'), hcell('Lower'), hcell('Upper')],
      ],
      rows: results.map(({ v, r }) => [hcell(vlabel(v)), cell(r.test.t, 'dec3'), cell(r.test.df, Number.isInteger(r.test.df) ? 'int' : 'dec2'), pcell(r.test.pOneSided), pcell(r.test.p), cell(r.test.meanDiff, decFmt(v)), cell(r.test.ciLower, decFmt(v)), cell(r.test.ciUpper, decFmt(v))]),
    }),
  );
  if (optBool(opts, 'effectSizes', true)) {
    const rows: Cell[][] = [];
    results.forEach(({ v, r }) => rows.push(...effectRows(vlabel(v), r.effects, true, r.effects.length)));
    blocks.push(tableBlock({ title: 'One-Sample Effect Sizes', header: [[hcell('', { colSpan: 2 }), hcell('Standardizer', { mark: 'a' }), hcell('Point Estimate')]], rows, stubColumns: 2, footnotes: ['a. ' + EFFECT_FOOT[0]] }));
  }
  const interp = results.map(({ v, r }) => {
    const dir = r.test.meanDiff > 0 ? 'higher' : 'lower';
    const d = r.effects[0].value;
    return r.test.p < 0.05
      ? `The mean of ${vprose(v)} (M = ${apaNum(r.stats.mean)}, SD = ${apaNum(r.stats.sd)}) was significantly ${dir} than the test value of ${tv}, a difference of ${apaNum(r.test.meanDiff)} (${pc}% CI ${apaNum(r.test.ciLower)} to ${apaNum(r.test.ciUpper)}). The effect is ${labelD(d)} (Cohen's d = ${apaNum(d)}).`
      : `The mean of ${vprose(v)} (M = ${apaNum(r.stats.mean)}, SD = ${apaNum(r.stats.sd)}) did not differ significantly from ${tv} (${apaP(r.test.p)}); the ${pc}% CI for the difference, ${apaNum(r.test.ciLower)} to ${apaNum(r.test.ciUpper)}, includes zero.`;
  });
  blocks.push(text('interpretation', interp.join(' ') + ` ${COHEN_NOTE}`));
  blocks.push(text('apa', results.map(({ v, r }) => `A one-sample t test showed that ${vprose(v)} (M = ${apaNum(r.stats.mean)}, SD = ${apaNum(r.stats.sd)}) ${r.test.p < 0.05 ? 'differed significantly' : 'did not differ significantly'} from ${tv}, t(${fmtDf(r.test.df)}) = ${apaNum(r.test.t)}, ${apaP(r.test.p)}, d = ${apaNum(r.effects[0].value)}.`).join(' ')));
  for (const { v, r } of results) if (r.stats.N < 30) blocks.push(text('warning', `${v.name}: small sample (N = ${fmtN(r.stats.N)}). The t test assumes the variable is roughly normal; check a histogram or use Explore.`));
  const syntax = `T-TEST\n  /TESTVAL=${tv}\n  /MISSING=${listwise ? 'LISTWISE' : 'ANALYSIS'}\n  /VARIABLES=${vs.map((v) => v.name).join(' ')}\n  /ES DISPLAY(${optBool(opts, 'effectSizes', true) ? 'TRUE' : 'FALSE'})\n  /CRITERIA=CI(${conf.toFixed(3).replace(/0+$/, '')}).`;
  const r0 = results[0];
  return item('ttest-one-sample', 'One-Sample T Test', ds, blocks, syntax, caseNote(ds, selN(r0.sel), r0.sel.nMissing));
}

export const oneSampleTTest: ProcedureDef = {
  id: 'ttest-one-sample',
  menu: 'Compare Means',
  title: 'One-Sample T Test',
  description: 'Test whether the mean of a variable differs from a fixed value (a norm, a scale midpoint, a national figure).',
  slots: [{ key: 'variables', label: 'Test Variable(s)', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] }],
  options: [
    { key: 'testValue', label: 'Test value', type: 'number', default: 0, step: 0.1 },
    { key: 'ciLevel', label: 'Confidence interval (%)', type: 'number', default: 95, min: 50, max: 99.9, step: 1, group: 'Options' },
    { key: 'effectSizes', label: 'Estimate effect sizes', type: 'checkbox', default: true, group: 'Options' },
    {
      key: 'missing',
      label: 'Missing values',
      type: 'select',
      default: 'analysis',
      choices: [
        { value: 'analysis', label: 'Exclude cases analysis by analysis' },
        { value: 'listwise', label: 'Exclude cases listwise' },
      ],
      group: 'Options',
    },
  ],
  run: runOneSample,
};

// ---------------------------------------------------------------------------------------------
// Independent samples
// ---------------------------------------------------------------------------------------------

function runIndependent(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const deps = vars(ds, slots, 'variables');
  if (!deps.length) throw new Error('Choose at least one test variable.');
  deps.forEach((v) => requireNumeric(v, 'Test variables'));
  const gv = one(ds, slots, 'group', 'grouping variable');
  const conf = confOpt(opts);
  const useCut = optStr(opts, 'defineBy', 'values') === 'cut';
  const cut = useCut ? optNum(opts, 'cutPoint', NaN) : null;
  if (useCut && !Number.isFinite(cut!)) throw new Error('Enter a cut point.');
  const listwise = optStr(opts, 'missing', 'analysis') === 'listwise';
  const selAll = selectCases(ds, [...deps.map((d) => d.id), gv.id]);
  const results = deps.map((v) => {
    const sel = listwise ? selAll : selectCases(ds, [v.id, gv.id]);
    const g = twoGroups(ds, gv, sel, opts.groups, cut);
    const wa = Float64Array.from(g.a.weights);
    const wb = Float64Array.from(g.b.weights);
    const na = wa.reduce((s, x) => s + x, 0);
    const nb = wb.reduce((s, x) => s + x, 0);
    if (na < 1 || nb < 1) throw new Error(`${v.name}: one of the groups (${na < 1 ? g.labelA : g.labelB}) has no valid cases.`);
    if (na + nb < 3) throw new Error(`${v.name}: at least three valid cases are needed.`);
    const r = independentT(numericValues(ds, v, g.a.rows), wa, numericValues(ds, v, g.b.rows), wb, conf);
    if (!(r.equal.seDiff > 0)) throw new Error(`${v.name} does not vary within the two groups, so the t test cannot be computed.`);
    return { v, g, sel, r };
  });
  const blocks: OutputBlock[] = [];
  const gRows: Cell[][] = [];
  results.forEach(({ v, g, r }) => {
    gRows.push([hcell(vlabel(v), { rowSpan: 2 }), hcell(g.labelA), cell(r.g1.N, 'int'), cell(r.g1.mean, decFmt(v)), cell(r.g1.sd, decFmt(v)), cell(r.g1.se, decFmt(v, 3))]);
    gRows.push([hcell(g.labelB), cell(r.g2.N, 'int'), cell(r.g2.mean, decFmt(v)), cell(r.g2.sd, decFmt(v)), cell(r.g2.se, decFmt(v, 3))]);
  });
  blocks.push(tableBlock({ title: 'Group Statistics', header: [[hcell(''), hcell(gv.name), hcell('N'), hcell('Mean'), hcell('Std. Deviation'), hcell('Std. Error Mean')]], rows: gRows, stubColumns: 2 }));
  const pc = Math.round(conf * 1000) / 10;
  const tRows: Cell[][] = [];
  results.forEach(({ v, r }) => {
    const row = (label: string, t: typeof r.equal, lev: boolean): Cell[] => [
      hcell(label),
      lev ? cell(r.levene.F, 'dec3') : blank(),
      lev ? pcell(r.levene.p) : blank(),
      cell(t.t, 'dec3'),
      cell(t.df, Number.isInteger(t.df) ? 'int' : 'dec3'),
      pcell(t.pOneSided),
      pcell(t.p),
      cell(t.meanDiff, decFmt(v)),
      cell(t.seDiff, decFmt(v, 3)),
      cell(t.ciLower, decFmt(v)),
      cell(t.ciUpper, decFmt(v)),
    ];
    tRows.push([hcell(vlabel(v), { rowSpan: 2 }), ...row('Equal variances assumed', r.equal, true)]);
    tRows.push(row('Equal variances not assumed', r.welch, false));
  });
  blocks.push(
    tableBlock({
      title: 'Independent Samples Test',
      header: [
        [hcell('', { colSpan: 2, rowSpan: 3 }), hcell("Levene's Test for Equality of Variances", { colSpan: 2 }), hcell('t-test for Equality of Means', { colSpan: 8 })],
        [hcell('F', { rowSpan: 2 }), hcell('Sig.', { rowSpan: 2 }), hcell('t', { rowSpan: 2 }), hcell('df', { rowSpan: 2 }), hcell('Significance', { colSpan: 2 }), hcell('Mean Difference', { rowSpan: 2 }), hcell('Std. Error Difference', { rowSpan: 2 }), hcell(`${pc}% Confidence Interval of the Difference`, { colSpan: 2 })],
        [hcell('One-Sided p'), hcell('Two-Sided p'), hcell('Lower'), hcell('Upper')],
      ],
      rows: tRows,
      stubColumns: 2,
      footnotes: ["Levene's test is based on the mean (absolute deviations from each group mean), as in SPSS."],
    }),
  );
  if (optBool(opts, 'effectSizes', true)) {
    const rows: Cell[][] = [];
    results.forEach(({ v, r }) => rows.push(...effectRows(vlabel(v), r.effects, true, r.effects.length)));
    blocks.push(
      tableBlock({
        title: 'Independent Samples Effect Sizes',
        header: [[hcell('', { colSpan: 2 }), hcell('Standardizer', { mark: 'a' }), hcell('Point Estimate')]],
        rows,
        stubColumns: 2,
        footnotes: ["a. The denominator used in estimating the effect sizes. Cohen's d uses the pooled standard deviation. Hedges' correction uses the pooled standard deviation divided by the small-sample factor J. Glass's delta uses the sample standard deviation of the second (comparison) group."],
      }),
    );
  }
  if (optBool(opts, 'chart', false)) {
    for (const { v, g, r } of results) {
      const chart: ChartSpec = {
        type: 'bar',
        title: `Mean ${vlabel(v)} by ${vlabel(gv)}`,
        xLabel: vlabel(gv),
        yLabel: `Mean ${vlabel(v)}`,
        categories: [g.labelA, g.labelB],
        series: [{ name: 'Mean', values: [r.g1.mean, r.g2.mean] }],
        errors: [[[r.g1.mean - 1.96 * r.g1.se, r.g1.mean + 1.96 * r.g1.se], [r.g2.mean - 1.96 * r.g2.se, r.g2.mean + 1.96 * r.g2.se]]],
      };
      blocks.push({ kind: 'chart', chart });
    }
  }
  const interp: string[] = [];
  const apa: string[] = [];
  for (const { v, g, r } of results) {
    const unequal = r.levene.p < 0.05;
    const t = unequal ? r.welch : r.equal;
    const rowName = unequal ? '"Equal variances not assumed"' : '"Equal variances assumed"';
    const d = r.effects[0].value;
    const hi = r.g1.mean >= r.g2.mean ? g.labelA : g.labelB;
    const lo = r.g1.mean >= r.g2.mean ? g.labelB : g.labelA;
    let s = `Levene's test ${unequal ? `indicates unequal variances (${apaP(r.levene.p)}), so read the ${rowName} row (Welch's t test)` : `does not indicate unequal variances (${apaP(r.levene.p)}), so read the ${rowName} row`}. `;
    s += t.p < 0.05
      ? `${hi} scored significantly higher on ${vprose(v)} than ${lo} (M = ${apaNum(Math.max(r.g1.mean, r.g2.mean))} vs ${apaNum(Math.min(r.g1.mean, r.g2.mean))}; difference ${apaNum(Math.abs(t.meanDiff))}, ${pc}% CI ${apaNum(Math.min(Math.abs(t.ciLower), Math.abs(t.ciUpper)))} to ${apaNum(Math.max(Math.abs(t.ciLower), Math.abs(t.ciUpper)))}). The difference is ${labelD(d)} (Cohen's d = ${apaNum(Math.abs(d))}).`
      : `The groups did not differ significantly on ${vprose(v)} (${g.labelA}: M = ${apaNum(r.g1.mean)}; ${g.labelB}: M = ${apaNum(r.g2.mean)}; ${apaP(t.p)}). Cohen's d = ${apaNum(Math.abs(d))} (${labelD(d)}).`;
    interp.push(s);
    apa.push(`${unequal ? "Welch's" : 'An independent-samples'} t test showed that ${vprose(v)} ${t.p < 0.05 ? 'differed significantly' : 'did not differ significantly'} between ${g.labelA} (M = ${apaNum(r.g1.mean)}, SD = ${apaNum(r.g1.sd)}) and ${g.labelB} (M = ${apaNum(r.g2.mean)}, SD = ${apaNum(r.g2.sd)}), t(${fmtDf(t.df)}) = ${apaNum(t.t)}, ${apaP(t.p)}, d = ${apaNum(d)}.`);
  }
  blocks.push(text('interpretation', interp.join(' ') + ` ${COHEN_NOTE}`));
  blocks.push(text('apa', apa.join(' ')));
  for (const { v, r, g } of results) {
    if (Math.min(r.g1.N, r.g2.N) < 15) blocks.push(text('warning', `${v.name}: a group is small (${g.labelA}: ${fmtN(r.g1.N)}, ${g.labelB}: ${fmtN(r.g2.N)}). The t test relies on approximately normal scores within each group; consider the Mann-Whitney U test as a check.`));
  }
  const groupsDef = results[0].g.defineSyntax;
  const syntax = `T-TEST GROUPS=${gv.name}${groupsDef}\n  /MISSING=${listwise ? 'LISTWISE' : 'ANALYSIS'}\n  /VARIABLES=${deps.map((d) => d.name).join(' ')}\n  /ES DISPLAY(${optBool(opts, 'effectSizes', true) ? 'TRUE' : 'FALSE'})\n  /CRITERIA=CI(${conf.toFixed(3).replace(/0+$/, '')}).`;
  const r0 = results[0];
  const Nused = r0.r.g1.N + r0.r.g2.N;
  const outside = selN(r0.sel) - Nused;
  return item('ttest-independent', 'Independent-Samples T Test', ds, blocks, syntax, caseNote(ds, Nused, r0.sel.nMissing, outside > 0 ? `${fmtN(outside)} in other groups of ${gv.name}` : undefined));
}

export const independentTTest: ProcedureDef = {
  id: 'ttest-independent',
  menu: 'Compare Means',
  title: 'Independent-Samples T Test',
  description: 'Compare the means of two groups (e.g. women and men) on a scale variable.',
  guidance: "Levene's test tells you which row to read: if it is significant, the variances differ and the Welch row (equal variances not assumed) is the right one.",
  slots: [
    { key: 'variables', label: 'Test Variable(s)', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
    { key: 'group', label: 'Grouping Variable', min: 1, max: 1 },
  ],
  options: [
    {
      key: 'defineBy',
      label: 'Define groups by',
      type: 'select',
      default: 'values',
      choices: [
        { value: 'values', label: 'Two specified values' },
        { value: 'cut', label: 'Cut point (>= cut point is group 1)' },
      ],
    },
    { key: 'groups', label: 'Groups', type: 'groupPair', slot: 'group' },
    { key: 'cutPoint', label: 'Cut point', type: 'number', default: 0, step: 0.5 },
    { key: 'ciLevel', label: 'Confidence interval (%)', type: 'number', default: 95, min: 50, max: 99.9, step: 1, group: 'Options' },
    { key: 'effectSizes', label: 'Estimate effect sizes', type: 'checkbox', default: true, group: 'Options' },
    { key: 'chart', label: 'Chart of means with 95% error bars', type: 'checkbox', default: false, group: 'Options' },
    {
      key: 'missing',
      label: 'Missing values',
      type: 'select',
      default: 'analysis',
      choices: [
        { value: 'analysis', label: 'Exclude cases analysis by analysis' },
        { value: 'listwise', label: 'Exclude cases listwise' },
      ],
      group: 'Options',
    },
  ],
  validate: (_ds, _slots, opts) => {
    if (opts.defineBy === 'cut') return Number.isFinite(Number(opts.cutPoint)) ? null : 'Enter a cut point.';
    const g = opts.groups;
    if (!Array.isArray(g) || g[0] === null || g[1] === null || g[0] === undefined || g[1] === undefined || g[0] === '' || g[1] === '') return 'Define the two groups to compare.';
    return null;
  },
  run: runIndependent,
};

// ---------------------------------------------------------------------------------------------
// Paired samples
// ---------------------------------------------------------------------------------------------

function runPaired(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const first = vars(ds, slots, 'first');
  const second = vars(ds, slots, 'second');
  if (!first.length) throw new Error('Choose at least one pair of variables.');
  if (first.length !== second.length) throw new Error(`The two lists must have the same length: variable 1 has ${first.length}, variable 2 has ${second.length}. Pair i of the first list is compared with pair i of the second.`);
  [...first, ...second].forEach((v) => requireNumeric(v, 'Paired variables'));
  const conf = confOpt(opts);
  const listwise = optStr(opts, 'missing', 'analysis') === 'listwise';
  const selAll = selectCases(ds, [...first, ...second].map((v) => v.id));
  const pairs = first.map((a, i) => {
    const b = second[i];
    if (a.id === b.id) throw new Error(`Pair ${i + 1} compares ${a.name} with itself.`);
    const sel = listwise ? selAll : selectCases(ds, [a.id, b.id]);
    if (selN(sel) < 2) throw new Error(`Pair ${i + 1} (${a.name} - ${b.name}): at least two cases with both values are needed.`);
    const r = pairedT(numericValues(ds, a, sel.rows), numericValues(ds, b, sel.rows), sel.weights, conf);
    if (!(r.diffSd > 0)) throw new Error(`Pair ${i + 1} (${a.name} - ${b.name}): the difference is the same for every case, so the t test cannot be computed.`);
    return { a, b, sel, r };
  });
  const blocks: OutputBlock[] = [];
  const sRows: Cell[][] = [];
  pairs.forEach(({ a, b, r }, i) => {
    sRows.push([hcell(`Pair ${i + 1}`, { rowSpan: 2 }), hcell(vlabel(a)), cell(r.first.mean, decFmt(a)), cell(r.first.N, 'int'), cell(r.first.sd, decFmt(a)), cell(r.first.se, decFmt(a, 3))]);
    sRows.push([hcell(vlabel(b)), cell(r.second.mean, decFmt(b)), cell(r.second.N, 'int'), cell(r.second.sd, decFmt(b)), cell(r.second.se, decFmt(b, 3))]);
  });
  blocks.push(tableBlock({ title: 'Paired Samples Statistics', header: [[hcell('', { colSpan: 2 }), hcell('Mean'), hcell('N'), hcell('Std. Deviation'), hcell('Std. Error Mean')]], rows: sRows, stubColumns: 2 }));
  blocks.push(
    tableBlock({
      title: 'Paired Samples Correlations',
      header: [
        [hcell('', { colSpan: 2, rowSpan: 2 }), hcell('N', { rowSpan: 2 }), hcell('Correlation', { rowSpan: 2 }), hcell('Significance', { colSpan: 2 })],
        [hcell('One-Sided p'), hcell('Two-Sided p')],
      ],
      rows: pairs.map(({ a, b, r }, i) => [hcell(`Pair ${i + 1}`), hcell(`${a.name} & ${b.name}`), cell(r.correlation.N, 'int'), cell(r.correlation.r, 'r'), pcell(r.correlation.p / 2), pcell(r.correlation.p)]),
      stubColumns: 2,
    }),
  );
  const pc = Math.round(conf * 1000) / 10;
  blocks.push(
    tableBlock({
      title: 'Paired Samples Test',
      header: [
        [hcell('', { colSpan: 2, rowSpan: 3 }), hcell('Paired Differences', { colSpan: 5 }), hcell('t', { rowSpan: 3 }), hcell('df', { rowSpan: 3 }), hcell('Significance', { colSpan: 2 })],
        [hcell('Mean', { rowSpan: 2 }), hcell('Std. Deviation', { rowSpan: 2 }), hcell('Std. Error Mean', { rowSpan: 2 }), hcell(`${pc}% Confidence Interval of the Difference`, { colSpan: 2 }), hcell('One-Sided p', { rowSpan: 2 }), hcell('Two-Sided p', { rowSpan: 2 })],
        [hcell('Lower'), hcell('Upper')],
      ],
      rows: pairs.map(({ a, b, r }, i) => [
        hcell(`Pair ${i + 1}`),
        hcell(`${a.name} - ${b.name}`),
        cell(r.test.meanDiff, decFmt(a)),
        cell(r.diffSd, decFmt(a)),
        cell(r.diffSe, decFmt(a, 3)),
        cell(r.test.ciLower, decFmt(a)),
        cell(r.test.ciUpper, decFmt(a)),
        cell(r.test.t, 'dec3'),
        cell(r.test.df, 'int'),
        pcell(r.test.pOneSided),
        pcell(r.test.p),
      ]),
      stubColumns: 2,
    }),
  );
  if (optBool(opts, 'effectSizes', true)) {
    const rows: Cell[][] = [];
    pairs.forEach(({ a, b, r }, i) => {
      const er = effectRows(`Pair ${i + 1}: ${a.name} - ${b.name}`, r.effects, true, r.effects.length);
      rows.push(...er);
    });
    blocks.push(tableBlock({ title: 'Paired Samples Effect Sizes', header: [[hcell('', { colSpan: 2 }), hcell('Standardizer', { mark: 'a' }), hcell('Point Estimate')]], rows, stubColumns: 2, footnotes: ["a. The denominator used in estimating the effect sizes. Cohen's d uses the sample standard deviation of the mean difference (d_z). Hedges' correction divides it by the small-sample factor J."] }));
  }
  const interp = pairs.map(({ a, b, r }) => {
    const d = r.effects[0].value;
    const higher = r.test.meanDiff > 0 ? a : b;
    const lower = r.test.meanDiff > 0 ? b : a;
    return r.test.p < 0.05
      ? `Scores on ${vprose(higher)} (M = ${apaNum(higher === a ? r.first.mean : r.second.mean)}) were significantly higher than on ${vprose(lower)} (M = ${apaNum(lower === a ? r.first.mean : r.second.mean)}); the mean difference (${a.name} - ${b.name}) is ${apaNum(r.test.meanDiff)} (${pc}% CI ${apaNum(r.test.ciLower)} to ${apaNum(r.test.ciUpper)}), a ${labelD(d)} effect (d_z = ${apaNum(Math.abs(d))}). The two measures correlate at r = ${apaNum(r.correlation.r, 2, true)} (${labelR(r.correlation.r)}).`
      : `${vprose(a)} (M = ${apaNum(r.first.mean)}) and ${vprose(b)} (M = ${apaNum(r.second.mean)}) did not differ significantly (${apaP(r.test.p)}; mean difference ${apaNum(r.test.meanDiff)}, ${pc}% CI ${apaNum(r.test.ciLower)} to ${apaNum(r.test.ciUpper)}).`;
  });
  blocks.push(text('interpretation', interp.join(' ') + ` ${COHEN_NOTE}`));
  blocks.push(text('apa', pairs.map(({ a, b, r }) => `A paired-samples t test showed that ${vprose(a)} (M = ${apaNum(r.first.mean)}, SD = ${apaNum(r.first.sd)}) and ${vprose(b)} (M = ${apaNum(r.second.mean)}, SD = ${apaNum(r.second.sd)}) ${r.test.p < 0.05 ? 'differed significantly' : 'did not differ significantly'}, t(${fmtDf(r.test.df)}) = ${apaNum(r.test.t)}, ${apaP(r.test.p)}, d_z = ${apaNum(r.effects[0].value)}.`).join(' ')));
  for (const { a, b, r } of pairs) if (r.first.N < 30) blocks.push(text('warning', `Pair ${a.name} - ${b.name}: small sample (N = ${fmtN(r.first.N)}). The paired t test assumes the differences are roughly normal; the Wilcoxon signed-rank test is a check.`));
  const syntax = `T-TEST PAIRS=${first.map((v) => v.name).join(' ')} WITH ${second.map((v) => v.name).join(' ')} (PAIRED)\n  /ES DISPLAY(${optBool(opts, 'effectSizes', true) ? 'TRUE' : 'FALSE'}) STANDARDIZER(SD)\n  /CRITERIA=CI(${conf.toFixed(3).replace(/0+$/, '')})\n  /MISSING=${listwise ? 'LISTWISE' : 'ANALYSIS'}.`;
  const p0 = pairs[0];
  return item('ttest-paired', 'Paired-Samples T Test', ds, blocks, syntax, caseNote(ds, selN(p0.sel), p0.sel.nMissing));
}

export const pairedTTest: ProcedureDef = {
  id: 'ttest-paired',
  menu: 'Compare Means',
  title: 'Paired-Samples T Test',
  description: 'Compare two measurements on the same people (before and after, two related questions).',
  guidance: 'Put the first measure of each pair in Variable 1 and the second in Variable 2; the i-th variables of the two lists form pair i.',
  slots: [
    { key: 'first', label: 'Variable 1', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
    { key: 'second', label: 'Variable 2', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
  ],
  options: [
    { key: 'ciLevel', label: 'Confidence interval (%)', type: 'number', default: 95, min: 50, max: 99.9, step: 1, group: 'Options' },
    { key: 'effectSizes', label: 'Estimate effect sizes', type: 'checkbox', default: true, group: 'Options' },
    {
      key: 'missing',
      label: 'Missing values',
      type: 'select',
      default: 'analysis',
      choices: [
        { value: 'analysis', label: 'Exclude cases analysis by analysis' },
        { value: 'listwise', label: 'Exclude cases listwise' },
      ],
      group: 'Options',
    },
  ],
  validate: (_ds, slots) => ((slots.first ?? []).length !== (slots.second ?? []).length ? 'Variable 1 and Variable 2 need the same number of variables (one pair per row).' : null),
  run: runPaired,
};

