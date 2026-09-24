// Analyze > Nonparametric Tests (SPSS NPAR TESTS): chi-square goodness of fit, binomial,
// Mann-Whitney U, Wilcoxon signed-rank, Kruskal-Wallis H and Friedman.

import { selectCases } from '../../core/data';
import type { Dataset } from '../../core/types';
import type { OutputBlock } from '../../core/output';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import { binomialTest, chiSquareGof, dunnTest, friedman, kruskalWallis, mannWhitney, wilcoxonSignedRank } from '../../lib/stats/nonparametric';
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
  item,
  labelR,
  labelW,
  labelEta2,
  listProse,
  numericValues,
  one,
  optBool,
  optNum,
  optStr,
  parseNumberList,
  pcell,
  requireNumeric,
  sameValue,
  selN,
  syntaxValue,
  tableBlock,
  text,
  twoGroups,
  valueText,
  vars,
  vlabel,
  vprose,
  type Cell,
  selMissing,
} from './common';

// ---------------------------------------------------------------------------------------------
// Chi-square goodness of fit
// ---------------------------------------------------------------------------------------------

function runGof(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (!vs.length) throw new Error('Choose at least one test variable.');
  const custom = optStr(opts, 'expected', 'equal') === 'values';
  const valuesText = optStr(opts, 'expectedValues', '').trim();
  const props = custom ? parseNumberList(valuesText, 'Expected values', 0, Infinity, true) : undefined;
  if (custom && (!props || !props.length)) throw new Error('Enter the expected values (one per category, in ascending order of the category codes).');
  const blocks: OutputBlock[] = [];
  const testRows: Cell[][] = [];
  const foot: string[] = [];
  const interp: string[] = [];
  const apa: string[] = [];
  let note = '';
  vs.forEach((v, vi) => {
    const sel = selectCases(ds, [v.id]);
    if (!note) note = caseNote(ds, selN(sel), selMissing(ds, sel));
    const cats = categoriesOf(ds, v, sel.rows);
    if (cats.length < 2) throw new Error(cats.length === 0 ? `${v.name} has no valid values among the selected cases.` : `${v.name} has only one category (${valueText(v, cats[0])}) among the valid cases; the chi-square test needs at least two.`);
    const col = ds.columns[v.id];
    const obs = cats.map(() => 0);
    sel.rows.forEach((r, k) => {
      obs[cats.findIndex((c) => sameValue(c, col[r]))] += sel.weights[k];
    });
    if (props && props.length !== cats.length) throw new Error(`${v.name} has ${cats.length} categories (${cats.map((c) => valueText(v, c)).join(', ')}), but ${props.length} expected values were given.`);
    const g = chiSquareGof(obs, props);
    const rows: Cell[][] = cats.map((c, i) => [hcell(valueText(v, c)), cell(g.observed[i], 'int'), cell(g.expected[i], 'dec1'), cell(g.residual[i], 'dec1')]);
    rows.push([hcell('Total', { bold: true }), cell(g.N, 'int', { bold: true }), blank(), blank()]);
    blocks.push(tableBlock({ title: vlabel(v), header: [[hcell(''), hcell('Observed N'), hcell('Expected N'), hcell('Residual')]], rows, ruleBefore: [rows.length - 1] }));
    const mark = String.fromCharCode(97 + vi);
    foot.push(`${mark}. ${g.cellsBelow5} cells (${((100 * g.cellsBelow5) / cats.length).toFixed(1)}%) have expected frequencies less than 5. The minimum expected cell frequency is ${g.minExpected.toFixed(1)}.`);
    testRows.push([hcell(v.name), cell(g.chiSquare, 'dec3', { mark }), cell(g.df, 'int'), pcell(g.p)]);
    const w = Math.sqrt(g.chiSquare / g.N);
    const devs = cats.map((c, i) => ({ c, d: g.residual[i] })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    const top = devs[0];
    interp.push(
      g.p < 0.05
        ? `The distribution of ${vprose(v)} differs significantly from the ${custom ? 'specified' : 'equal'} expected proportions (${apaP(g.p)}; Cohen's w = ${apaNum(w)}, ${labelR(w)}). The largest discrepancy is for "${valueText(v, top.c)}", with ${fmtN(Math.round(Math.abs(top.d) * 10) / 10)} ${top.d > 0 ? 'more' : 'fewer'} cases than expected.`
        : `The distribution of ${vprose(v)} is consistent with the ${custom ? 'specified' : 'equal'} expected proportions (${apaP(g.p)}; Cohen's w = ${apaNum(w)}).`,
    );
    apa.push(`A chi-square goodness-of-fit test indicated that ${vprose(v)} ${g.p < 0.05 ? 'differed significantly from' : 'did not differ significantly from'} the expected distribution, χ²(${g.df}, N = ${fmtN(Math.round(g.N))}) = ${apaNum(g.chiSquare)}, ${apaP(g.p)}.`);
    if ((100 * g.cellsBelow5) / cats.length > 20) blocks.push(text('warning', `${v.name}: ${g.cellsBelow5} categories have expected frequencies below 5, so the chi-square approximation may be unreliable. Combine rare categories if that makes sense substantively.`));
  });
  blocks.push(tableBlock({ title: 'Test Statistics', header: [[hcell(''), hcell('Chi-Square'), hcell('df'), hcell('Asymp. Sig.')]], rows: testRows, footnotes: foot }));
  blocks.push(text('interpretation', interp.join(' ') + " Cohen's w of .1, .3 and .5 are conventionally small, medium and large effects (Cohen, 1988)."));
  blocks.push(text('apa', apa.join(' ')));
  const syntax = `NPAR TESTS\n  /CHISQUARE=${vs.map((v) => v.name).join(' ')}\n  /EXPECTED=${custom ? props!.join(' ') : 'EQUAL'}\n  /MISSING ANALYSIS.`;
  return item('chisquare-gof', 'Chi-Square Test', ds, blocks, syntax, note);
}

export const chiSquareGofProc: ProcedureDef = {
  id: 'chisquare-gof',
  menu: 'Nonparametric Tests',
  title: 'Chi-Square (goodness of fit)',
  description: 'Test whether the categories of one variable occur in the proportions you expect (equal, or known population shares).',
  guidance: 'For custom proportions, enter one value per category in ascending order of the category codes, e.g. census shares "0.48 0.52".',
  slots: [{ key: 'variables', label: 'Test Variable List', min: 1, max: Infinity, measures: ['nominal', 'ordinal'] }],
  options: [
    {
      key: 'expected',
      label: 'Expected values',
      type: 'select',
      default: 'equal',
      choices: [
        { value: 'equal', label: 'All categories equal' },
        { value: 'values', label: 'Values (proportions or counts)' },
      ],
    },
    { key: 'expectedValues', label: 'Expected values (in category order)', type: 'text', default: '', placeholder: 'e.g. 20 30 50' },
  ],
  validate: (_ds, _s, opts) => {
    if (opts.expected !== 'values') return null;
    const t = typeof opts.expectedValues === 'string' ? opts.expectedValues.trim() : '';
    if (!t) return 'Enter the expected values, one per category.';
    try {
      parseNumberList(t, 'Expected values', 0, Infinity, true);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  },
  run: runGof,
};

// ---------------------------------------------------------------------------------------------
// Binomial
// ---------------------------------------------------------------------------------------------

function runBinomial(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (!vs.length) throw new Error('Choose at least one test variable.');
  const p0 = optNum(opts, 'testProp', 0.5);
  if (!(p0 > 0 && p0 < 1)) throw new Error('The test proportion must be between 0 and 1.');
  const useCut = optStr(opts, 'dichotomy', 'data') === 'cut';
  const cut = optNum(opts, 'cutPoint', NaN);
  if (useCut && !Number.isFinite(cut)) throw new Error('Enter a cut point.');
  const rows: Cell[][] = [];
  const interp: string[] = [];
  const apa: string[] = [];
  let note = '';
  let anyOneTailed = false;
  vs.forEach((v) => {
    const sel = selectCases(ds, [v.id]);
    if (!note) note = caseNote(ds, selN(sel), selMissing(ds, sel));
    const col = ds.columns[v.id];
    let n1 = 0;
    let n2 = 0;
    let lab1: string;
    let lab2: string;
    if (useCut) {
      if (v.type !== 'numeric') throw new Error(`A cut point needs numeric variables; ${v.name} is a string variable.`);
      sel.rows.forEach((r, k) => ((col[r] as number) <= cut ? (n1 += sel.weights[k]) : (n2 += sel.weights[k])));
      lab1 = `<= ${cut}`;
      lab2 = `> ${cut}`;
    } else {
      const cats = categoriesOf(ds, v, sel.rows);
      if (cats.length !== 2) throw new Error(cats.length === 0 ? `${v.name} has no valid values among the selected cases.` : `${v.name} has ${cats.length} distinct value${cats.length === 1 ? '' : 's'} among valid cases. The binomial test needs exactly two${cats.length > 2 ? '; use a cut point to split a variable with more values' : ''}.`);
      // SPSS: the first value encountered in the data defines group 1.
      const firstVal = col[sel.rows[0]];
      const g1 = cats.find((c) => sameValue(c, firstVal))!;
      const g2 = cats.find((c) => !sameValue(c, firstVal))!;
      sel.rows.forEach((r, k) => (sameValue(col[r], g1) ? (n1 += sel.weights[k]) : (n2 += sel.weights[k])));
      lab1 = valueText(v, g1);
      lab2 = valueText(v, g2);
    }
    if (n1 + n2 < 1) throw new Error(`${v.name}: no valid cases.`);
    const b = binomialTest(n1, n2, p0);
    if (b.tails === 1) anyOneTailed = true;
    rows.push([hcell(vlabel(v), { rowSpan: 3 }), hcell('Group 1'), hcell(lab1), cell(n1, 'int'), cell(b.observedProp, 'dec2'), cell(p0, 'dec2'), cell(b.p, 'p', b.p < 0.05 ? { tone: 'good', mark: b.tails === 1 ? 'a' : undefined } : b.tails === 1 ? { mark: 'a' } : {})]);
    rows.push([hcell('Group 2'), hcell(lab2), cell(n2, 'int'), cell(1 - b.observedProp, 'dec2'), blank(), blank()]);
    rows.push([hcell('Total', { colSpan: 2, bold: true }), cell(n1 + n2, 'int', { bold: true }), cell(1, 'dec2'), blank(), blank()]);
    const obsPct = (100 * b.observedProp).toFixed(1);
    interp.push(
      b.p < 0.05
        ? `The share of ${vprose(v)} in "${lab1}" (${obsPct}%) is significantly ${b.observedProp > p0 ? 'higher' : 'lower'} than the test proportion of ${(100 * p0).toFixed(1)}% (${apaP(b.p)}, exact ${b.tails === 1 ? 'one' : 'two'}-tailed).`
        : `The share of ${vprose(v)} in "${lab1}" (${obsPct}%) does not differ significantly from ${(100 * p0).toFixed(1)}% (${apaP(b.p)}, exact ${b.tails === 1 ? 'one' : 'two'}-tailed).`,
    );
    apa.push(`An exact binomial test showed that the proportion of "${lab1}" responses (${obsPct}%, n = ${fmtN(Math.round(n1))} of ${fmtN(Math.round(n1 + n2))}) ${b.p < 0.05 ? 'differed significantly' : 'did not differ significantly'} from ${p0}, ${apaP(b.p)}.`);
    if (!Number.isInteger(n1) || !Number.isInteger(n2)) interp.push(`${v.name}: weighted counts were rounded to whole numbers for the exact test.`);
  });
  const blocks: OutputBlock[] = [
    tableBlock({
      title: 'Binomial Test',
      header: [[hcell('', { colSpan: 2 }), hcell('Category'), hcell('N'), hcell('Observed Prop.'), hcell('Test Prop.'), hcell(anyOneTailed ? 'Exact Sig.' : 'Exact Sig. (2-tailed)')]],
      rows,
      stubColumns: 2,
      footnotes: anyOneTailed ? ['a. Exact one-tailed significance in the direction of the observed proportion (the test proportion is not .50, as in SPSS).'] : undefined,
    }),
    text('interpretation', interp.join(' ')),
    text('apa', apa.join(' ')),
  ];
  const syntax = `NPAR TESTS\n  /BINOMIAL (${p0})=${vs.map((v) => v.name).join(' ')}${useCut ? ` (${cut})` : ''}\n  /MISSING ANALYSIS.`;
  return item('binomial', 'Binomial Test', ds, blocks, syntax, note);
}

export const binomialProc: ProcedureDef = {
  id: 'binomial',
  menu: 'Nonparametric Tests',
  title: 'Binomial',
  description: 'Test whether the share of cases in one of two categories differs from a given proportion.',
  guidance: 'Group 1 is the category of the first valid case in the file (as in SPSS). With a test proportion other than .50 the significance is one-tailed.',
  slots: [{ key: 'variables', label: 'Test Variable List', min: 1, max: Infinity }],
  options: [
    { key: 'testProp', label: 'Test proportion', type: 'number', default: 0.5, min: 0.001, max: 0.999, step: 0.01 },
    {
      key: 'dichotomy',
      label: 'Define dichotomy',
      type: 'select',
      default: 'data',
      choices: [
        { value: 'data', label: 'Get from data (two values)' },
        { value: 'cut', label: 'Cut point (<= cut point is group 1)' },
      ],
    },
    { key: 'cutPoint', label: 'Cut point', type: 'number', default: 0, step: 0.5 },
  ],
  run: runBinomial,
};

// ---------------------------------------------------------------------------------------------
// Mann-Whitney U
// ---------------------------------------------------------------------------------------------

function runMannWhitney(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (!vs.length) throw new Error('Choose at least one test variable.');
  vs.forEach((v) => requireNumeric(v, 'Test variables'));
  const gv = one(ds, slots, 'group', 'grouping variable');
  const res = vs.map((v) => {
    const sel = selectCases(ds, [v.id, gv.id]);
    const g = twoGroups(ds, gv, sel, opts.groups, null);
    const wa = Float64Array.from(g.a.weights);
    const wb = Float64Array.from(g.b.weights);
    if (!g.a.rows.length || !g.b.rows.length) throw new Error(`${v.name}: the group "${!g.a.rows.length ? g.labelA : g.labelB}" of ${gv.name} has no valid cases. Check the two values chosen under "Groups".`);
    const r = mannWhitney(numericValues(ds, v, g.a.rows), wa, numericValues(ds, v, g.b.rows), wb);
    if (!Number.isFinite(r.z)) throw new Error(`${v.name} has the same value for every case in the two groups, so the test cannot be computed.`);
    return { v, g, sel, r };
  });
  const blocks: OutputBlock[] = [];
  const rankRows: Cell[][] = [];
  res.forEach(({ v, g, r }) => {
    rankRows.push([hcell(vlabel(v), { rowSpan: 3 }), hcell(g.labelA), cell(r.n1, 'int'), cell(r.meanRank1, 'dec2'), cell(r.sumRank1, 'dec2')]);
    rankRows.push([hcell(g.labelB), cell(r.n2, 'int'), cell(r.meanRank2, 'dec2'), cell(r.sumRank2, 'dec2')]);
    rankRows.push([hcell('Total', { bold: true }), cell(r.n1 + r.n2, 'int', { bold: true }), blank(), blank()]);
  });
  blocks.push(tableBlock({ title: 'Ranks', header: [[hcell(''), hcell(gv.name), hcell('N'), hcell('Mean Rank'), hcell('Sum of Ranks')]], rows: rankRows, stubColumns: 2 }));
  const anyExact = res.some(({ r }) => r.exactP !== undefined);
  const stat = (label: string, f: (r: (typeof res)[number]['r']) => Cell): Cell[] => [hcell(label), ...res.map(({ r }) => f(r))];
  const tRows: Cell[][] = [
    stat('Mann-Whitney U', (r) => cell(r.U, 'dec3')),
    stat('Wilcoxon W', (r) => cell(r.W, 'dec3')),
    stat('Z', (r) => cell(r.z, 'dec3')),
    stat('Asymp. Sig. (2-tailed)', (r) => pcell(r.p)),
  ];
  if (anyExact) tRows.push(stat('Exact Sig. [2*(1-tailed Sig.)]', (r) => (r.exactP !== undefined ? cell(r.exactP, 'p', { mark: 'b' }) : blank())));
  tRows.push(stat('Effect size r = |Z| / √N', (r) => cell(r.r, 'r')));
  blocks.push(
    tableBlock({
      title: 'Test Statistics',
      subtitle: `Grouping Variable: ${vlabel(gv)}`,
      header: [[hcell(''), ...res.map(({ v }) => hcell(v.name))]],
      rows: tRows,
      footnotes: ['Z is corrected for ties; no continuity correction (as in SPSS).', ...(anyExact ? ['b. Not corrected for ties.'] : [])],
    }),
  );
  const interp: string[] = [];
  const apa: string[] = [];
  res.forEach(({ v, g, r }) => {
    const p = r.p;
    const hi = r.meanRank1 > r.meanRank2 ? g.labelA : g.labelB;
    const lo = r.meanRank1 > r.meanRank2 ? g.labelB : g.labelA;
    interp.push(
      p < 0.05
        ? `The "${hi}" group tended to score higher on ${vprose(v)} than the "${lo}" group (mean ranks ${apaNum(Math.max(r.meanRank1, r.meanRank2))} vs ${apaNum(Math.min(r.meanRank1, r.meanRank2))}; U = ${apaNum(r.U)}, ${apaP(p)}). The effect is ${labelR(r.r)} (r = ${apaNum(r.r, 2, true)}).`
        : `The distributions of ${vprose(v)} do not differ significantly between ${g.labelA} and ${g.labelB} (U = ${apaNum(r.U)}, ${apaP(p)}, r = ${apaNum(r.r, 2, true)}).`,
    );
    apa.push(`A Mann-Whitney U test indicated that ${vprose(v)} ${p < 0.05 ? 'was significantly higher' : 'did not differ significantly'} ${p < 0.05 ? `for ${hi} (mean rank = ${apaNum(Math.max(r.meanRank1, r.meanRank2))}) than for ${lo} (mean rank = ${apaNum(Math.min(r.meanRank1, r.meanRank2))})` : `between ${g.labelA} and ${g.labelB}`}, U = ${apaNum(r.U)}, z = ${apaNum(r.z)}, ${apaP(p)}, r = ${apaNum(r.r, 2, true)}.`);
  });
  blocks.push(text('interpretation', interp.join(' ') + ` ${COHEN_NOTE}`));
  blocks.push(text('apa', apa.join(' ')));
  const r0 = res[0];
  const syntax = `NPAR TESTS\n  /M-W=${vs.map((v) => v.name).join(' ')} BY ${gv.name}${r0.g.defineSyntax}\n  /MISSING ANALYSIS.`;
  return item('mann-whitney', 'Mann-Whitney Test', ds, blocks, syntax, caseNote(ds, r0.r.n1 + r0.r.n2, selMissing(ds, r0.sel)));
}

export const mannWhitneyProc: ProcedureDef = {
  id: 'mann-whitney',
  menu: 'Nonparametric Tests',
  title: 'Mann-Whitney U (2 independent samples)',
  description: 'Compare two groups on an ordinal or skewed scale variable without assuming normal distributions.',
  slots: [
    { key: 'variables', label: 'Test Variable List', min: 1, max: Infinity, types: ['numeric'], measures: ['ordinal', 'scale'] },
    { key: 'group', label: 'Grouping Variable', min: 1, max: 1 },
  ],
  options: [{ key: 'groups', label: 'Groups', type: 'groupPair', slot: 'group' }],
  validate: (_ds, _s, opts) => {
    const g = opts.groups;
    return !Array.isArray(g) || g[0] === null || g[1] === null || g[0] === undefined || g[1] === undefined || g[0] === '' || g[1] === '' ? 'Define the two groups to compare.' : null;
  },
  run: runMannWhitney,
};

// ---------------------------------------------------------------------------------------------
// Wilcoxon signed-rank
// ---------------------------------------------------------------------------------------------

function runWilcoxon(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const first = vars(ds, slots, 'first');
  const second = vars(ds, slots, 'second');
  if (!first.length) throw new Error('Choose at least one pair of variables.');
  if (first.length !== second.length) throw new Error(`The two lists must have the same length (${first.length} vs ${second.length}).`);
  [...first, ...second].forEach((v) => requireNumeric(v, 'Paired variables'));
  const res = first.map((a, i) => {
    const b = second[i];
    const sel = selectCases(ds, [a.id, b.id]);
    if (selN(sel) < 1) throw new Error(`${a.name} - ${b.name}: no cases with both values.`);
    const r = wilcoxonSignedRank(numericValues(ds, a, sel.rows), numericValues(ds, b, sel.rows), sel.weights);
    if (!Number.isFinite(r.z)) throw new Error(`${a.name} and ${b.name} are equal for every case (all differences are zero), so the test cannot be computed.`);
    return { a, b, sel, r };
  });
  const blocks: OutputBlock[] = [];
  const rows: Cell[][] = [];
  const foot: string[] = [];
  res.forEach(({ a, b, r }, i) => {
    const m = (k: number) => String.fromCharCode(97 + 3 * i + k);
    rows.push([hcell(`${b.name} - ${a.name}`, { rowSpan: 4 }), hcell('Negative Ranks'), cell(r.nNeg, 'int', { mark: m(0) }), cell(r.meanRankNeg, 'dec2'), cell(r.sumRankNeg, 'dec2')]);
    rows.push([hcell('Positive Ranks'), cell(r.nPos, 'int', { mark: m(1) }), cell(r.meanRankPos, 'dec2'), cell(r.sumRankPos, 'dec2')]);
    rows.push([hcell('Ties'), cell(r.nTies, 'int', { mark: m(2) }), blank(), blank()]);
    rows.push([hcell('Total', { bold: true }), cell(r.nNeg + r.nPos + r.nTies, 'int', { bold: true }), blank(), blank()]);
    foot.push(`${m(0)}. ${b.name} < ${a.name}`, `${m(1)}. ${b.name} > ${a.name}`, `${m(2)}. ${b.name} = ${a.name}`);
  });
  blocks.push(tableBlock({ title: 'Ranks', header: [[hcell('', { colSpan: 2 }), hcell('N'), hcell('Mean Rank'), hcell('Sum of Ranks')]], rows, stubColumns: 2, footnotes: foot }));
  const anyExact = res.some(({ r }) => r.exactP !== undefined);
  const basedKinds = [...new Set(res.map(({ r }) => r.basedOn))];
  const basedMark = (k: string) => String.fromCharCode(98 + basedKinds.indexOf(k as 'positive'));
  blocks.push(
    tableBlock({
      title: 'Test Statistics',
      header: [[hcell(''), ...res.map(({ a, b }) => hcell(`${b.name} - ${a.name}`))]],
      rows: [
        [hcell('Z'), ...res.map(({ r }) => cell(r.z, 'dec3', { mark: basedMark(r.basedOn) }))],
        [hcell('Asymp. Sig. (2-tailed)'), ...res.map(({ r }) => pcell(r.p))],
        ...(anyExact ? [[hcell('Exact Sig. (2-tailed)'), ...res.map(({ r }) => (r.exactP !== undefined ? pcell(r.exactP) : blank()))]] : []),
        [hcell('Effect size r = |Z| / √N'), ...res.map(({ r }) => cell(r.r, 'r'))],
      ],
      footnotes: ['a. Wilcoxon Signed Ranks Test', ...basedKinds.map((k) => `${basedMark(k)}. Based on ${k} ranks.`), 'Z is corrected for ties; zero differences are dropped. N for r counts all pairs.'],
    }),
  );
  const interp: string[] = [];
  const apa: string[] = [];
  res.forEach(({ a, b, r }) => {
    const up = r.sumRankPos > r.sumRankNeg;
    interp.push(
      r.p < 0.05
        ? `${vprose(b)} tended to be ${up ? 'higher' : 'lower'} than ${vprose(a)}: ${fmtN(up ? r.nPos : r.nNeg)} cases went ${up ? 'up' : 'down'}, ${fmtN(up ? r.nNeg : r.nPos)} went ${up ? 'down' : 'up'} and ${fmtN(r.nTies)} did not change (z = ${apaNum(r.z)}, ${apaP(r.p)}; r = ${apaNum(r.r, 2, true)}, ${labelR(r.r)}).`
        : `There is no significant difference between ${vprose(a)} and ${vprose(b)} (z = ${apaNum(r.z)}, ${apaP(r.p)}; ${fmtN(r.nPos)} higher, ${fmtN(r.nNeg)} lower, ${fmtN(r.nTies)} tied).`,
    );
    apa.push(`A Wilcoxon signed-rank test indicated that ${vprose(b)} ${r.p < 0.05 ? `was significantly ${up ? 'higher' : 'lower'} than` : 'did not differ significantly from'} ${vprose(a)}, z = ${apaNum(r.z)}, ${apaP(r.p)}, r = ${apaNum(r.r, 2, true)}.`);
  });
  blocks.push(text('interpretation', interp.join(' ') + ` ${COHEN_NOTE}`));
  blocks.push(text('apa', apa.join(' ')));
  const syntax = `NPAR TESTS\n  /WILCOXON=${first.map((v) => v.name).join(' ')} WITH ${second.map((v) => v.name).join(' ')} (PAIRED)\n  /MISSING ANALYSIS.`;
  const r0 = res[0];
  return item('wilcoxon', 'Wilcoxon Signed Ranks Test', ds, blocks, syntax, caseNote(ds, selN(r0.sel), selMissing(ds, r0.sel)));
}

export const wilcoxonProc: ProcedureDef = {
  id: 'wilcoxon',
  menu: 'Nonparametric Tests',
  title: 'Wilcoxon Signed-Rank (2 related samples)',
  description: 'Compare two related measurements (before and after, two ratings by the same person) without assuming normality.',
  guidance: 'The i-th variable of the first list is paired with the i-th of the second. Differences are computed as second minus first, as in SPSS.',
  slots: [
    { key: 'first', label: 'Variable 1', min: 1, max: Infinity, types: ['numeric'], measures: ['ordinal', 'scale'] },
    { key: 'second', label: 'Variable 2', min: 1, max: Infinity, types: ['numeric'], measures: ['ordinal', 'scale'] },
  ],
  options: [],
  validate: (_ds, slots) => ((slots.first ?? []).length !== (slots.second ?? []).length ? 'Variable 1 and Variable 2 need the same number of variables.' : null),
  run: runWilcoxon,
};

// ---------------------------------------------------------------------------------------------
// Kruskal-Wallis
// ---------------------------------------------------------------------------------------------

function runKruskal(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (!vs.length) throw new Error('Choose at least one test variable.');
  vs.forEach((v) => requireNumeric(v, 'Test variables'));
  const gv = one(ds, slots, 'group', 'grouping variable');
  const blocks: OutputBlock[] = [];
  const rankRows: Cell[][] = [];
  const results = vs.map((v) => {
    const sel = selectCases(ds, [v.id, gv.id]);
    const cats = categoriesOf(ds, gv, sel.rows);
    if (cats.length < 2) throw new Error(cats.length === 0 ? `${v.name} has no valid values in any group of ${gv.name} among the selected cases.` : `Grouping variable ${gv.name} has only one group (${valueText(gv, cats[0])}) among valid cases; at least two are needed.`);
    const gcol = ds.columns[gv.id];
    const groups = cats.map((c) => {
      const idx: number[] = [];
      sel.rows.forEach((r, k) => sameValue(gcol[r], c) && idx.push(k));
      return { x: numericValues(ds, v, idx.map((k) => sel.rows[k])), w: Float64Array.from(idx.map((k) => sel.weights[k])) };
    });
    const r = kruskalWallis(groups);
    if (!Number.isFinite(r.H)) throw new Error(`${v.name} has the same value for every case, so the Kruskal-Wallis test cannot be computed.`);
    return { v, sel, cats, r };
  });
  results.forEach(({ v, cats, r }) => {
    cats.forEach((c, i) => rankRows.push([...(i === 0 ? [hcell(vlabel(v), { rowSpan: cats.length + 1 })] : []), hcell(valueText(gv, c)), cell(r.n[i], 'int'), cell(r.meanRanks[i], 'dec2')]));
    rankRows.push([hcell('Total', { bold: true }), cell(r.N, 'int', { bold: true }), blank()]);
  });
  blocks.push(tableBlock({ title: 'Ranks', header: [[hcell(''), hcell(gv.name), hcell('N'), hcell('Mean Rank')]], rows: rankRows, stubColumns: 2 }));
  blocks.push(
    tableBlock({
      title: 'Test Statistics',
      subtitle: `Grouping Variable: ${vlabel(gv)}`,
      header: [[hcell(''), ...results.map(({ v }) => hcell(v.name))]],
      rows: [
        [hcell('Kruskal-Wallis H'), ...results.map(({ r }) => cell(r.H, 'dec3'))],
        [hcell('df'), ...results.map(({ r }) => cell(r.df, 'int'))],
        [hcell('Asymp. Sig.'), ...results.map(({ r }) => pcell(r.p))],
        [hcell('Epsilon-squared (H / (N - 1))'), ...results.map(({ r }) => cell(r.epsilonSq, 'r'))],
      ],
      footnotes: ['a. Kruskal Wallis Test', 'H is corrected for ties.'],
    }),
  );
  const interp: string[] = [];
  const apa: string[] = [];
  for (const { v, cats, r } of results) {
    const order = r.meanRanks.map((m, i) => ({ m, i })).filter((q) => r.n[q.i] > 0).sort((a, b) => b.m - a.m);
    let s = r.p < 0.05
      ? `${vprose(v)} differs significantly between the ${vprose(gv)} groups (H(${r.df}) = ${apaNum(r.H)}, ${apaP(r.p)}; ε² = ${apaNum(r.epsilonSq, 2, true)}, ${labelEta2(r.epsilonSq)}). Scores were highest for ${valueText(gv, cats[order[0].i])} (mean rank ${apaNum(order[0].m)}) and lowest for ${valueText(gv, cats[order[order.length - 1].i])} (mean rank ${apaNum(order[order.length - 1].m)}).`
      : `${vprose(v)} does not differ significantly between the ${vprose(gv)} groups (H(${r.df}) = ${apaNum(r.H)}, ${apaP(r.p)}).`;
    if (optBool(opts, 'dunn', false) && cats.length > 2) {
      const d = dunnTest(r);
      const rows: Cell[][] = d.map((q) => [hcell(`${valueText(gv, cats[q.i])} - ${valueText(gv, cats[q.j])}`), cell(q.diff, 'dec3'), cell(q.se, 'dec3'), cell(q.z, 'dec3'), pcell(q.p), pcell(q.pAdj)]);
      blocks.push(
        tableBlock({
          title: `Pairwise Comparisons of ${gv.name}`,
          subtitle: vlabel(v),
          header: [[hcell('Sample 1 - Sample 2'), hcell('Test Statistic'), hcell('Std. Error'), hcell('Std. Test Statistic'), hcell('Sig.'), hcell('Adj. Sig.', { mark: 'a' })]],
          rows,
          footnotes: ["Dunn's (1964) test on mean ranks, corrected for ties. Each row tests the null hypothesis that the Sample 1 and Sample 2 distributions are the same.", 'a. Significance values have been adjusted by the Bonferroni correction for multiple tests.'],
        }),
      );
      const sig = d.filter((q) => q.pAdj < 0.05).map((q) => `${valueText(gv, cats[q.i])} vs ${valueText(gv, cats[q.j])} (adjusted ${apaP(q.pAdj)})`);
      s += sig.length ? ` Dunn's pairwise tests (Bonferroni-adjusted) show significant differences for ${listProse(sig)}.` : " No pair of groups differs significantly after Bonferroni adjustment (Dunn's test).";
    }
    interp.push(s);
    apa.push(`A Kruskal-Wallis test showed that ${vprose(v)} ${r.p < 0.05 ? 'differed significantly' : 'did not differ significantly'} across ${vprose(gv)} groups, H(${r.df}) = ${apaNum(r.H)}, ${apaP(r.p)}, ε² = ${apaNum(r.epsilonSq, 2, true)}.`);
    const small = cats.filter((_, i) => r.n[i] < 5);
    if (small.length) blocks.push(text('warning', `${v.name}: ${small.length} group${small.length === 1 ? ' has' : 's have'} fewer than 5 cases (${small.map((c) => valueText(gv, c)).join(', ')}); the chi-square approximation for H is rough with such small groups.`));
  }
  blocks.push(text('interpretation', interp.join(' ') + ' Epsilon-squared is interpreted with the eta-squared conventions (.01 small, .06 medium, .14 large; Cohen, 1988).'));
  blocks.push(text('apa', apa.join(' ')));
  const r0 = results[0];
  const numericCats = r0.cats.filter((c): c is number => typeof c === 'number');
  const range = numericCats.length === r0.cats.length && numericCats.length ? `(${Math.min(...numericCats)} ${Math.max(...numericCats)})` : `(${r0.cats.map(syntaxValue).join(' ')})`;
  const syntax = `NPAR TESTS\n  /K-W=${vs.map((v) => v.name).join(' ')} BY ${gv.name}${range}\n  /MISSING ANALYSIS.`;
  return item('kruskal-wallis', 'Kruskal-Wallis Test', ds, blocks, syntax, caseNote(ds, r0.r.N, selMissing(ds, r0.sel)));
}

export const kruskalProc: ProcedureDef = {
  id: 'kruskal-wallis',
  menu: 'Nonparametric Tests',
  title: 'Kruskal-Wallis H (k independent samples)',
  description: 'Compare three or more groups on an ordinal or skewed scale variable without assuming normality.',
  slots: [
    { key: 'variables', label: 'Test Variable List', min: 1, max: Infinity, types: ['numeric'], measures: ['ordinal', 'scale'] },
    { key: 'group', label: 'Grouping Variable', min: 1, max: 1, measures: ['nominal', 'ordinal'] },
  ],
  options: [{ key: 'dunn', label: "Pairwise comparisons (Dunn's test, Bonferroni-adjusted)", type: 'checkbox', default: false }],
  run: runKruskal,
};

// ---------------------------------------------------------------------------------------------
// Friedman
// ---------------------------------------------------------------------------------------------

function runFriedman(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (vs.length < 2) throw new Error('Choose at least two variables (the repeated measurements).');
  vs.forEach((v) => requireNumeric(v, 'Test variables'));
  const sel = selectCases(ds, vs.map((v) => v.id));
  if (selN(sel) < 2) throw new Error('At least two cases with valid values on every variable are needed.');
  const cols = vs.map((v) => numericValues(ds, v, sel.rows));
  const r = friedman(cols, sel.weights);
  if (!Number.isFinite(r.chiSquare)) throw new Error('Every case gives the same value on all variables, so the Friedman test cannot be computed.');
  const blocks: OutputBlock[] = [
    tableBlock({ title: 'Ranks', header: [[hcell(''), hcell('Mean Rank')]], rows: vs.map((v, i) => [hcell(vlabel(v)), cell(r.meanRanks[i], 'dec2')]) }),
    tableBlock({
      title: 'Test Statistics',
      header: [[hcell(''), hcell('Value')]],
      rows: [
        [hcell('N'), cell(r.N, 'int')],
        [hcell("Kendall's W", { mark: 'a' }), cell(r.kendallW, 'r')],
        [hcell('Chi-Square'), cell(r.chiSquare, 'dec3')],
        [hcell('df'), cell(r.df, 'int')],
        [hcell('Asymp. Sig.'), pcell(r.p)],
      ],
      footnotes: ["a. Kendall's Coefficient of Concordance (W = chi-square / (N (k - 1)))", 'Friedman Test; chi-square is corrected for ties.'],
    }),
  ];
  const order = r.meanRanks.map((m, i) => ({ m, i })).sort((a, b) => b.m - a.m);
  blocks.push(
    text(
      'interpretation',
      (r.p < 0.05
        ? `The ${vs.length} measures differ significantly (χ²(${r.df}) = ${apaNum(r.chiSquare)}, ${apaP(r.p)}). ${vprose(vs[order[0].i])} ranked highest on average (mean rank ${apaNum(order[0].m)}) and ${vprose(vs[order[order.length - 1].i])} lowest (${apaNum(order[order.length - 1].m)}). Kendall's W = ${apaNum(r.kendallW, 2, true)} indicates ${labelW(r.kendallW)} agreement among cases in how they rank the measures.`
        : `The ${vs.length} measures do not differ significantly (χ²(${r.df}) = ${apaNum(r.chiSquare)}, ${apaP(r.p)}; Kendall's W = ${apaNum(r.kendallW, 2, true)}).`) +
        " Kendall's W is judged with Cohen's r conventions (.1 weak, .3 moderate, .5 strong).",
    ),
  );
  blocks.push(text('apa', `A Friedman test ${r.p < 0.05 ? 'indicated significant differences' : 'did not indicate significant differences'} among ${listProse(vs.map(vprose))}, χ²(${r.df}, N = ${fmtN(Math.round(r.N))}) = ${apaNum(r.chiSquare)}, ${apaP(r.p)}, Kendall's W = ${apaNum(r.kendallW, 2, true)}.`));
  if (r.N < 10) blocks.push(text('warning', `Only ${fmtN(r.N)} complete cases: the chi-square approximation for the Friedman test is rough with so few cases.`));
  const syntax = `NPAR TESTS\n  /FRIEDMAN=${vs.map((v) => v.name).join(' ')}\n  /KENDALL=${vs.map((v) => v.name).join(' ')}\n  /MISSING LISTWISE.`;
  return item('friedman', 'Friedman Test', ds, blocks, syntax, caseNote(ds, selN(sel), selMissing(ds, sel), 'complete cases on all variables'));
}

export const friedmanProc: ProcedureDef = {
  id: 'friedman',
  menu: 'Nonparametric Tests',
  title: 'Friedman (k related samples)',
  description: "Compare three or more related measurements (e.g. ratings of several institutions by the same respondents), with Kendall's W.",
  slots: [{ key: 'variables', label: 'Test Variables', min: 2, max: Infinity, types: ['numeric'], measures: ['ordinal', 'scale'] }],
  options: [],
  run: runFriedman,
};

