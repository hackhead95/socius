// Analyze > Compare Means: Means (SPSS MEANS) and One-Way ANOVA (SPSS ONEWAY).

import { ciOption, confLevel, levelText } from '../text';
import { selectCases } from '../../core/data';
import type { Dataset, Variable } from '../../core/types';
import type { OutputBlock } from '../../core/output';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import { linearTrend, oneWayAnova, postHoc, tukeySubsets, type AnovaResult, type PostHocMethod } from '../../lib/stats/anova';
import { distinctWeighted, moments, percentileHaverage } from '../../lib/stats/util';
import {
  apaNum,
  apaP,
  blank,
  caseNote,
  categoriesOf,
  cell,
  COHEN_NOTE,
  decFmt,
  fmtDf,
  fmtN,
  hcell,
  heading,
  item,
  labelEta2,
  listProse,
  numericValues,
  one,
  optBool,
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
  selMissing,
  allFinite,
} from './common';

interface Grouped {
  cats: Array<number | string>;
  labels: string[];
  groups: Array<{ x: Float64Array; w: Float64Array; rows: number[] }>;
}

function groupBy(ds: Dataset, dep: Variable, factor: Variable, rows: number[], weights: Float64Array): Grouped {
  const cats = categoriesOf(ds, factor, rows);
  const fcol = ds.columns[factor.id];
  const buckets = cats.map(() => ({ r: [] as number[], w: [] as number[] }));
  rows.forEach((r, k) => {
    const i = cats.findIndex((c) => sameValue(c, fcol[r]));
    buckets[i].r.push(r);
    buckets[i].w.push(weights[k]);
  });
  return {
    cats,
    labels: cats.map((c) => valueText(factor, c)),
    groups: buckets.map((b) => ({ x: numericValues(ds, dep, b.r), w: Float64Array.from(b.w), rows: b.r })),
  };
}

// ---------------------------------------------------------------------------------------------
// Means
// ---------------------------------------------------------------------------------------------

const MEANS_STATS: Array<{ key: string; label: string; dflt: boolean }> = [
  { key: 'mean', label: 'Mean', dflt: true },
  { key: 'n', label: 'N', dflt: true },
  { key: 'sd', label: 'Std. Deviation', dflt: true },
  { key: 'median', label: 'Median', dflt: false },
  { key: 'se', label: 'Std. Error of Mean', dflt: false },
  { key: 'min', label: 'Minimum', dflt: false },
  { key: 'max', label: 'Maximum', dflt: false },
  { key: 'sum', label: 'Sum', dflt: false },
  { key: 'variance', label: 'Variance', dflt: false },
];

function statValues(x: Float64Array, w: Float64Array) {
  if (!x.length) return null;
  const m = moments(x, w);
  const d = distinctWeighted(x, w);
  return { mean: m.mean, n: m.W, sd: m.sd, median: percentileHaverage(d, 0.5), se: m.sd / Math.sqrt(m.W), min: m.min, max: m.max, sum: m.sum, variance: m.variance };
}

function runMeans(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const deps = vars(ds, slots, 'dependents');
  const l1 = vars(ds, slots, 'layer1');
  const l2 = vars(ds, slots, 'layer2');
  if (!deps.length) throw new Error('Choose at least one dependent variable.');
  if (!l1.length) throw new Error('Choose at least one independent (grouping) variable.');
  deps.forEach((d) => requireNumeric(d, 'Dependent variables'));
  const stats = MEANS_STATS.filter((s) => optBool(opts, s.key, s.dflt));
  if (!stats.length) stats.push(MEANS_STATS[0]);
  const blocks: OutputBlock[] = [];
  const interp: string[] = [];
  const apa: string[] = [];
  let firstNote = '';
  const layer2List: Array<Variable | null> = l2.length ? l2 : [null];
  for (const dep of deps)
    for (const f1 of l1)
      for (const f2 of layer2List) {
        const ids = [dep.id, f1.id, ...(f2 ? [f2.id] : [])];
        const sel = selectCases(ds, ids);
        if (!firstNote) firstNote = caseNote(ds, selN(sel), selMissing(ds, sel));
        const g1 = groupBy(ds, dep, f1, sel.rows, sel.weights);
        const rows: Cell[][] = [];
        const ruleBefore: number[] = [];
        const fmtOf = (k: string) => (k === 'n' ? 'int' : decFmt(dep));
        const statCells = (x: Float64Array, w: Float64Array, bold = false): Cell[] => {
          const s = statValues(x, w);
          return stats.map((st) => (s ? cell((s as Record<string, number>)[st.key], fmtOf(st.key), bold ? { bold: true } : {}) : cell(NaN)));
        };
        g1.groups.forEach((g, i) => {
          if (!f2) {
            rows.push([hcell(g1.labels[i]), ...statCells(g.x, g.w)]);
            return;
          }
          const sub = groupBy(ds, dep, f2, g.rows, g.w);
          sub.groups.forEach((sg, j) => {
            rows.push([...(j === 0 ? [hcell(g1.labels[i], { rowSpan: sub.groups.length + 1 })] : []), hcell(sub.labels[j]), ...statCells(sg.x, sg.w)]);
          });
          rows.push([hcell('Total', { bold: true }), ...statCells(g.x, g.w, true)]);
        });
        ruleBefore.push(rows.length);
        const allX = numericValues(ds, dep, sel.rows);
        rows.push([hcell('Total', { bold: true, ...(f2 ? { colSpan: 2 } : {}) }), ...statCells(allX, sel.weights, true)]);
        blocks.push(
          tableBlock({
            title: 'Report',
            subtitle: vlabel(dep),
            header: [[hcell(f1.name), ...(f2 ? [hcell(f2.name)] : []), ...stats.map((s) => hcell(s.label))]],
            rows,
            stubColumns: f2 ? 2 : 1,
            ruleBefore,
          }),
        );
        const nonEmpty = g1.groups.map((g, i) => ({ g, i })).filter(({ g }) => g.x.length > 0);
        if (nonEmpty.length >= 2) {
          const means = nonEmpty.map(({ g, i }) => ({ label: g1.labels[i], m: moments(g.x, g.w) }));
          means.sort((a, b) => b.m.mean - a.m.mean);
          let s = `${vprose(dep)} was highest for ${means[0].label} (M = ${apaNum(means[0].m.mean)}) and lowest for ${means[means.length - 1].label} (M = ${apaNum(means[means.length - 1].m.mean)})${f2 ? ` (averaged over ${vprose(f2)})` : ''}.`;
          if (optBool(opts, 'anova', false) && !f2) {
            const a = oneWayAnova(nonEmpty.map(({ g }) => ({ x: g.x, w: g.w })));
            // The F test needs degrees of freedom and variation within groups (weighted N above the number of groups).
            const testable = a.dfW > 0 && a.msW > 0 && allFinite(a.F, a.p);
            if (!testable) {
              a.F = NaN;
              a.p = NaN;
            }
            blocks.push(
              tableBlock({
                title: 'ANOVA Table',
                header: [[hcell('', { colSpan: 2 }), hcell('Sum of Squares'), hcell('df'), hcell('Mean Square'), hcell('F'), hcell('Sig.')]],
                rows: [
                  [hcell(`${dep.name} * ${f1.name}`, { rowSpan: 3 }), hcell('Between Groups (Combined)'), cell(a.ssB, 'dec3'), cell(a.dfB, 'int'), cell(a.msB, 'dec3'), cell(a.F, 'dec3'), pcell(a.p)],
                  [hcell('Within Groups'), cell(a.ssW, 'dec3'), cell(a.dfW > 0 ? a.dfW : NaN, Number.isInteger(a.dfW) ? 'int' : 'dec2'), cell(a.dfW > 0 ? a.msW : NaN, 'dec3'), blank(), blank()],
                  [hcell('Total'), cell(a.ssT, 'dec3'), cell(a.dfT > 0 ? a.dfT : NaN, Number.isInteger(a.dfT) ? 'int' : 'dec2'), blank(), blank(), blank()],
                ],
                stubColumns: 2,
              }),
            );
            blocks.push(
              tableBlock({
                title: 'Measures of Association',
                header: [[hcell(''), hcell('Eta'), hcell('Eta Squared')]],
                rows: [[hcell(`${dep.name} * ${f1.name}`), cell(Math.sqrt(a.effects.etaSq), 'r'), cell(a.effects.etaSq, 'r')]],
              }),
            );
            if (!testable) s += ` The ANOVA F test cannot be computed because ${a.dfW > 0 ? `${vprose(dep)} does not vary within the groups` : 'there are no degrees of freedom within the groups (it needs more cases than groups)'}.`;
            else s += ` The differences are ${a.p < 0.05 ? 'statistically significant' : 'not statistically significant'} (F(${fmtDf(a.dfB)}, ${fmtDf(a.dfW)}) = ${apaNum(a.F)}, ${apaP(a.p)}); ${vprose(f1)} accounts for ${(100 * a.effects.etaSq).toFixed(1)}% of the variance in ${vprose(dep)} (η² = ${apaNum(a.effects.etaSq, 2, true)}, a ${labelEta2(a.effects.etaSq)} effect).`;
            if (testable) apa.push(`A one-way analysis of variance showed that ${vprose(dep)} ${a.p < 0.05 ? 'differed significantly' : 'did not differ significantly'} by ${vprose(f1)}, F(${fmtDf(a.dfB)}, ${fmtDf(a.dfW)}) = ${apaNum(a.F)}, ${apaP(a.p)}, η² = ${apaNum(a.effects.etaSq, 2, true)}.`);
          }
          interp.push(s);
        } else {
          const what = nonEmpty.length === 0 ? `${vprose(dep)} has no valid values among the selected cases` : `Only one group of ${vprose(f1)} (${g1.labels[nonEmpty[0].i]}) has valid values of ${vprose(dep)}`;
          blocks.push(text('warning', `${what}, so there are no groups to compare${optBool(opts, 'anova', false) ? ' and no ANOVA was computed' : ''}.`));
        }
      }
  if (optBool(opts, 'anova', false) && l2.length) blocks.push(text('note', 'The ANOVA table and eta are computed for the first-layer variable only, without a second layer (as in SPSS).'));
  if (interp.length) blocks.push(text('interpretation', interp.join(' ') + (optBool(opts, 'anova', false) ? ` ${COHEN_NOTE}` : '')));
  if (apa.length) blocks.push(text('apa', apa.join(' ')));
  const cellsKw = stats.map((s) => ({ mean: 'MEAN', n: 'COUNT', sd: 'STDDEV', median: 'MEDIAN', se: 'SEMEAN', min: 'MIN', max: 'MAX', sum: 'SUM', variance: 'VAR' })[s.key as 'mean']);
  const syntax = `MEANS TABLES=${deps.map((d) => d.name).join(' ')} BY ${l1.map((v) => v.name).join(' ')}${l2.length ? ` BY ${l2.map((v) => v.name).join(' ')}` : ''}\n  /CELLS=${cellsKw.join(' ')}${optBool(opts, 'anova', false) ? '\n  /STATISTICS ANOVA' : ''}.`;
  return item('means', 'Means', ds, blocks, syntax, firstNote);
}

export const means: ProcedureDef = {
  id: 'means',
  menu: 'Compare Means',
  title: 'Means',
  description: 'Compare group means (and other statistics) of scale variables across the categories of one or more grouping variables.',
  guidance: 'Add a second layer to break each group down further. Tick the ANOVA option for a significance test and eta squared for the first layer.',
  slots: [
    { key: 'dependents', label: 'Dependent List', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
    { key: 'layer1', label: 'Independent List (Layer 1)', min: 1, max: Infinity, measures: ['nominal', 'ordinal'] },
    { key: 'layer2', label: 'Layer 2 (optional)', min: 0, max: Infinity, measures: ['nominal', 'ordinal'] },
  ],
  options: [
    ...MEANS_STATS.map((s) => ({ key: s.key, label: s.label, type: 'checkbox' as const, default: s.dflt, group: 'Cell statistics' })),
    { key: 'anova', label: 'ANOVA table and eta', type: 'checkbox', default: false, group: 'Statistics for first layer' },
  ],
  run: runMeans,
};

// ---------------------------------------------------------------------------------------------
// One-way ANOVA
// ---------------------------------------------------------------------------------------------

/** More groups than this is almost always a scale variable dropped into the Factor box by mistake. */
const MAX_GROUPS = 50;

const POST_HOC: Array<{ key: PostHocMethod; label: string; syntax: string }> = [
  { key: 'tukey', label: 'Tukey', syntax: 'TUKEY' },
  { key: 'bonferroni', label: 'Bonferroni', syntax: 'BONFERRONI' },
  { key: 'scheffe', label: 'Scheffe', syntax: 'SCHEFFE' },
  { key: 'gamesHowell', label: 'Games-Howell', syntax: 'GH' },
];

function runOneway(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const deps = vars(ds, slots, 'dependents');
  const factor = one(ds, slots, 'factor', 'factor variable');
  if (!deps.length) throw new Error('Choose at least one dependent variable.');
  deps.forEach((d) => requireNumeric(d, 'Dependent variables'));
  const conf = confLevel(opts, 'ciLevel', 'Confidence level (%)');
  const methods = POST_HOC.filter((m) => optBool(opts, m.key));
  const blocks: OutputBlock[] = [];
  const interp: string[] = [];
  const apa: string[] = [];
  let note = '';
  for (const dep of deps) {
    const sel = selectCases(ds, [dep.id, factor.id]);
    if (!note) note = caseNote(ds, selN(sel), selMissing(ds, sel));
    const g = groupBy(ds, dep, factor, sel.rows, sel.weights);
    const keep = g.groups.map((gr, i) => ({ gr, i })).filter(({ gr }) => gr.x.length > 0);
    if (keep.length < 2) throw new Error(keep.length === 0 ? `${dep.name} has no valid values in any group of ${factor.name} among the selected cases.` : `${dep.name}: the factor ${factor.name} has only one group with valid cases; at least two are needed.`);
    if (keep.length > MAX_GROUPS) throw new Error(`${factor.name} has ${keep.length} groups. One-way ANOVA compares a handful of categories; recode ${factor.name} into ${MAX_GROUPS} or fewer groups first (Transform > Recode), or use Correlations or Regression for a scale variable.`);
    const labels = keep.map(({ i }) => g.labels[i]);
    const a: AnovaResult = oneWayAnova(keep.map(({ gr }) => ({ x: gr.x, w: gr.w })), conf);
    if (!(a.dfW > 0)) throw new Error(`${dep.name}: there are no degrees of freedom within groups (each group has a single case).`);
    if (!(a.msW > 0)) throw new Error(`${dep.name} does not vary within the groups of ${factor.name}, so the F test cannot be computed.`);
    if (deps.length > 1) blocks.push(heading(vlabel(dep)));
    const pc = levelText(conf);
    if (optBool(opts, 'descriptives', true)) {
      const row = (label: string, d: AnovaResult['total'], bold = false): Cell[] => [
        hcell(label, bold ? { bold: true } : {}),
        cell(d.N, 'int'),
        cell(d.mean, decFmt(dep)),
        cell(d.sd, decFmt(dep)),
        cell(d.se, decFmt(dep, 3)),
        cell(d.ciLower, decFmt(dep)),
        cell(d.ciUpper, decFmt(dep)),
        cell(d.min, decFmt(dep, 0)),
        cell(d.max, decFmt(dep, 0)),
      ];
      blocks.push(
        tableBlock({
          title: 'Descriptives',
          subtitle: vlabel(dep),
          header: [
            [hcell('', { rowSpan: 2 }), hcell('N', { rowSpan: 2 }), hcell('Mean', { rowSpan: 2 }), hcell('Std. Deviation', { rowSpan: 2 }), hcell('Std. Error', { rowSpan: 2 }), hcell(`${pc}% Confidence Interval for Mean`, { colSpan: 2 }), hcell('Minimum', { rowSpan: 2 }), hcell('Maximum', { rowSpan: 2 })],
            [hcell('Lower Bound'), hcell('Upper Bound')],
          ],
          rows: [...a.groups.map((d, i) => row(labels[i], d)), row('Total', a.total, true)],
          ruleBefore: [a.groups.length],
        }),
      );
    }
    if (optBool(opts, 'homogeneity', true)) {
      blocks.push(
        tableBlock({
          title: 'Tests of Homogeneity of Variances',
          subtitle: vlabel(dep),
          header: [[hcell(''), hcell('Levene Statistic'), hcell('df1'), hcell('df2'), hcell('Sig.')]],
          rows: [
            [hcell('Based on Mean'), cell(a.leveneMean.F, 'dec3'), cell(a.leveneMean.df1, 'int'), cell(a.leveneMean.df2, Number.isInteger(a.leveneMean.df2) ? 'int' : 'dec2'), pcell(a.leveneMean.p)],
            [hcell('Based on Median'), cell(a.leveneMedian.F, 'dec3'), cell(a.leveneMedian.df1, 'int'), cell(a.leveneMedian.df2, Number.isInteger(a.leveneMedian.df2) ? 'int' : 'dec2'), pcell(a.leveneMedian.p)],
          ],
        }),
      );
    }
    const trend = optBool(opts, 'trend') && keep.length >= 3 ? linearTrend(a.groups, a.ssB, a.msW, a.dfW) : null;
    {
      const rows: Cell[][] = [];
      if (trend) {
        rows.push([hcell('Between Groups', { rowSpan: 4 }), hcell('(Combined)', { colSpan: 2 }), cell(a.ssB, 'dec3'), cell(a.dfB, 'int'), cell(a.msB, 'dec3'), cell(a.F, 'dec3'), pcell(a.p)]);
        rows.push([hcell('Linear Term', { rowSpan: 3 }), hcell('Unweighted'), cell(trend.unweighted.ss, 'dec3'), cell(1, 'int'), cell(trend.unweighted.ss, 'dec3'), cell(trend.unweighted.F, 'dec3'), pcell(trend.unweighted.p)]);
        rows.push([hcell('Weighted'), cell(trend.weighted.ss, 'dec3'), cell(1, 'int'), cell(trend.weighted.ss, 'dec3'), cell(trend.weighted.F, 'dec3'), pcell(trend.weighted.p)]);
        rows.push([hcell('Deviation'), cell(trend.deviation.ss, 'dec3'), cell(trend.deviation.df, 'int'), cell(trend.deviation.ss / trend.deviation.df, 'dec3'), cell(trend.deviation.F, 'dec3'), pcell(trend.deviation.p)]);
        rows.push([hcell('Within Groups', { colSpan: 3 }), cell(a.ssW, 'dec3'), cell(a.dfW, Number.isInteger(a.dfW) ? 'int' : 'dec2'), cell(a.msW, 'dec3'), blank(), blank()]);
        rows.push([hcell('Total', { colSpan: 3 }), cell(a.ssT, 'dec3'), cell(a.dfT, Number.isInteger(a.dfT) ? 'int' : 'dec2'), blank(), blank(), blank()]);
      } else {
        rows.push([hcell('Between Groups'), cell(a.ssB, 'dec3'), cell(a.dfB, 'int'), cell(a.msB, 'dec3'), cell(a.F, 'dec3'), pcell(a.p)]);
        rows.push([hcell('Within Groups'), cell(a.ssW, 'dec3'), cell(a.dfW, Number.isInteger(a.dfW) ? 'int' : 'dec2'), cell(a.msW, 'dec3'), blank(), blank()]);
        rows.push([hcell('Total'), cell(a.ssT, 'dec3'), cell(a.dfT, Number.isInteger(a.dfT) ? 'int' : 'dec2'), blank(), blank(), blank()]);
      }
      blocks.push(
        tableBlock({
          title: 'ANOVA',
          subtitle: vlabel(dep),
          header: [[hcell('', { colSpan: trend ? 3 : 1 }), hcell('Sum of Squares'), hcell('df'), hcell('Mean Square'), hcell('F'), hcell('Sig.')]],
          rows,
          stubColumns: trend ? 3 : 1,
          footnotes: trend ? ['Linear term coefficients assume equally spaced groups in the listed order.'] : undefined,
        }),
      );
    }
    if (optBool(opts, 'welch', true) || optBool(opts, 'brownForsythe')) {
      const rows: Cell[][] = [];
      if (optBool(opts, 'welch', true)) rows.push([hcell('Welch'), cell(a.welch.F, 'dec3'), cell(a.welch.df1, 'int'), cell(a.welch.df2, 'dec3'), pcell(a.welch.p)]);
      if (optBool(opts, 'brownForsythe')) rows.push([hcell('Brown-Forsythe'), cell(a.brownForsythe.F, 'dec3'), cell(a.brownForsythe.df1, 'int'), cell(a.brownForsythe.df2, 'dec3'), pcell(a.brownForsythe.p)]);
      blocks.push(tableBlock({ title: 'Robust Tests of Equality of Means', subtitle: vlabel(dep), header: [[hcell(''), hcell('Statistic', { mark: 'a' }), hcell('df1'), hcell('df2'), hcell('Sig.')]], rows, footnotes: ['a. Asymptotically F distributed.'] }));
    }
    if (optBool(opts, 'effectSizes', true)) {
      blocks.push(
        tableBlock({
          title: 'ANOVA Effect Sizes',
          subtitle: vlabel(dep),
          header: [[hcell(''), hcell('Point Estimate')]],
          rows: [
            [hcell('Eta-squared'), cell(a.effects.etaSq, 'r')],
            [hcell('Epsilon-squared'), cell(a.effects.epsilonSq, 'r')],
            [hcell('Omega-squared Fixed-effect'), cell(a.effects.omegaSqFixed, 'r')],
            [hcell('Omega-squared Random-effect'), cell(a.effects.omegaSqRandom, 'r')],
          ],
          footnotes: ['Eta-squared is biased upward in small samples; epsilon-squared and omega-squared correct for this. Negative estimates are reported as computed and mean the effect is essentially zero.'],
        }),
      );
    }
    const sigPairs: string[] = [];
    if (methods.length) {
      const rows: Cell[][] = [];
      const ruleBefore: number[] = [];
      let anySig = false;
      const k = a.groups.length;
      for (const m of methods) {
        const cmp = postHoc(m.key, a.groups, a.msW, a.dfW, conf);
        if (rows.length) ruleBefore.push(rows.length);
        for (let i = 0; i < k; i++) {
          const list = cmp.filter((c) => c.i === i);
          list.forEach((c, n) => {
            const sig = c.p < 1 - conf;
            if (sig) anySig = true;
            const r: Cell[] = [];
            if (i === 0 && n === 0) r.push(hcell(m.label, { rowSpan: k * (k - 1) }));
            if (n === 0) r.push(hcell(labels[i], { rowSpan: k - 1 }));
            r.push(hcell(labels[c.j]), cell(c.diff, decFmt(dep), sig ? { mark: '*' } : {}), cell(c.se, decFmt(dep, 3)), pcell(c.p), cell(c.ciLower, decFmt(dep)), cell(c.ciUpper, decFmt(dep)));
            rows.push(r);
            if (sig && c.i < c.j && m === methods[0]) sigPairs.push(`${labels[c.i]} and ${labels[c.j]} (difference ${apaNum(c.diff)}, ${apaP(c.p)})`);
          });
        }
      }
      blocks.push(
        tableBlock({
          title: 'Multiple Comparisons',
          subtitle: `Dependent Variable: ${vlabel(dep)}`,
          header: [
            [hcell('', { rowSpan: 2 }), hcell(`(I) ${factor.name}`, { rowSpan: 2 }), hcell(`(J) ${factor.name}`, { rowSpan: 2 }), hcell('Mean Difference (I-J)', { rowSpan: 2 }), hcell('Std. Error', { rowSpan: 2 }), hcell('Sig.', { rowSpan: 2 }), hcell(`${pc}% Confidence Interval`, { colSpan: 2 })],
            [hcell('Lower Bound'), hcell('Upper Bound')],
          ],
          rows,
          stubColumns: 3,
          ruleBefore,
          footnotes: anySig ? [`*. The mean difference is significant at the ${(1 - conf).toFixed(2).replace(/^0/, '')} level.`] : undefined,
        }),
      );
      if (optBool(opts, 'subsets') && methods.some((m) => m.key === 'tukey')) {
        const ts = tukeySubsets(a.groups, a.msW, a.dfW, 1 - conf);
        const nSub = ts.subsets.length;
        const rows2: Cell[][] = ts.order.map((gi) => [
          hcell(labels[gi]),
          cell(a.groups[gi].N, 'int'),
          ...ts.subsets.map((s) => (s.members.includes(gi) ? cell(a.groups[gi].mean, decFmt(dep)) : blank())),
        ]);
        rows2.push([hcell('Sig.'), blank(), ...ts.subsets.map((s) => cell(s.p, 'p'))]);
        const unequal = a.groups.some((gr) => Math.abs(gr.N - a.groups[0].N) > 1e-9);
        blocks.push(
          tableBlock({
            title: vlabel(dep),
            subtitle: 'Homogeneous Subsets: Tukey HSD',
            header: [
              [hcell(factor.name, { rowSpan: 2 }), hcell('N', { rowSpan: 2 }), hcell(`Subset for alpha = ${(1 - conf).toFixed(2).replace(/^0/, '')}`, { colSpan: nSub })],
              ts.subsets.map((_, i) => hcell(String(i + 1))),
            ],
            rows: rows2,
            ruleBefore: [rows2.length - 1],
            footnotes: [
              'Means for groups in homogeneous subsets are displayed.',
              `a. Uses Harmonic Mean Sample Size = ${ts.harmonicN.toFixed(3)}.`,
              ...(unequal ? ['b. The group sizes are unequal. The harmonic mean of the group sizes is used. Type I error levels are not guaranteed.'] : []),
            ],
          }),
        );
      }
    }
    if (optBool(opts, 'plot')) {
      blocks.push({ kind: 'chart', chart: { type: 'line', title: `Means of ${vlabel(dep)} by ${vlabel(factor)}`, xLabel: vlabel(factor), yLabel: `Mean of ${vlabel(dep)}`, categories: labels, series: [{ name: vlabel(dep), values: a.groups.map((gr) => gr.mean) }] } });
    }
    // Interpretation
    const leveneSig = a.leveneMean.p < 0.05;
    // Welch needs at least two cases and some variation in every group; without it, report the
    // standard F test and say why, rather than printing an undefined statistic.
    const welchOk = Number.isFinite(a.welch.F) && Number.isFinite(a.welch.df2) && Number.isFinite(a.welch.p);
    const unequalVar = leveneSig && welchOk;
    const order = a.groups.map((gr, i) => ({ gr, i })).sort((x, y) => y.gr.mean - x.gr.mean);
    const hi = order[0];
    const lo = order[order.length - 1];
    const mainP = unequalVar ? a.welch.p : a.p;
    let s = `Mean ${vprose(dep)} was highest for ${labels[hi.i]} (M = ${apaNum(hi.gr.mean)}) and lowest for ${labels[lo.i]} (M = ${apaNum(lo.gr.mean)}). `;
    if (unequalVar) s += `Levene's test indicates unequal variances (${apaP(a.leveneMean.p)}), so the Welch test is the more trustworthy test of equal means${methods.some((m) => m.key === 'gamesHowell') ? ' and Games-Howell the more trustworthy post hoc test' : '; consider Games-Howell for post hoc comparisons'}. `;
    else if (leveneSig) s += `Levene's test indicates unequal variances (${apaP(a.leveneMean.p)}), but the Welch test cannot be computed because at least one group has fewer than two cases or no variation, so the standard F test is reported; interpret it with caution. `;
    s += mainP < 0.05
      ? `The group means differ significantly (${unequalVar ? `Welch F(${fmtDf(a.welch.df1)}, ${fmtDf(a.welch.df2)}) = ${apaNum(a.welch.F)}` : `F(${fmtDf(a.dfB)}, ${fmtDf(a.dfW)}) = ${apaNum(a.F)}`}, ${apaP(mainP)}). ${vprose(factor)} accounts for ${(100 * a.effects.etaSq).toFixed(1)}% of the variance (η² = ${apaNum(a.effects.etaSq, 2, true)}, ω² = ${apaNum(a.effects.omegaSqFixed, 2, true)}), a ${labelEta2(a.effects.omegaSqFixed)} effect judged by ω² (which corrects the upward bias of η²).`
      : `The differences between groups are not statistically significant (${apaP(mainP)}; η² = ${apaNum(a.effects.etaSq, 2, true)}).`;
    if (methods.length) s += sigPairs.length ? ` ${methods[0].label} post hoc tests show significant differences between ${listProse(sigPairs)}.` : ` ${methods[0].label} post hoc tests find no pair of groups that differs significantly.`;
    interp.push(s);
    apa.push(
      unequalVar
        ? `A Welch one-way ANOVA showed that ${vprose(dep)} ${mainP < 0.05 ? 'differed significantly' : 'did not differ significantly'} across ${vprose(factor)} groups, F(${fmtDf(a.welch.df1)}, ${fmtDf(a.welch.df2)}) = ${apaNum(a.welch.F)}, ${apaP(a.welch.p)}, ω² = ${apaNum(a.effects.omegaSqFixed, 2, true)}.`
        : `A one-way ANOVA showed that ${vprose(dep)} ${mainP < 0.05 ? 'differed significantly' : 'did not differ significantly'} across ${vprose(factor)} groups, F(${fmtDf(a.dfB)}, ${fmtDf(a.dfW)}) = ${apaNum(a.F)}, ${apaP(a.p)}, η² = ${apaNum(a.effects.etaSq, 2, true)}.`,
    );
    const small = a.groups.map((gr, i) => ({ gr, i })).filter(({ gr }) => gr.N < 2);
    if (small.length) blocks.push(text('warning', `${dep.name}: ${listProse(small.map(({ i }) => labels[i]))} ${small.length === 1 ? 'has' : 'have'} fewer than two cases; ${small.length === 1 ? 'its' : 'their'} variance is not defined, so Welch, Brown-Forsythe and Games-Howell results are not available.`));
    const ns = a.groups.map((gr) => gr.N);
    if (Math.max(...ns) / Math.min(...ns) > 1.5 && unequalVar) blocks.push(text('warning', `${dep.name}: group sizes are unequal and variances differ. The standard F test can be misleading in this situation; rely on the Welch test.`));
  }
  blocks.push(text('interpretation', interp.join(' ') + ` ${COHEN_NOTE}`));
  blocks.push(text('apa', apa.join(' ')));
  const statsKw = [optBool(opts, 'descriptives', true) ? 'DESCRIPTIVES' : '', optBool(opts, 'effectSizes', true) ? 'EFFECTS' : '', optBool(opts, 'homogeneity', true) ? 'HOMOGENEITY' : '', optBool(opts, 'brownForsythe') ? 'BROWNFORSYTHE' : '', optBool(opts, 'welch', true) ? 'WELCH' : ''].filter(Boolean);
  let syntax = `ONEWAY ${deps.map((d) => d.name).join(' ')} BY ${factor.name}${optBool(opts, 'trend') ? '\n  /POLYNOMIAL=1' : ''}\n  /ES=OVERALL\n  /STATISTICS ${statsKw.join(' ')}${optBool(opts, 'plot') ? '\n  /PLOT MEANS' : ''}\n  /MISSING ANALYSIS\n  /CRITERIA=CILEVEL(${conf.toFixed(3).replace(/0+$/, '')})`;
  if (methods.length) syntax += `\n  /POSTHOC=${methods.map((m) => m.syntax).join(' ')} ALPHA(${(1 - conf).toFixed(3).replace(/0+$/, '')})`;
  syntax += '.';
  return item('oneway-anova', 'One-Way ANOVA', ds, blocks, syntax, note);
}

export const onewayAnova: ProcedureDef = {
  id: 'oneway-anova',
  menu: 'Compare Means',
  title: 'One-Way ANOVA',
  description: 'Compare the means of three or more groups (e.g. income by region) and find out which groups differ.',
  guidance:
    "Check Levene's test first. If variances differ, read the Welch test and use Games-Howell for post hoc comparisons. Tukey is the usual choice when variances are similar.",
  slots: [
    { key: 'dependents', label: 'Dependent List', min: 1, max: Infinity, types: ['numeric'], measures: ['scale'] },
    { key: 'factor', label: 'Factor', min: 1, max: 1, measures: ['nominal', 'ordinal'] },
  ],
  options: [
    { key: 'descriptives', label: 'Descriptive', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'homogeneity', label: 'Homogeneity of variance test', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'welch', label: 'Welch', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'brownForsythe', label: 'Brown-Forsythe', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'effectSizes', label: 'Estimate effect size', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'trend', label: 'Linear trend (polynomial contrast)', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'tukey', label: 'Tukey', type: 'checkbox', default: false, group: 'Post hoc' },
    { key: 'bonferroni', label: 'Bonferroni', type: 'checkbox', default: false, group: 'Post hoc' },
    { key: 'scheffe', label: 'Scheffe', type: 'checkbox', default: false, group: 'Post hoc' },
    { key: 'gamesHowell', label: 'Games-Howell (unequal variances)', type: 'checkbox', default: false, group: 'Post hoc' },
    { key: 'subsets', label: 'Homogeneous subsets (Tukey)', type: 'checkbox', default: false, group: 'Post hoc' },
    ciOption('ciLevel', 'Confidence level (%)', 'Options'),
    { key: 'plot', label: 'Means plot', type: 'checkbox', default: false, group: 'Options' },
  ],
  run: runOneway,
};

