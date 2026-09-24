// Analyze > Correlate: Bivariate (SPSS CORRELATIONS / NONPAR CORR) and Partial (SPSS PARTIAL CORR).

import { selectCases } from '../../core/data';
import type { Dataset, Variable } from '../../core/types';
import type { OutputBlock, OutputTable } from '../../core/output';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import { kendallTauB, partialCorrelations, pearson, spearman, type CorrResult } from '../../lib/stats/correlation';
import { moments } from '../../lib/stats/util';
import {
  apaNum,
  apaP,
  blank,
  caseNote,
  cell,
  COHEN_NOTE,
  decFmt,
  fmtN,
  hcell,
  item,
  labelR,
  listProse,
  numericValues,
  optBool,
  optStr,
  requireNumeric,
  selN,
  tableBlock,
  text,
  vars,
  vlabel,
  vprose,
  type Cell,
  selMissing,
  allFinite,
} from './common';

type Method = 'pearson' | 'spearman' | 'kendall';

const METHOD_LABEL: Record<Method, { row: string; name: string; symbol: string }> = {
  pearson: { row: 'Pearson Correlation', name: "Pearson's r", symbol: 'r' },
  kendall: { row: 'Correlation Coefficient', name: "Kendall's tau_b", symbol: 'τb' },
  spearman: { row: 'Correlation Coefficient', name: "Spearman's rho", symbol: 'rs' },
};

function compute(method: Method, x: Float64Array, y: Float64Array, w: Float64Array): CorrResult {
  if (method === 'pearson') return pearson(x, y, w);
  if (method === 'spearman') return spearman(x, y, w);
  return kendallTauB(x, y, w);
}

interface PairRes {
  res: CorrResult;
  constant: boolean;
}

function runCorrelations(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  if (vs.length < 2) throw new Error('Choose at least two variables.');
  vs.forEach((v) => requireNumeric(v, 'Correlation variables'));
  const methods = (['pearson', 'kendall', 'spearman'] as Method[]).filter((m) => optBool(opts, m, m === 'pearson'));
  if (!methods.length) throw new Error("Choose at least one correlation coefficient (Pearson, Kendall's tau-b or Spearman).");
  const oneTailed = optStr(opts, 'tails', 'two') === 'one';
  const flag = optBool(opts, 'flag', true);
  const listwise = optStr(opts, 'missing', 'pairwise') === 'listwise';
  const selAll = selectCases(ds, vs.map((v) => v.id));
  const k = vs.length;
  const pairCache = new Map<string, { x: Float64Array; y: Float64Array; w: Float64Array }>();
  const dataFor = (i: number, j: number) => {
    const key = `${i},${j}`;
    let d = pairCache.get(key);
    if (!d) {
      const sel = listwise ? selAll : selectCases(ds, [vs[i].id, vs[j].id]);
      d = { x: numericValues(ds, vs[i], sel.rows), y: numericValues(ds, vs[j], sel.rows), w: sel.weights };
      pairCache.set(key, d);
    }
    return d;
  };
  const results = new Map<Method, PairRes[][]>();
  for (const m of methods) {
    const mat: PairRes[][] = Array.from({ length: k }, () => new Array(k));
    for (let i = 0; i < k; i++)
      for (let j = i; j < k; j++) {
        const d = dataFor(i, j);
        let pr: PairRes;
        const W = d.w.reduce((a, b) => a + b, 0);
        if (i === j) pr = { res: { r: 1, N: W, p2: NaN, p1: NaN }, constant: false };
        else {
          const constant = d.x.length < 2 || d.x.every((v) => v === d.x[0]) || d.y.every((v) => v === d.y[0]);
          pr = constant ? { res: { r: NaN, N: W, p2: NaN, p1: NaN }, constant } : { res: compute(m, d.x, d.y, d.w), constant };
          // A significance test needs at least 3 cases (df = N - 2 > 0); below that SPSS leaves Sig. blank.
          if (!(W >= MIN_TEST_N)) pr = { res: { ...pr.res, p1: NaN, p2: NaN }, constant: pr.constant };
        }
        mat[i][j] = pr;
        mat[j][i] = pr;
      }
    results.set(m, mat);
  }
  const blocks: OutputBlock[] = [];
  if (optBool(opts, 'descriptives')) {
    blocks.push(
      tableBlock({
        title: 'Descriptive Statistics',
        header: [[hcell(''), hcell('Mean'), hcell('Std. Deviation'), hcell('N')]],
        rows: vs.map((v) => {
          const sel = listwise ? selAll : selectCases(ds, [v.id]);
          const m = moments(numericValues(ds, v, sel.rows), sel.weights);
          return [hcell(vlabel(v)), cell(m.mean, decFmt(v)), cell(m.sd, decFmt(v)), cell(m.W, 'int')];
        }),
      }),
    );
  }
  const sigLabel = oneTailed ? 'Sig. (1-tailed)' : 'Sig. (2-tailed)';
  let any05 = false;
  let any01 = false;
  const pOf = (r: CorrResult) => (oneTailed ? r.p1 : r.p2);
  const matrixRows = (m: Method, withMethodStub: boolean): Cell[][] => {
    const mat = results.get(m)!;
    const rows: Cell[][] = [];
    vs.forEach((v, i) => {
      const lab = METHOD_LABEL[m].row;
      const rRow: Cell[] = [];
      const pRow: Cell[] = [];
      const nRow: Cell[] = [];
      for (let j = 0; j < k; j++) {
        const pr = mat[i][j].res;
        if (i === j) {
          rRow.push(cell(1, m === 'pearson' ? 'r' : 'coef'));
          pRow.push(blank());
        } else {
          const p = pOf(pr);
          let mark: string | undefined;
          if (flag && Number.isFinite(p)) {
            if (p < 0.01) {
              mark = '**';
              any01 = true;
            } else if (p < 0.05) {
              mark = '*';
              any05 = true;
            }
          }
          rRow.push(cell(pr.r, 'r', mark ? { mark } : {}));
          pRow.push(cell(p, 'p', Number.isFinite(p) && p < 0.05 ? { tone: 'good' } : {}));
        }
        nRow.push(cell(pr.N, 'int'));
      }
      const first: Cell[] = [];
      if (withMethodStub && i === 0) first.push(hcell(METHOD_LABEL[m].name, { rowSpan: 3 * k }));
      rows.push([...first, hcell(vlabel(v), { rowSpan: 3 }), hcell(lab), ...rRow]);
      rows.push([hcell(sigLabel), ...pRow]);
      rows.push([hcell('N'), ...nRow]);
    });
    return rows;
  };
  const header = (stub: number): Cell[][] => [[hcell('', { colSpan: stub }), ...vs.map((v) => hcell(vlabel(v)))]];
  const footnotes = () => {
    const f: string[] = [];
    if (any01) f.push(`**. Correlation is significant at the 0.01 level (${oneTailed ? '1' : '2'}-tailed).`);
    if (any05) f.push(`*. Correlation is significant at the 0.05 level (${oneTailed ? '1' : '2'}-tailed).`);
    if (listwise) f.push(`Listwise N = ${fmtN(selN(selAll))}.`);
    return f;
  };
  if (methods.includes('pearson')) {
    const rows = matrixRows('pearson', false);
    const t: OutputTable = { title: 'Correlations', header: header(2), rows, stubColumns: 2, ruleBefore: vs.map((_, i) => 3 * i).slice(1), footnotes: footnotes() };
    blocks.push(tableBlock(t));
  }
  const np = methods.filter((m) => m !== 'pearson');
  if (np.length) {
    any01 = false;
    any05 = false;
    const rows: Cell[][] = [];
    const ruleBefore: number[] = [];
    np.forEach((m) => {
      const r = matrixRows(m, true);
      r.forEach((_, i) => i % 3 === 0 && (rows.length + i) > 0 && ruleBefore.push(rows.length + i));
      rows.push(...r);
    });
    blocks.push(tableBlock({ title: 'Nonparametric Correlations', header: header(3), rows, stubColumns: 3, ruleBefore, footnotes: [...footnotes(), ...(np.includes('kendall') ? ["Kendall's tau_b significance uses the asymptotic standard error under the null hypothesis (as in SPSS CROSSTABS)."] : [])] }));
  }
  if (optBool(opts, 'heatmap') && k >= 2) {
    const m = methods[0];
    const mat = results.get(m)!;
    blocks.push({
      kind: 'chart',
      chart: { type: 'heatmap', title: `${METHOD_LABEL[m].name} correlations`, rowLabels: vs.map((v) => v.name), colLabels: vs.map((v) => v.name), values: mat.map((row) => row.map((p) => (Number.isFinite(p.res.r) ? p.res.r : null))), scale: 'diverging', min: -1, max: 1 },
    });
  }
  // Interpretation: strongest significant correlations for the first method.
  const m0 = methods[0];
  const mat0 = results.get(m0)!;
  const pairs: Array<{ i: number; j: number; r: CorrResult }> = [];
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) pairs.push({ i, j, r: mat0[i][j].res });
  const sig = pairs.filter((p) => pOf(p.r) < 0.05).sort((a, b) => Math.abs(b.r.r) - Math.abs(a.r.r));
  const sym = METHOD_LABEL[m0].symbol;
  const describe = (p: (typeof pairs)[number]) => `${vprose(vs[p.i])} and ${vprose(vs[p.j])} are ${labelR(p.r.r)}ly ${p.r.r > 0 ? 'positively' : 'negatively'} related (${sym} = ${apaNum(p.r.r, 2, true)}, ${apaP(pOf(p.r))}, N = ${fmtN(Math.round(p.r.N))})`.replace('negligiblely', 'negligibly');
  let interp: string;
  if (!pairs.length) interp = 'No correlations could be computed.';
  else if (!sig.length) interp = `None of the ${pairs.length} correlation${pairs.length === 1 ? ' is' : 's are'} statistically significant (${oneTailed ? 'one' : 'two'}-tailed, α = .05).`;
  else {
    const top = sig.slice(0, 5).map(describe);
    interp = `${top.join('; ')}.`;
    if (sig.length > 5) interp += ` ${sig.length - 5} further correlation${sig.length - 5 === 1 ? ' is' : 's are'} also significant.`;
    const pos = sig[0].r.r > 0;
    interp += ` ${pos ? 'A positive' : 'A negative'} correlation means that cases with higher ${vprose(vs[sig[0].i])} tend to have ${pos ? 'higher' : 'lower'} ${vprose(vs[sig[0].j])}; correlation alone does not show which causes which.`;
  }
  if (pairs.some((p) => mat0[p.i][p.j].constant)) interp += ' Some coefficients could not be computed because a variable is constant among the cases used.';
  const tooFew = pairs.filter((p) => !(p.r.N >= MIN_TEST_N));
  if (tooFew.length) interp += ` ${tooFew.length === pairs.length ? (pairs.length === 1 ? 'This correlation' : 'These correlations') : `${tooFew.length} of the correlations`} could not be tested: a significance test needs at least ${MIN_TEST_N} cases with valid values on both variables.`;
  blocks.push(text('interpretation', `${interp} ${COHEN_NOTE}`));
  if (sig.length) {
    const df = (p: (typeof pairs)[number]) => (m0 === 'kendall' ? '' : `(${fmtN(Math.round(p.r.N - 2))})`);
    blocks.push(text('apa', sig.slice(0, 5).map((p) => `${vprose(vs[p.i])} was ${p.r.r > 0 ? 'positively' : 'negatively'} correlated with ${vprose(vs[p.j])}, ${sym}${df(p)} = ${apaNum(p.r.r, 2, true)}, ${apaP(pOf(p.r))}.`).join(' ')));
  } else if (pairs.length === 1 && Number.isFinite(pairs[0].r.r) && Number.isFinite(pOf(pairs[0].r)) && pairs[0].r.N >= MIN_TEST_N) {
    const p = pairs[0];
    blocks.push(text('apa', `${vprose(vs[p.i])} was not significantly correlated with ${vprose(vs[p.j])}, ${sym}${m0 === 'kendall' ? '' : `(${fmtN(Math.round(p.r.N - 2))})`} = ${apaNum(p.r.r, 2, true)}, ${apaP(pOf(p.r))}.`));
  }
  const smallN = pairs.filter((p) => p.r.N < 10);
  if (smallN.length) blocks.push(text('warning', `${smallN.length} correlation${smallN.length === 1 ? ' is' : 's are'} based on fewer than 10 cases and ${smallN.length === 1 ? 'is' : 'are'} very imprecise.`));
  if (methods.includes('pearson')) blocks.push(text('note', "Pearson's r measures linear association between scale variables and is sensitive to outliers; for ordinal items or skewed data, Spearman's rho or Kendall's tau-b is safer."));
  const lines: string[] = [];
  if (methods.includes('pearson')) lines.push(`CORRELATIONS\n  /VARIABLES=${vs.map((v) => v.name).join(' ')}\n  /PRINT=${oneTailed ? 'ONETAIL' : 'TWOTAIL'} ${flag ? 'NOSIG' : 'SIG'}${optBool(opts, 'descriptives') ? '\n  /STATISTICS DESCRIPTIVES' : ''}\n  /MISSING=${listwise ? 'LISTWISE' : 'PAIRWISE'}.`);
  if (np.length) lines.push(`NONPAR CORR\n  /VARIABLES=${vs.map((v) => v.name).join(' ')}\n  /PRINT=${np.length === 2 ? 'BOTH' : np[0] === 'kendall' ? 'KENDALL' : 'SPEARMAN'} ${oneTailed ? 'ONETAIL' : 'TWOTAIL'} ${flag ? 'NOSIG' : 'SIG'}\n  /MISSING=${listwise ? 'LISTWISE' : 'PAIRWISE'}.`);
  const nNote = listwise ? caseNote(ds, selN(selAll), selMissing(ds, selAll), 'listwise deletion') : caseNote(ds, Math.max(...pairs.map((p) => p.r.N)), 0, 'pairwise deletion: each coefficient uses the cases valid on both variables (see N in the table)');
  return item('correlations', 'Correlations', ds, blocks, lines.join('\n'), nNote);
}

/** Fewest (weighted) cases for a significance test of a correlation: df = N - 2 must be positive. */
const MIN_TEST_N = 3;

export const bivariateCorrelations: ProcedureDef = {
  id: 'correlations',
  menu: 'Correlate',
  title: 'Bivariate Correlations',
  description: "Measure how strongly pairs of variables move together: Pearson's r, Spearman's rho, Kendall's tau-b.",
  guidance: 'Pairwise deletion (the SPSS default) uses every case that has both values of a pair, so N can differ between cells of the matrix.',
  slots: [{ key: 'variables', label: 'Variables', min: 2, max: Infinity, types: ['numeric'], measures: ['scale', 'ordinal'] }],
  options: [
    { key: 'pearson', label: 'Pearson', type: 'checkbox', default: true, group: 'Correlation coefficients' },
    { key: 'kendall', label: "Kendall's tau-b", type: 'checkbox', default: false, group: 'Correlation coefficients' },
    { key: 'spearman', label: 'Spearman', type: 'checkbox', default: false, group: 'Correlation coefficients' },
    {
      key: 'tails',
      label: 'Test of significance',
      type: 'select',
      default: 'two',
      choices: [
        { value: 'two', label: 'Two-tailed' },
        { value: 'one', label: 'One-tailed' },
      ],
    },
    { key: 'flag', label: 'Flag significant correlations', type: 'checkbox', default: true },
    { key: 'descriptives', label: 'Means and standard deviations', type: 'checkbox', default: false, group: 'Options' },
    {
      key: 'missing',
      label: 'Missing values',
      type: 'select',
      default: 'pairwise',
      choices: [
        { value: 'pairwise', label: 'Exclude cases pairwise' },
        { value: 'listwise', label: 'Exclude cases listwise' },
      ],
      group: 'Options',
    },
    { key: 'heatmap', label: 'Heatmap of the correlation matrix', type: 'checkbox', default: false, group: 'Options' },
  ],
  run: runCorrelations,
};

// ---------------------------------------------------------------------------------------------
// Partial correlations
// ---------------------------------------------------------------------------------------------

function runPartial(ds: Dataset, slots: SlotValues, opts: OptionValues) {
  const vs = vars(ds, slots, 'variables');
  const cs = vars(ds, slots, 'controls');
  if (vs.length < 2) throw new Error('Choose at least two variables to correlate.');
  if (!cs.length) throw new Error('Choose at least one control variable.');
  [...vs, ...cs].forEach((v) => requireNumeric(v, 'Partial correlation variables'));
  const overlap = vs.find((v) => cs.some((c) => c.id === v.id));
  if (overlap) throw new Error(`${overlap.name} cannot be both an analysis variable and a control variable.`);
  const oneTailed = optStr(opts, 'tails', 'two') === 'one';
  const sel = selectCases(ds, [...vs, ...cs].map((v) => v.id));
  const N = selN(sel);
  if (N - 2 - cs.length < 1) throw new Error(`Not enough complete cases (${fmtN(N)}) for ${cs.length} control variable${cs.length === 1 ? '' : 's'}.`);
  const cols = vs.map((v) => numericValues(ds, v, sel.rows));
  const ctrl = cs.map((v) => numericValues(ds, v, sel.rows));
  for (const [i, c] of [...cols, ...ctrl].entries()) if (c.every((x) => x === c[0])) throw new Error(`${[...vs, ...cs][i].name} is constant among the complete cases, so correlations cannot be computed.`);
  const part = partialCorrelations(cols, ctrl, sel.weights);
  const zeroOrder = optBool(opts, 'zeroOrder', false);
  const zero = zeroOrder ? partialCorrelations([...cols, ...ctrl], [], sel.weights) : null;
  const blocks: OutputBlock[] = [];
  const sigLabel = oneTailed ? 'Significance (1-tailed)' : 'Significance (2-tailed)';
  const rows: Cell[][] = [];
  const ruleBefore: number[] = [];
  const block = (label: string, names: Variable[], r: number[][], p1: number[][], p2: number[][], df: number) => {
    const start = rows.length;
    if (start) ruleBefore.push(start);
    names.forEach((v, i) => {
      rows.push([...(i === 0 ? [hcell(label, { rowSpan: 3 * names.length })] : []), hcell(vlabel(v), { rowSpan: 3 }), hcell('Correlation'), ...names.map((_, j) => cell(r[i][j], 'r')), ...Array(Math.max(0, vs.length + (zeroOrder ? cs.length : 0) - names.length)).fill(blank())]);
      rows.push([hcell(sigLabel), ...names.map((_, j) => (i === j ? blank() : cell(oneTailed ? p1[i][j] : p2[i][j], 'p', (oneTailed ? p1[i][j] : p2[i][j]) < 0.05 ? { tone: 'good' } : {}))), ...Array(Math.max(0, vs.length + (zeroOrder ? cs.length : 0) - names.length)).fill(blank())]);
      rows.push([hcell('df'), ...names.map((_, j) => (i === j ? cell(0, 'int') : cell(df, 'int'))), ...Array(Math.max(0, vs.length + (zeroOrder ? cs.length : 0) - names.length)).fill(blank())]);
    });
  };
  if (zero) block('-none-', [...vs, ...cs], zero.r, zero.p1, zero.p2, zero.df);
  block(cs.map((c) => c.name).join(' & '), vs, part.r, part.p1, part.p2, part.df);
  const colVars = zeroOrder ? [...vs, ...cs] : vs;
  blocks.push(
    tableBlock({
      title: 'Correlations',
      header: [[hcell('Control Variables'), hcell('', { colSpan: 2 }), ...colVars.map((v) => hcell(vlabel(v)))]],
      rows,
      stubColumns: 3,
      ruleBefore,
      footnotes: zero ? ['a. Cells contain zero-order (Pearson) correlations.'] : undefined,
    }),
  );
  // Interpretation: compare partial with zero-order correlation for each pair.
  const zeroFull = partialCorrelations(cols, [], sel.weights);
  const parts: string[] = [];
  const apa: string[] = [];
  const ctrlText = listProse(cs.map(vprose));
  for (let i = 0; i < vs.length; i++)
    for (let j = i + 1; j < vs.length; j++) {
      const r0 = zeroFull.r[i][j];
      const rp = part.r[i][j];
      const pp = oneTailed ? part.p1[i][j] : part.p2[i][j];
      const p0 = oneTailed ? zeroFull.p1[i][j] : zeroFull.p2[i][j];
      const pairName = `${vprose(vs[i])} and ${vprose(vs[j])}`;
      if (!allFinite(r0, rp, pp, p0)) {
        // A variable fully explained by the controls has no variation left: say so, print no statistic.
        parts.push(
          allFinite(r0, p0)
            ? `The correlation between ${pairName} is r = ${apaNum(r0, 2, true)} (${apaP(p0)}) before controlling for ${ctrlText}; the partial correlation cannot be computed because ${ctrlText} ${cs.length === 1 ? 'accounts' : 'account'} for all the variation in one of them.`
            : `The correlation between ${pairName} cannot be computed because one of them has no variation left among the complete cases.`,
        );
        continue;
      }
      let s = `The correlation between ${pairName} is r = ${apaNum(r0, 2, true)} (${apaP(p0)}) before and r = ${apaNum(rp, 2, true)} (${apaP(pp)}) after controlling for ${ctrlText}.`;
      const drop = Math.abs(r0) - Math.abs(rp);
      if (p0 < 0.05 && pp >= 0.05) s += ` The association largely disappears once ${ctrlText} ${cs.length === 1 ? 'is' : 'are'} held constant, consistent with a spurious or mediated relationship.`;
      else if (drop > 0.1 && Math.sign(r0) === Math.sign(rp)) s += ` Part of the association is accounted for by ${ctrlText}, but a ${labelR(rp)} relationship remains.`;
      else if (Math.abs(rp) - Math.abs(r0) > 0.1) s += ` The association becomes stronger after controlling, which suggests ${ctrlText} ${cs.length === 1 ? 'acts' : 'act'} as a suppressor.`;
      else if (Math.sign(r0) !== Math.sign(rp) && Math.abs(rp) > 0.1) s += ' The direction of the association reverses after controlling.';
      else s += ` Controlling for ${ctrlText} changes the association very little.`;
      parts.push(s);
      apa.push(`Controlling for ${ctrlText}, the partial correlation between ${vprose(vs[i])} and ${vprose(vs[j])} was ${pp < 0.05 ? 'significant' : 'not significant'}, r(${fmtN(Math.round(part.df))}) = ${apaNum(rp, 2, true)}, ${apaP(pp)}.`);
    }
  blocks.push(text('interpretation', parts.slice(0, 10).join(' ') + ` ${COHEN_NOTE}`));
  if (apa.length) blocks.push(text('apa', apa.slice(0, 10).join(' ')));
  if (N < 30) blocks.push(text('warning', `Only ${fmtN(N)} complete cases: partial correlations with few cases are imprecise.`));
  const syntax = `PARTIAL CORR\n  /VARIABLES=${vs.map((v) => v.name).join(' ')} BY ${cs.map((v) => v.name).join(' ')}\n  /SIGNIFICANCE=${oneTailed ? 'ONETAIL' : 'TWOTAIL'}${zeroOrder ? '\n  /STATISTICS=CORR' : ''}\n  /MISSING=LISTWISE.`;
  return item('partial-correlations', 'Partial Correlations', ds, blocks, syntax, caseNote(ds, N, selMissing(ds, sel), 'listwise deletion'));
}

export const partialCorrelationsProc: ProcedureDef = {
  id: 'partial-correlations',
  menu: 'Correlate',
  title: 'Partial Correlations',
  description: 'Correlate two or more variables while holding one or more control variables constant (is the association spurious?).',
  slots: [
    { key: 'variables', label: 'Variables', min: 2, max: Infinity, types: ['numeric'], measures: ['scale', 'ordinal'] },
    { key: 'controls', label: 'Controlling for', min: 1, max: Infinity, types: ['numeric'] },
  ],
  options: [
    {
      key: 'tails',
      label: 'Test of significance',
      type: 'select',
      default: 'two',
      choices: [
        { value: 'two', label: 'Two-tailed' },
        { value: 'one', label: 'One-tailed' },
      ],
    },
    { key: 'zeroOrder', label: 'Zero-order correlations', type: 'checkbox', default: false },
  ],
  run: runPartial,
};
