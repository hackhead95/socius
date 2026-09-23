// Linear Regression (SPSS REGRESSION): hierarchical blocks, automatic dummy coding, Enter or
// Stepwise, SPSS tables, residual diagnostics, interpretation and APA text.

import type { Dataset } from '../../core/types';
import type { ProcedureDef, OptionValues, SlotValues } from '../../core/procedure';
import type { Cell, OutputBlock, OutputTable } from '../../core/output';
import { distinctValues, requireVariable } from '../../core/data';
import { durbinWatson, excludedStats, fitLinear, r2Change, stepwiseSelect, DEFAULT_TOLERANCE, type LinearFit } from '../../lib/stats/regression';
import {
  buildTerms,
  capitalize,
  caseNote,
  describeCols,
  cell,
  chartBlock,
  coefCell,
  dfCell,
  dfText,
  fmtP,
  footName,
  hcell,
  heading,
  listText,
  makeItem,
  noLead,
  num,
  numericValues,
  optBool,
  optNum,
  optStr,
  pCell,
  pct,
  selectAll,
  slot,
  standardizedHistogram,
  syntaxPreamble,
  textBlock,
  textName,
  thin,
  type ReferenceChoice,
  type Term,
} from './common';

interface DesignCol {
  x: Float64Array;
  name: string;
  term: Term;
  level: number; // index within the term's columns
  block: number;
  syntaxName: string;
}

interface ModelSpec {
  cols: number[]; // indices into design columns, in entry order
  entered: number[];
  removed: number[];
  block: number;
  method: 'enter' | 'stepwise';
}

/** Coefficient in running text with sensible precision. */
export function fmtCoef(x: number): string {
  const a = Math.abs(x);
  if (a >= 100) return num(x, 1);
  if (a >= 1) return num(x, 2);
  if (a >= 0.01) return x.toFixed(3);
  if (a === 0) return '0';
  return x.toPrecision(2);
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export const linearRegression: ProcedureDef = {
  id: 'models.linear',
  menu: 'Regression',
  title: 'Linear Regression',
  description: 'Predict a scale outcome (for example a trust or attitude score) from several predictors, optionally entered in blocks.',
  guidance:
    'Use hierarchical blocks to see how much a set of predictors adds over earlier ones (for example demographics first, then attitudes). ' +
    'Categorical predictors with value labels (nominal or ordinal) are turned into dummy variables automatically. ' +
    'Assumptions: a roughly linear relationship, independent cases, residuals with constant spread and a roughly normal distribution. Check the residual plots.',
  slots: [
    { key: 'dependent', label: 'Dependent', min: 1, max: 1, types: ['numeric'], measures: ['scale'], help: 'The outcome you want to explain (scale).' },
    { key: 'block1', label: 'Independent(s): Block 1', min: 1, max: Infinity, help: 'Predictors entered first.' },
    { key: 'block2', label: 'Block 2 (optional)', min: 0, max: Infinity, help: 'Predictors added in a second step; the output shows the R² change.' },
    { key: 'block3', label: 'Block 3 (optional)', min: 0, max: Infinity, help: 'Predictors added in a third step.' },
  ],
  options: [
    {
      key: 'method',
      label: 'Method',
      type: 'select',
      default: 'enter',
      choices: [
        { value: 'enter', label: 'Enter (all predictors in each block)' },
        { value: 'stepwise', label: 'Stepwise (enter p ≤ PIN, remove p ≥ POUT)' },
      ],
      group: 'Method',
    },
    { key: 'pin', label: 'Entry probability (PIN)', type: 'number', default: 0.05, min: 0.0001, max: 0.99, step: 0.01, group: 'Method', help: 'Stepwise only.' },
    { key: 'pout', label: 'Removal probability (POUT)', type: 'number', default: 0.1, min: 0.0001, max: 0.99, step: 0.01, group: 'Method', help: 'Stepwise only. Must be larger than PIN.' },
    { key: 'dummy', label: 'Dummy-code categorical predictors', type: 'checkbox', default: true, group: 'Categorical predictors', help: 'Nominal or ordinal predictors with value labels become 0/1 dummy variables.' },
    {
      key: 'reference',
      label: 'Reference category',
      type: 'select',
      default: 'first',
      choices: [
        { value: 'first', label: 'First (lowest code)' },
        { value: 'last', label: 'Last (highest code)' },
        { value: 'frequent', label: 'Most frequent' },
      ],
      group: 'Categorical predictors',
    },
    { key: 'ci', label: 'Confidence intervals for B', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'confLevel', label: 'Confidence level (%)', type: 'number', default: 95, min: 50, max: 99.9, step: 1, group: 'Statistics' },
    { key: 'collinearity', label: 'Collinearity diagnostics (tolerance, VIF)', type: 'checkbox', default: true, group: 'Statistics' },
    { key: 'zpp', label: 'Part and partial correlations', type: 'checkbox', default: false, group: 'Statistics' },
    { key: 'durbinWatson', label: 'Durbin-Watson', type: 'checkbox', default: false, group: 'Residuals' },
    { key: 'casewise', label: 'Casewise diagnostics', type: 'checkbox', default: true, group: 'Residuals' },
    { key: 'outlierSd', label: 'Outliers outside (standard deviations)', type: 'number', default: 3, min: 1, max: 10, step: 0.5, group: 'Residuals' },
    { key: 'plots', label: 'Residual plots (histogram, residuals vs predicted)', type: 'checkbox', default: true, group: 'Residuals' },
  ],
  validate: (ds, v, o) => validateLinear(ds, v, o),
  run: (ds, v, o) => runLinear(ds, v, o),
};

function validateLinear(ds: Dataset, vars: SlotValues, opts: OptionValues): string | null {
  const dep = slot(vars, 'dependent')[0];
  const all = [...slot(vars, 'block1'), ...slot(vars, 'block2'), ...slot(vars, 'block3')];
  if (dep && all.includes(dep)) return 'The dependent variable cannot also be a predictor.';
  if (new Set(all).size !== all.length) return 'Each predictor can appear in only one block.';
  if (optStr<string>(opts, 'method', 'enter') === 'stepwise' && optNum(opts, 'pout', 0.1) <= optNum(opts, 'pin', 0.05)) return 'For stepwise selection the removal probability (POUT) must be larger than the entry probability (PIN).';
  if (dep) {
    const v = ds.variables.find((x) => x.id === dep);
    if (v && v.type !== 'numeric') return 'The dependent variable must be numeric.';
  }
  return null;
}

function runLinear(ds: Dataset, vars: SlotValues, opts: OptionValues) {
  const err = validateLinear(ds, vars, opts);
  if (err) throw new Error(err);
  const depId = slot(vars, 'dependent')[0];
  if (!depId) throw new Error('Choose a dependent variable.');
  const blocksIds = [slot(vars, 'block1'), slot(vars, 'block2'), slot(vars, 'block3')].filter((b) => b.length > 0);
  if (!blocksIds.length) throw new Error('Choose at least one predictor.');
  const method = optStr<'enter' | 'stepwise'>(opts, 'method', 'enter');
  const dummy = optBool(opts, 'dummy', true);
  const reference = optStr<ReferenceChoice>(opts, 'reference', 'first');
  const showCI = optBool(opts, 'ci', true);
  const confPct = Math.min(Math.max(optNum(opts, 'confLevel', 95), 50), 99.9);
  const conf = confPct / 100;
  const showCollin = optBool(opts, 'collinearity', true);
  const showZpp = optBool(opts, 'zpp', false);
  const showDW = optBool(opts, 'durbinWatson', false);
  const showCasewise = optBool(opts, 'casewise', true);
  const outlierSd = optNum(opts, 'outlierSd', 3);
  const showPlots = optBool(opts, 'plots', true);
  const pin = optNum(opts, 'pin', 0.05);
  const pout = optNum(opts, 'pout', 0.1);

  const depVar = requireVariable(ds, depId);
  const sel = selectAll(ds, [depId, ...blocksIds.flat()], 3);
  const w = sel.weights;
  const y = numericValues(ds, depVar, sel.rows);
  const termsByBlock = blocksIds.map((ids) => buildTerms(ds, ids, sel.rows, w, { dummy, reference }));

  const cols: DesignCol[] = [];
  const blockCols: number[][] = [];
  termsByBlock.forEach((terms, b) => {
    const idx: number[] = [];
    for (const t of terms)
      t.cols.forEach((x, l) => {
        idx.push(cols.length);
        cols.push({ x, name: t.colNames[l], term: t, level: l, block: b, syntaxName: t.syntaxNames[l] });
      });
    blockCols.push(idx);
  });
  const X = cols.map((c) => c.x);
  const warnings: string[] = [];
  const notes: string[] = [];

  // Single-level factors produce no columns.
  for (const t of termsByBlock.flat())
    if (t.kind === 'factor' && t.cols.length === 0) warnings.push(`${t.variable.name} has only one category among the cases used, so it was left out of the model.`);

  // ----- Model sequence -----
  const specs: ModelSpec[] = [];
  if (method === 'enter') {
    let acc: number[] = [];
    blockCols.forEach((bc, b) => {
      acc = [...acc, ...bc];
      specs.push({ cols: acc.slice(), entered: bc.slice(), removed: [], block: b, method });
    });
  } else {
    let model: number[] = [];
    blockCols.forEach((bc, b) => {
      const steps = stepwiseSelect(y, X, w, model, bc, { pin, pout });
      if (!steps.length) notes.push(`Stepwise, block ${b + 1}: no predictor met the entry criterion (p ≤ ${noLead(pin, 3)}).`);
      for (const s of steps) {
        specs.push({ cols: s.model.slice(), entered: s.entered !== undefined ? [s.entered] : [], removed: s.removed !== undefined ? [s.removed] : [], block: b, method });
      }
      if (steps.length) model = steps[steps.length - 1].model.slice();
    });
  }

  const title = 'Linear Regression';
  const note = caseNote(ds, sel);
  const syntax = buildSyntax(ds, depVar.name, termsByBlock, method, { showCI, confPct, showCollin, showZpp, showDW, showCasewise, outlierSd, showPlots, pin, pout, blocks: blocksIds.length });

  if (!specs.length) {
    // Stepwise entered nothing: report why, with the statistics each predictor would have had.
    const ex = excludedStats(y, X, w, [], cols.map((_, i) => i));
    const blocks: OutputBlock[] = [
      textBlock('warning', `No predictor met the stepwise entry criterion (probability of F-to-enter ≤ ${noLead(pin, 3)}), so no model was built. None of the predictors is significantly related to ${textName(depVar)} on its own.`),
      { kind: 'table', table: excludedTable([{ spec: { cols: [], entered: [], removed: [], block: 0, method }, ex }], cols, depVar, showCollin, 'constant') },
      textBlock('interpretation', `None of the candidate predictors is significantly associated with ${textName(depVar)} (all p > ${noLead(pin, 3)}).`),
    ];
    return makeItem(linearRegression.id, title, ds, blocks, syntax, note);
  }

  const fits: LinearFit[] = specs.map((s) => fitLinear(y, s.cols.map((c) => X[c]), w, { confidence: conf }));
  // Columns actually in each model (after tolerance exclusion), as design-column indices.
  const inModel = fits.map((f, m) => f.included.map((j) => specs[m].cols[j]));
  const collinearOut = new Set<number>();
  fits.forEach((f, m) => f.excluded.forEach((j) => collinearOut.add(specs[m].cols[j])));
  if (collinearOut.size) {
    warnings.push(
      `Left out because of perfect or near-perfect collinearity (tolerance below ${DEFAULT_TOLERANCE}): ${listText([...collinearOut].map((c) => cols[c].name))}. ` +
        'Such a variable is (almost) an exact combination of other predictors, for example a dummy for every category, or a total alongside its parts.',
    );
  }

  const nModels = specs.length;
  const final = fits[nModels - 1];
  const finalCols = inModel[nModels - 1];
  const blocksOut: OutputBlock[] = [];

  // ----- Variables Entered/Removed -----
  {
    const rows: Cell[][] = specs.map((s, m) => {
      const entered = s.entered.filter((c) => inModel[m].includes(c)).map((c) => cols[c].name);
      const methodText = s.method === 'enter' ? 'Enter' : `Stepwise (Criteria: Probability-of-F-to-enter <= ${noLead(pin, 3)}, Probability-of-F-to-remove >= ${noLead(pout, 3)}).`;
      return [cell(m + 1, 'int'), cell(entered.join(', ') || '.', 'text'), cell(s.removed.map((c) => cols[c].name).join(', ') || '.', 'text'), cell(methodText, 'text')];
    });
    const foot = [`Dependent Variable: ${footName(depVar)}`];
    if (method === 'enter') foot.push(collinearOut.size ? `Tolerance = ${DEFAULT_TOLERANCE} limit reached; see Excluded Variables.` : 'All requested variables entered.');
    blocksOut.push(table({ title: 'Variables Entered/Removed', header: [[hcell('Model'), hcell('Variables Entered'), hcell('Variables Removed'), hcell('Method')]], rows, footnotes: foot }));
  }

  // ----- Model Summary -----
  const changes = fits.map((f, m) => r2Change(m === 0 ? null : fits[m - 1], f));
  const showChange = nModels > 1 || method === 'stepwise' || blocksIds.length > 1;
  const dw = showDW ? durbinWatson(final.residuals, w) : NaN;
  {
    const top: Cell[] = [hcell('Model', { rowSpan: showChange ? 2 : 1 }), hcell('R', { rowSpan: showChange ? 2 : 1 }), hcell('R Square', { rowSpan: showChange ? 2 : 1 }), hcell('Adjusted R Square', { rowSpan: showChange ? 2 : 1 }), hcell('Std. Error of the Estimate', { rowSpan: showChange ? 2 : 1 })];
    const sub: Cell[] = [];
    if (showChange) {
      top.push(hcell('Change Statistics', { colSpan: 5 }));
      sub.push(hcell('R Square Change'), hcell('F Change'), hcell('df1'), hcell('df2'), hcell('Sig. F Change'));
    }
    if (showDW) top.push(hcell('Durbin-Watson', { rowSpan: showChange ? 2 : 1 }));
    const rows = fits.map((f, m) => {
      const r: Cell[] = [cell(m + 1, 'int'), cell(f.r, 'r', { mark: LETTERS[m] }), cell(f.r2, 'r'), cell(f.adjR2, 'r'), cell(f.seEstimate, 'dec3')];
      if (showChange) {
        const c = changes[m];
        r.push(cell(c.r2Change, 'r'), cell(c.fChange, 'dec3'), dfCell(c.df1), dfCell(c.df2), pCell(c.pChange));
      }
      if (showDW) r.push(m === nModels - 1 ? cell(dw, 'dec3') : cell(null));
      return r;
    });
    const foot = fits.map((_, m) => `${LETTERS[m]}. Predictors: (Constant), ${inModel[m].map((c) => cols[c].name).join(', ')}`);
    foot.push(`Dependent Variable: ${footName(depVar)}`);
    if (showDW && sel.weights.some((x) => x !== 1)) foot.push('With frequency weights, Durbin-Watson is computed as for the data with each case repeated weight times.');
    blocksOut.push(table({ title: 'Model Summary', header: showChange ? [top, sub] : [top], rows, footnotes: foot }));
  }

  // ----- ANOVA -----
  {
    const rows: Cell[][] = [];
    const rules: number[] = [];
    fits.forEach((f, m) => {
      if (m > 0) rules.push(rows.length);
      rows.push([cell(m + 1, 'int', { rowSpan: 3 }), cell('Regression', 'text'), cell(f.ssReg, 'dec3'), dfCell(f.dfReg), cell(f.msReg, 'dec3'), cell(f.F, 'dec3'), pCell(f.pF)]);
      rows.push([cell('Residual', 'text'), cell(f.ssRes, 'dec3'), dfCell(f.dfRes), cell(f.msRes, 'dec3'), cell(null), cell(null)]);
      rows.push([cell('Total', 'text'), cell(f.ssTot, 'dec3'), dfCell(f.dfReg + f.dfRes), cell(null), cell(null), cell(null)]);
    });
    const foot = [`Dependent Variable: ${footName(depVar)}`, ...fits.map((_, m) => `Model ${m + 1} predictors: (Constant), ${inModel[m].map((c) => cols[c].name).join(', ')}`)];
    blocksOut.push(table({ title: 'ANOVA', header: [[hcell('Model', { colSpan: 2 }), hcell('Sum of Squares'), hcell('df'), hcell('Mean Square'), hcell('F'), hcell('Sig.')]], rows, stubColumns: 2, ruleBefore: rules, footnotes: foot }));
  }

  // ----- Coefficients -----
  {
    const top: Cell[] = [hcell('Model', { colSpan: 2, rowSpan: 2 }), hcell('Unstandardized Coefficients', { colSpan: 2 }), hcell('Standardized Coefficients'), hcell('t', { rowSpan: 2 }), hcell('Sig.', { rowSpan: 2 })];
    const sub: Cell[] = [hcell('B'), hcell('Std. Error'), hcell('Beta')];
    if (showCI) {
      top.push(hcell(`${confPct.toFixed(1)}% Confidence Interval for B`, { colSpan: 2 }));
      sub.push(hcell('Lower Bound'), hcell('Upper Bound'));
    }
    if (showZpp) {
      top.push(hcell('Correlations', { colSpan: 3 }));
      sub.push(hcell('Zero-order'), hcell('Partial'), hcell('Part'));
    }
    if (showCollin) {
      top.push(hcell('Collinearity Statistics', { colSpan: 2 }));
      sub.push(hcell('Tolerance'), hcell('VIF'));
    }
    const rows: Cell[][] = [];
    const rules: number[] = [];
    fits.forEach((f, m) => {
      if (m > 0) rules.push(rows.length);
      const k = f.b.length;
      const first: Cell[] = [cell(m + 1, 'int', { rowSpan: k + 1 }), cell('(Constant)', 'text'), coefCell(f.b0), coefCell(f.seB0), cell(null), cell(f.tB0, 'dec3'), pCell(f.pB0)];
      if (showCI) first.push(coefCell(f.ciB0[0]), coefCell(f.ciB0[1]));
      if (showZpp) first.push(cell(null), cell(null), cell(null));
      if (showCollin) first.push(cell(null), cell(null));
      rows.push(first);
      for (let a = 0; a < k; a++) {
        const c = inModel[m][a];
        const r: Cell[] = [cell(cols[c].name, 'text'), coefCell(f.b[a]), coefCell(f.se[a]), cell(f.beta[a], 'coef'), cell(f.t[a], 'dec3'), pCell(f.p[a])];
        if (showCI) r.push(coefCell(f.ci[a][0]), coefCell(f.ci[a][1]));
        if (showZpp) r.push(cell(f.zeroOrder[a], 'r'), cell(f.partial[a], 'r'), cell(f.part[a], 'r'));
        if (showCollin) r.push(cell(f.tolerance[a], 'r'), cell(f.vif[a], 'dec3', f.vif[a] >= 10 ? { tone: 'bad' } : f.vif[a] >= 5 ? { tone: 'warn' } : {}));
        rows.push(r);
      }
    });
    const foot = [`Dependent Variable: ${footName(depVar)}`];
    const factorTerms = termsByBlock.flat().filter((t) => t.kind === 'factor' && t.cols.length > 0);
    if (factorTerms.length) foot.push(`Dummy-coded predictors (reference category in brackets): ${factorTerms.map((t) => `${t.variable.name} (${t.refLabel})`).join('; ')}.`);
    blocksOut.push(table({ title: 'Coefficients', header: [top, sub], rows, stubColumns: 2, ruleBefore: rules, footnotes: foot }));
  }

  // ----- Excluded Variables -----
  {
    const entries = specs.map((s, m) => ({ spec: s, ex: excludedStats(y, X, w, inModel[m], cols.map((_, i) => i).filter((i) => !inModel[m].includes(i))) })).filter((e) => e.ex.length > 0);
    if (entries.length) blocksOut.push({ kind: 'table', table: excludedTable(entries.map((e) => ({ ...e, modelNo: specs.indexOf(e.spec) + 1, inModel: inModel[specs.indexOf(e.spec)] })), cols, depVar, showCollin, 'model') });
  }

  // ----- Residuals -----
  const n = y.length;
  const W = final.sumW;
  const meanPred = weightedMeanArr(final.fitted, w);
  const sdPred = Math.sqrt(weightedSSArr(final.fitted, w, meanPred) / (W - 1));
  const zpred = Float64Array.from(final.fitted, (v) => (sdPred > 0 ? (v - meanPred) / sdPred : NaN));
  const zres = Float64Array.from(final.residuals, (v) => v / final.seEstimate);
  {
    const stat = (a: Float64Array) => {
      let mn = Infinity, mx = -Infinity;
      for (const v of a) {
        mn = Math.min(mn, v);
        mx = Math.max(mx, v);
      }
      const m = weightedMeanArr(a, w);
      return [mn, mx, m, Math.sqrt(weightedSSArr(a, w, m) / (W - 1))];
    };
    const rowsDef: Array<[string, Float64Array]> = [
      ['Predicted Value', final.fitted],
      ['Residual', final.residuals],
      ['Std. Predicted Value', zpred],
      ['Std. Residual', zres],
    ];
    const rows = rowsDef.map(([label, a]) => {
      const s = stat(a);
      return [cell(label, 'text'), cell(s[0], 'dec3'), cell(s[1], 'dec3'), cell(Math.abs(s[2]) < 1e-10 ? 0 : s[2], 'dec3'), cell(s[3], 'dec3'), dfCell(W)];
    });
    blocksOut.push(table({ title: 'Residuals Statistics', header: [[hcell(''), hcell('Minimum'), hcell('Maximum'), hcell('Mean'), hcell('Std. Deviation'), hcell('N')]], rows, footnotes: [`Dependent Variable: ${footName(depVar)}`] }));
  }
  const outliers: number[] = [];
  for (let i = 0; i < n; i++) if (Math.abs(zres[i]) >= outlierSd) outliers.push(i);
  if (showCasewise && outliers.length) {
    const shown = outliers.slice(0, 200);
    const rows = shown.map((i) => [cell(sel.rows[i] + 1, 'int'), cell(zres[i], 'dec3', { tone: 'warn' }), cell(y[i], 'dec3'), cell(final.fitted[i], 'dec3'), cell(final.residuals[i], 'dec3')]);
    const foot = [`Dependent Variable: ${footName(depVar)}. Cases with |standardized residual| ≥ ${outlierSd}.`];
    if (outliers.length > shown.length) foot.push(`Showing the first ${shown.length} of ${outliers.length} cases.`);
    blocksOut.push(table({ title: 'Casewise Diagnostics', header: [[hcell('Case Number'), hcell('Std. Residual'), hcell(depVar.name), hcell('Predicted Value'), hcell('Residual')]], rows, footnotes: foot }));
  }

  // ----- Charts -----
  if (showPlots) {
    blocksOut.push(chartBlock(standardizedHistogram(zres, w, `Histogram of standardized residuals (dependent: ${depVar.name})`, 'Regression Standardized Residual')));
    const idx = thin(n);
    blocksOut.push(
      chartBlock({
        type: 'scatter',
        title: `Standardized residuals vs standardized predicted values (dependent: ${depVar.name})`,
        xLabel: 'Regression Standardized Predicted Value',
        yLabel: 'Regression Standardized Residual',
        points: idx.map((i) => ({ x: zpred[i], y: zres[i] })),
      }),
    );
  }

  // ----- Warnings -----
  const k = final.b.length;
  const vifBad = finalCols.filter((_, a) => final.vif[a] >= 10).map((c) => cols[c].name);
  const vifMid = finalCols.filter((_, a) => final.vif[a] >= 5 && final.vif[a] < 10).map((c) => cols[c].name);
  if (vifBad.length) warnings.push(`Serious multicollinearity: VIF ≥ 10 for ${listText(vifBad)}. These predictors overlap so strongly that their separate coefficients are unstable and their standard errors inflated. Consider dropping or combining overlapping predictors.`);
  if (vifMid.length) warnings.push(`Moderate multicollinearity: VIF between 5 and 10 for ${listText(vifMid)}. Interpret their separate effects with care.`);
  const perPred = k > 0 ? W / k : Infinity;
  if (perPred < 10) warnings.push(`Only ${num(perPred, 1)} cases per predictor. A common rule of thumb asks for at least 10 to 15; with fewer, estimates are unstable and R² is inflated.`);
  const distinctY = distinctValues(ds, depVar, sel.rows);
  if (distinctY.length === 2) warnings.push(`${depVar.name} has only two values. For a yes/no outcome, Binary Logistic Regression is usually the better choice.`);
  else if (depVar.measure === 'nominal') warnings.push(`${depVar.name} is defined as nominal. Linear regression treats the outcome as a quantity; for unordered categories use Multinomial Logistic Regression.`);
  else if (depVar.measure === 'ordinal' && distinctY.length <= 5) notes.push(`${depVar.name} is ordinal with ${distinctY.length} categories. Linear regression treats it as interval; Ordinal Regression is an alternative that does not.`);
  const outShare = outliers.length / n;
  if (outliers.length && outShare > 0.01) warnings.push(`${outliers.length} cases (${pct(outShare)}) have standardized residuals beyond ±${outlierSd}. Check them for data errors or unusual cases.`);
  if (showDW && !ds.weightVarId && (dw < 1.5 || dw > 2.5)) warnings.push(`Durbin-Watson = ${dw.toFixed(2)}, outside the usual 1.5 to 2.5 range: residuals of neighbouring cases may be correlated (this matters only when case order is meaningful, such as time).`);

  for (const wtext of warnings) blocksOut.push(textBlock('warning', wtext));
  for (const ntext of notes) blocksOut.push(textBlock('note', ntext));

  // ----- Interpretation & APA -----
  blocksOut.unshift(heading(`Linear Regression: ${footName(depVar)}`));
  blocksOut.push(textBlock('interpretation', interpretation(textName(depVar), fits, specs, inModel, cols, changes, blocksIds.length, method)));
  blocksOut.push(textBlock('apa', apaText(textName(depVar), fits, inModel, cols, changes, specs, method, confPct)));

  return makeItem(linearRegression.id, title, ds, blocksOut, syntax, note);
}

function table(t: OutputTable): OutputBlock {
  return { kind: 'table', table: t };
}

function weightedMeanArr(a: ArrayLike<number>, w: ArrayLike<number>): number {
  let s = 0, sw = 0;
  for (let i = 0; i < a.length; i++) {
    s += w[i] * a[i];
    sw += w[i];
  }
  return s / sw;
}
function weightedSSArr(a: ArrayLike<number>, w: ArrayLike<number>, m: number): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += w[i] * (a[i] - m) ** 2;
  return s;
}

function excludedTable(
  entries: Array<{ spec: ModelSpec; ex: ReturnType<typeof excludedStats>; modelNo?: number; inModel?: number[] }>,
  cols: DesignCol[],
  depVar: { name: string; label: string },
  showCollin: boolean,
  mode: 'model' | 'constant',
): OutputTable {
  const top: Cell[] = [hcell('Model', { colSpan: 2, rowSpan: showCollin ? 2 : 1 }), hcell('Beta In', { rowSpan: showCollin ? 2 : 1 }), hcell('t', { rowSpan: showCollin ? 2 : 1 }), hcell('Sig.', { rowSpan: showCollin ? 2 : 1 }), hcell('Partial Correlation', { rowSpan: showCollin ? 2 : 1 })];
  const sub: Cell[] = [];
  if (showCollin) {
    top.push(hcell('Collinearity Statistics', { colSpan: 3 }));
    sub.push(hcell('Tolerance'), hcell('VIF'), hcell('Minimum Tolerance'));
  } else top.push(hcell('Tolerance', { rowSpan: 1 }));
  const rows: Cell[][] = [];
  const rules: number[] = [];
  const foot: string[] = [];
  entries.forEach((e, idx) => {
    if (idx > 0) rules.push(rows.length);
    const modelNo = mode === 'constant' ? 0 : e.modelNo ?? idx + 1;
    e.ex.forEach((s, j) => {
      const r: Cell[] = [];
      if (j === 0) r.push(cell(modelNo, 'int', { rowSpan: e.ex.length }));
      r.push(cell(cols[s.index].name, 'text'), cell(s.betaIn, 'coef'), cell(s.t, 'dec3'), pCell(s.p), cell(s.partial, 'r'));
      if (showCollin) r.push(cell(s.tolerance, 'r', s.tolerance < DEFAULT_TOLERANCE ? { tone: 'bad' } : {}), cell(s.vif, 'dec3'), cell(s.minTolerance, 'r'));
      else r.push(cell(s.tolerance, 'r'));
      rows.push(r);
    });
    if (mode === 'constant') foot.push('Predictors in the Model: (Constant)');
    else foot.push(`Model ${modelNo}. Predictors in the Model: (Constant), ${(e.inModel ?? []).map((c) => cols[c].name).join(', ')}`);
  });
  foot.push(`Dependent Variable: ${depVar.label ? `${depVar.label} (${depVar.name})` : depVar.name}`);
  foot.push('Beta In is the standardized coefficient the variable would have if it were added to the model next.');
  return { title: 'Excluded Variables', header: showCollin ? [top, sub] : [top], rows, stubColumns: 2, ruleBefore: rules, footnotes: foot };
}

function predictorPhrase(c: DesignCol, b: number, p: number, depText: string): string {
  const dir = b > 0 ? 'higher' : 'lower';
  const mag = fmtCoef(Math.abs(b));
  const t = c.term;
  if (t.kind === 'factor') {
    return `compared with the reference group (${t.variable.name} = ${t.refLabel}), cases in the "${t.levelLabels[c.level]}" group score ${mag} points ${dir} on ${depText} on average (${fmtP(p)}).`;
  }
  return `each one-unit increase in ${textName(t.variable)} is associated with a ${mag}-point ${dir} ${depText} (${fmtP(p)}).`;
}

function interpretation(
  depText: string,
  fits: LinearFit[],
  specs: ModelSpec[],
  inModel: number[][],
  cols: DesignCol[],
  changes: ReturnType<typeof r2Change>[],
  nBlocks: number,
  method: 'enter' | 'stepwise',
): string {
  const m = fits.length - 1;
  const f = fits[m];
  const parts: string[] = [];
  const sig = f.pF < 0.05;
  parts.push(
    `The ${fits.length > 1 ? 'final ' : ''}model explains ${pct(f.r2)} of the variation in ${depText} (adjusted R² = ${noLead(f.adjR2)}). ` +
      (sig
        ? `This is statistically significant (${fmtP(f.pF)}): taken together, the predictors predict ${depText} better than simply using its average.`
        : `This is not statistically significant (${fmtP(f.pF)}): taken together, the predictors do not predict ${depText} better than its average would.`),
  );
  if (method === 'enter' && nBlocks > 1) {
    for (let b = 1; b < fits.length; b++) {
      const c = changes[b];
      const added = specs[b].entered.filter((x) => inModel[b].includes(x)).map((x) => cols[x].term.variable.name);
      const uniq = [...new Set(added)];
      parts.push(
        `Adding block ${b + 1} (${listText(uniq)}) ${c.pChange < 0.05 ? 'significantly ' : ''}increased the explained variance by ${(c.r2Change * 100).toFixed(1)} percentage points (${fmtP(c.pChange)})` +
          (c.pChange < 0.05 ? '.' : ', which is not a significant improvement.'),
      );
    }
  }
  if (method === 'stepwise') {
    const order = specs.flatMap((s) => s.entered.map((c) => cols[c].name));
    parts.push(`Stepwise selection entered ${listText(order)}${specs.some((s) => s.removed.length) ? ' and later removed ' + listText(specs.flatMap((s) => s.removed.map((c) => cols[c].name))) : ''}. Stepwise selection capitalises on chance; treat the chosen set as exploratory.`);
  }
  const k = f.b.length;
  const sigIdx: number[] = [], nonsigCols: DesignCol[] = [];
  for (let a = 0; a < k; a++) (f.p[a] < 0.05 ? sigIdx.push(a) : nonsigCols.push(cols[inModel[m][a]]));
  sigIdx.forEach((a, i) => {
    const phrase = predictorPhrase(cols[inModel[m][a]], f.b[a], f.p[a], depText);
    parts.push(i === 0 && k > 1 ? `Holding the other predictors constant, ${phrase}` : capitalize(phrase));
  });
  if (nonsigCols.length) {
    const names = describeCols(nonsigCols);
    parts.push(`Not significantly related to ${depText}${k > 1 ? ' once the other predictors were taken into account' : ''} (p ≥ .05): ${listText(names)}.`);
  }
  if (sigIdx.length > 1) {
    let best = sigIdx[0];
    for (const a of sigIdx) if (Math.abs(f.beta[a]) > Math.abs(f.beta[best])) best = a;
    parts.push(`Judging by the standardized coefficients, ${cols[inModel[m][best]].name} has the strongest association (β = ${noLead(f.beta[best], 2)}).`);
  }
  return parts.filter(Boolean).join(' ');
}

function apaText(
  depText: string,
  fits: LinearFit[],
  inModel: number[][],
  cols: DesignCol[],
  changes: ReturnType<typeof r2Change>[],
  specs: ModelSpec[],
  method: 'enter' | 'stepwise',
  confPct: number,
): string {
  const m = fits.length - 1;
  const f = fits[m];
  const s: string[] = [];
  const Fs = (x: LinearFit) => `F(${dfText(x.dfReg)}, ${dfText(x.dfRes)}) = ${num(x.F, 2)}, ${fmtP(x.pF)}`;
  if (fits.length === 1) {
    s.push(`A multiple linear regression was conducted to predict ${depText}. The model explained ${pct(f.r2)} of the variance, ${Fs(f)}, adjusted R² = ${noLead(f.adjR2)}.`);
  } else if (method === 'enter') {
    s.push(`A hierarchical multiple regression was conducted to predict ${depText}. In Step 1 the model explained ${pct(fits[0].r2)} of the variance, ${Fs(fits[0])}.`);
    for (let b = 1; b < fits.length; b++) {
      const c = changes[b];
      s.push(`Adding the Step ${b + 1} predictors increased R² by ${noLead(c.r2Change)}, F change(${dfText(c.df1)}, ${dfText(c.df2)}) = ${num(c.fChange, 2)}, ${fmtP(c.pChange)}.`);
    }
    s.push(`The final model explained ${pct(f.r2)} of the variance, ${Fs(f)}, adjusted R² = ${noLead(f.adjR2)}.`);
  } else {
    s.push(`A stepwise multiple regression (entry p ≤ .05, removal p ≥ .10) was conducted to predict ${depText}. The final model (${specs.length} steps) explained ${pct(f.r2)} of the variance, ${Fs(f)}, adjusted R² = ${noLead(f.adjR2)}.`);
  }
  const k = f.b.length;
  const sig: string[] = [];
  for (let a = 0; a < k; a++) {
    if (!(f.p[a] < 0.05)) continue;
    sig.push(`${cols[inModel[m][a]].name} (B = ${fmtCoef(f.b[a])}, ${confPct.toFixed(0)}% CI [${fmtCoef(f.ci[a][0])}, ${fmtCoef(f.ci[a][1])}], β = ${noLead(f.beta[a], 2)}, t(${dfText(f.dfRes)}) = ${num(f.t[a], 2)}, ${fmtP(f.p[a])})`);
  }
  if (sig.length) s.push(`Significant predictors were ${listText(sig)}.`);
  else if (k) s.push('No individual predictor was statistically significant.');
  return s.join(' ');
}

function buildSyntax(
  ds: Dataset,
  depName: string,
  termsByBlock: Term[][],
  method: 'enter' | 'stepwise',
  o: { showCI: boolean; confPct: number; showCollin: boolean; showZpp: boolean; showDW: boolean; showCasewise: boolean; outlierSd: number; showPlots: boolean; pin: number; pout: number; blocks: number },
): string {
  const lines = syntaxPreamble(ds);
  const compute = termsByBlock.flat().flatMap((t) => t.syntaxCompute);
  if (compute.length) {
    lines.push('* Dummy variables for categorical predictors.', ...compute, 'EXECUTE.');
  }
  const stats = ['COEFF', 'OUTS', 'R', 'ANOVA'];
  if (o.showCI) stats.splice(2, 0, `CI(${Number(o.confPct.toFixed(1))})`);
  if (o.blocks > 1 || method === 'stepwise') stats.push('CHANGE');
  if (o.showCollin) stats.push('COLLIN', 'TOL');
  if (o.showZpp) stats.push('ZPP');
  lines.push('REGRESSION', '  /MISSING LISTWISE', `  /STATISTICS ${stats.join(' ')}`, `  /CRITERIA=PIN(${noLead(o.pin, 3)}) POUT(${noLead(o.pout, 3)}) TOLERANCE(.0001)`, '  /NOORIGIN', `  /DEPENDENT ${depName}`);
  for (const terms of termsByBlock) lines.push(`  /METHOD=${method === 'enter' ? 'ENTER' : 'STEPWISE'} ${terms.flatMap((t) => t.syntaxNames).join(' ')}`);
  if (o.showPlots) lines.push('  /SCATTERPLOT=(*ZRESID ,*ZPRED)');
  const res: string[] = [];
  if (o.showDW) res.push('DURBIN');
  if (o.showPlots) res.push('HISTOGRAM(ZRESID)');
  if (res.length) lines.push(`  /RESIDUALS ${res.join(' ')}`);
  if (o.showCasewise) lines.push(`  /CASEWISE PLOT(ZRESID) OUTLIERS(${o.outlierSd})`);
  lines[lines.length - 1] += '.';
  return lines.join('\n');
}
