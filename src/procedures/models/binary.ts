// Binary Logistic Regression (SPSS LOGISTIC REGRESSION, METHOD=ENTER).

import { ciOption, confLevel, labelOf, levelText } from '../text';
import type { Dataset, Variable } from '../../core/types';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import type { Cell, OutputBlock, OutputTable } from '../../core/output';
import { requireVariable } from '../../core/data';
import { sum } from '../../lib/stats/models-util';
import { chi2Sf } from '../../lib/stats/distributions';
import {
  detectSeparation,
  expCI,
  fitBinaryLogit,
  hosmerLemeshow,
  multinomialNullLogLik,
  pseudoR2,
  scoreTestsConstantOnly,
  screenCollinear,
  waldTest,
  type BinaryLogitFit,
} from '../../lib/stats/logistic';
import {
  buildTerms,
  capitalize,
  caseNote,
  describeCols,
  cell,
  coefCell,
  dfCell,
  dfText,
  fmtP,
  footName,
  hcell,
  heading,
  levelsOf,
  listText,
  makeItem,
  noLead,
  num,
  optBool,
  optNum,
  optStr,
  pCell,
  rawValues,
  selectAll,
  slot,
  syntaxPreamble,
  textBlock,
  type ReferenceChoice,
  type Term,
  colProse,
  proseNamer,
} from './common';

interface Col {
  x: Float64Array;
  term: Term;
  level: number;
  name: string;
}

export const binaryLogistic: ProcedureDef = {
  id: 'models.logistic',
  menu: 'Regression',
  title: 'Binary Logistic Regression',
  description: 'Predict a yes/no outcome (for example voted or not) from several predictors; results are given as odds ratios.',
  guidance:
    'The dependent variable must have exactly two values. Choose which value counts as the "event" (coded 1). ' +
    'Categorical predictors with value labels are indicator-coded automatically against a reference category. ' +
    'Aim for at least 10 cases of the rarer outcome per predictor.',
  slots: [
    { key: 'dependent', label: 'Dependent (two categories)', min: 1, max: 1, measures: ['nominal', 'ordinal'], help: 'A variable with exactly two valid values.' },
    { key: 'covariates', label: 'Covariates', min: 1, max: Infinity, help: 'Predictors. Nominal/ordinal variables with value labels are treated as categorical.' },
  ],
  options: [
    {
      key: 'event',
      label: 'Event (coded 1)',
      type: 'select',
      default: 'higher',
      choices: [
        { value: 'higher', label: 'Higher value of the dependent' },
        { value: 'lower', label: 'Lower value of the dependent' },
      ],
      group: 'Dependent',
      help: 'The model predicts the odds of this value.',
    },
    { key: 'dummy', label: 'Treat nominal/ordinal predictors as categorical', type: 'checkbox', default: true, group: 'Categorical predictors' },
    {
      key: 'reference',
      label: 'Reference category',
      type: 'select',
      default: 'first',
      choices: [
        { value: 'first', label: 'First (lowest code)' },
        { value: 'last', label: 'Last (highest code), SPSS default' },
        { value: 'frequent', label: 'Most frequent' },
      ],
      group: 'Categorical predictors',
    },
    { key: 'cut', label: 'Classification cutoff', type: 'number', default: 0.5, min: 0.01, max: 0.99, step: 0.05, group: 'Options' },
    { key: 'ci', label: 'CI for Exp(B)', type: 'checkbox', default: true, group: 'Options' },
    ciOption('confLevel', 'Confidence level (%)', 'Options'),
    { key: 'hl', label: 'Hosmer-Lemeshow goodness of fit', type: 'checkbox', default: true, group: 'Options' },
    { key: 'hlTable', label: 'Hosmer-Lemeshow contingency table', type: 'checkbox', default: false, group: 'Options' },
    { key: 'block0', label: 'Show Block 0 (constant-only model)', type: 'checkbox', default: true, group: 'Options' },
    { key: 'maxIter', label: 'Maximum iterations', type: 'number', default: 50, min: 5, max: 500, step: 5, group: 'Options' },
  ],
  validate: (ds, v) => {
    const dep = slot(v, 'dependent')[0];
    if (dep && slot(v, 'covariates').includes(dep)) return 'The dependent variable cannot also be a covariate.';
    return null;
  },
  run: (ds, v, o) => runBinary(ds, v, o),
};

export function oddsPhrase(or: number): string {
  if (!Number.isFinite(or)) return 'changed by an amount that could not be estimated';
  if (or >= 1) {
    const pctUp = (or - 1) * 100;
    return `${num(or, 2)} times as high (${pctUp < 1000 ? `${pctUp.toFixed(0)}% higher` : 'much higher'})`;
  }
  return `${num(or, 2)} times as high (${((1 - or) * 100).toFixed(0)}% lower)`;
}

function runBinary(ds: Dataset, vars: SlotValues, opts: OptionValues) {
  const depId = slot(vars, 'dependent')[0];
  const covIds = slot(vars, 'covariates');
  if (!depId) throw new Error('Choose a dependent variable.');
  if (!covIds.length) throw new Error('Choose at least one covariate.');
  if (covIds.includes(depId)) throw new Error('The dependent variable cannot also be a covariate.');
  const eventChoice = optStr<'higher' | 'lower'>(opts, 'event', 'higher');
  const dummy = optBool(opts, 'dummy', true);
  const reference = optStr<ReferenceChoice>(opts, 'reference', 'first');
  const cut = Math.min(Math.max(optNum(opts, 'cut', 0.5), 0.001), 0.999);
  const showCI = optBool(opts, 'ci', true);
  const confPct = confLevel(opts, 'confLevel', 'Confidence level (%)') * 100;
  const showHL = optBool(opts, 'hl', true);
  const showHLTable = optBool(opts, 'hlTable', false);
  const showBlock0 = optBool(opts, 'block0', true);
  const maxIter = Math.round(optNum(opts, 'maxIter', 50));

  const depVar = requireVariable(ds, depId);
  const sel = selectAll(ds, [depId, ...covIds], 3);
  const w = sel.weights;
  const depVals = rawValues(ds, depVar, sel.rows);
  const depLevels = levelsOf(depVals, w);
  if (depLevels.length !== 2) {
    throw new Error(
      `${depVar.name} has ${depLevels.length} different value${depLevels.length === 1 ? '' : 's'} among the cases used. Binary logistic regression needs exactly two. ` +
        (depLevels.length > 2 ? 'For more categories use Multinomial Logistic Regression (unordered) or Ordinal Regression (ordered), or recode the variable into two groups.' : ''),
    );
  }
  const eventIdx = eventChoice === 'higher' ? 1 : 0;
  const eventValue = depLevels[eventIdx].value;
  const nonEventValue = depLevels[1 - eventIdx].value;
  const eventLabel = labelOf(depVar, eventValue);
  const nonEventLabel = labelOf(depVar, nonEventValue);
  const y = Float64Array.from(depVals, (v) => (v === eventValue ? 1 : 0));

  const terms = buildTerms(ds, covIds, sel.rows, w, { dummy, reference });
  const allCols: Col[] = [];
  for (const t of terms) t.cols.forEach((x, l) => allCols.push({ x, term: t, level: l, name: t.kind === 'factor' ? `${t.variable.name}: ${t.levelLabels[l]}` : t.variable.name }));
  const warnings: string[] = [];
  const notes: string[] = [];
  for (const t of terms) if (t.kind === 'factor' && t.cols.length === 0) warnings.push(`${t.variable.name} has only one category among the cases used, so it was left out.`);
  const screen = screenCollinear(allCols.map((c) => c.x), w);
  if (screen.dropped.length) {
    warnings.push(`Left out because they are constant or exact combinations of other predictors (redundant): ${listText(screen.dropped.map((j) => allCols[j].name))}.`);
  }
  const cols = screen.kept.map((j) => allCols[j]);
  const X = cols.map((c) => c.x);
  const p = X.length;
  const W = sum(w);
  const nEvents = sum(Array.from(y, (v, i) => v * w[i]));

  const fit = fitBinaryLogit(y, X, w, { maxIter });
  const ll0 = multinomialNullLogLik(y, 2, w);
  const m2ll0 = -2 * ll0;
  // Cannot be negative (the null model is nested); a tiny negative value is rounding.
  const modelChi = Math.max(0, m2ll0 - fit.m2ll);
  const modelP = chi2Sf(modelChi, p);
  const pr = pseudoR2(ll0, fit.logLik, W);
  const sep = detectSeparation(y, X, w, fit);

  const blocks: OutputBlock[] = [heading(`Binary Logistic Regression: ${footName(depVar)}`)];

  // Case Processing Summary (unweighted, like SPSS)
  {
    const total = sel.rows.length + sel.nMissing + sel.nFiltered;
    const pc = (x: number) => cell(total ? (100 * x) / total : NaN, 'pct');
    blocks.push(
      tbl({
        title: 'Case Processing Summary',
        header: [[hcell('Unweighted Cases', { colSpan: 2 }), hcell('N'), hcell('Percent')]],
        stubColumns: 2,
        rows: [
          [cell('Selected Cases', 'text', { rowSpan: 3 }), cell('Included in Analysis', 'text'), cell(sel.rows.length, 'int'), pc(sel.rows.length)],
          [cell('Missing Cases', 'text'), cell(sel.nMissing, 'int'), pc(sel.nMissing)],
          [cell('Total', 'text'), cell(sel.rows.length + sel.nMissing, 'int'), pc(sel.rows.length + sel.nMissing)],
          [cell('Unselected Cases', 'text', { colSpan: 2 }), cell(sel.nFiltered, 'int'), pc(sel.nFiltered)],
          [cell('Total', 'text', { colSpan: 2 }), cell(total, 'int'), pc(total)],
        ],
        ruleBefore: [3],
        footnotes: ds.weightVarId ? ['If weight is in effect, see the classification table for the total number of cases.'] : [],
      }),
    );
  }
  // Dependent Variable Encoding
  blocks.push(
    tbl({
      title: 'Dependent Variable Encoding',
      header: [[hcell('Original Value'), hcell('Internal Value')]],
      rows: [
        [cell(nonEventLabel, 'text'), cell(0, 'int')],
        [cell(eventLabel, 'text'), cell(1, 'int')],
      ],
    }),
  );
  // Categorical Variables Codings
  const factorTerms = terms.filter((t) => t.kind === 'factor' && t.cols.length > 0);
  if (factorTerms.length) blocks.push(codingsTable(factorTerms));

  // Block 0
  const pBar = nEvents / W;
  if (showBlock0) {
    blocks.push(heading('Block 0: Beginning Block'));
    const pred0 = new Float64Array(y.length).fill(pBar);
    blocks.push(classificationTable(y, pred0, w, cut, depVar, nonEventLabel, eventLabel, 'Step 0', ['Constant is included in the model.', `The cut value is ${noLead(cut, 3)}`]));
    const b0 = Math.log(nEvents / (W - nEvents));
    const se0 = Math.sqrt(1 / nEvents + 1 / (W - nEvents));
    const wald0 = (b0 / se0) ** 2;
    blocks.push(
      tbl({
        title: 'Variables in the Equation',
        header: [[hcell('', { colSpan: 2 }), hcell('B'), hcell('S.E.'), hcell('Wald'), hcell('df'), hcell('Sig.'), hcell('Exp(B)')]],
        stubColumns: 2,
        rows: [[cell('Step 0', 'text'), cell('Constant', 'text'), coefCell(b0, 'coef', se0), coefCell(se0), cell(wald0, 'dec3'), cell(1, 'int'), pCell(chi2Sf(wald0, 1)), cell(Math.exp(b0), 'dec3')]],
      }),
    );
    if (p > 0) {
      const sc = scoreTestsConstantOnly(y, X, w);
      const rows: Cell[][] = [];
      const termOrder = uniqueTerms(cols);
      for (const t of termOrder) {
        const idx = cols.map((c, j) => (c.term === t ? j : -1)).filter((j) => j >= 0);
        if (t.kind === 'factor' && idx.length > 1) {
          const s = scoreTestsConstantOnly(y, idx.map((j) => X[j]), w).overall;
          rows.push([cell(t.variable.name, 'text'), cell(s.score, 'dec3'), cell(s.df, 'int'), pCell(s.p)]);
          for (const j of idx) rows.push([cell(`${t.variable.name}: ${t.levelLabels[cols[j].level]}`, 'text', { indent: 1 }), cell(sc.each[j].score, 'dec3'), cell(1, 'int'), pCell(sc.each[j].p)]);
        } else for (const j of idx) rows.push([cell(cols[j].name, 'text'), cell(sc.each[j].score, 'dec3'), cell(1, 'int'), pCell(sc.each[j].p)]);
      }
      rows.push([cell('Overall Statistics', 'text', { bold: true }), cell(sc.overall.score, 'dec3'), cell(sc.overall.df, 'int'), pCell(sc.overall.p)]);
      blocks.push(tbl({ title: 'Variables not in the Equation', header: [[hcell('Step 0'), hcell('Score'), hcell('df'), hcell('Sig.')]], rows, ruleBefore: [rows.length - 1] }));
    }
  }

  // Block 1
  blocks.push(heading('Block 1: Method = Enter'));
  blocks.push(
    tbl({
      title: 'Omnibus Tests of Model Coefficients',
      header: [[hcell('', { colSpan: 2 }), hcell('Chi-square'), hcell('df'), hcell('Sig.')]],
      stubColumns: 2,
      rows: ['Step', 'Block', 'Model'].map((lab, i) => {
        const r: Cell[] = [cell(lab, 'text'), cell(modelChi, 'dec3'), cell(p, 'int'), pCell(modelP)];
        return i === 0 ? [cell('Step 1', 'text', { rowSpan: 3 }), ...r] : r;
      }),
    }),
  );
  const convNote = fit.converged
    ? fit.singular
      ? `Estimation terminated at iteration number ${fit.iterations} because the parameter estimates converged, but the information matrix is singular, so some parameters are not identified.`
      : `Estimation terminated at iteration number ${fit.iterations} because the parameter estimates converged.`
    : fit.diverged
      ? `Estimation terminated at iteration number ${fit.iterations} because the log-likelihood stopped improving while some estimates kept growing (separation). Final solution cannot be found.`
      : `Estimation terminated at iteration number ${fit.iterations} because the maximum number of iterations was reached. Final solution cannot be found.`;
  blocks.push(
    tbl({
      title: 'Model Summary',
      header: [[hcell('Step'), hcell('-2 Log likelihood'), hcell('Cox & Snell R Square'), hcell('Nagelkerke R Square')]],
      rows: [[cell(1, 'int'), cell(fit.m2ll, 'dec3'), cell(pr.coxSnell, 'r'), cell(pr.nagelkerke, 'r')]],
      footnotes: [convNote],
    }),
  );
  let hl: ReturnType<typeof hosmerLemeshow> | null = null;
  if (showHL) {
    hl = hosmerLemeshow(y, fit.fitted, w, (i) => X.map((c) => c[i]).join('|'));
    blocks.push(tbl({ title: 'Hosmer and Lemeshow Test', header: [[hcell('Step'), hcell('Chi-square'), hcell('df'), hcell('Sig.')]], rows: [[cell(1, 'int'), cell(hl.chi2, 'dec3'), cell(hl.df, 'int'), cell(hl.p, 'p')]] }));
    if (showHLTable) {
      const rows = hl.groups.map((g, i) => {
        const r: Cell[] = [cell(i + 1, 'int'), num0(g.obs0), cell(g.exp0, 'dec3'), num0(g.obs1), cell(g.exp1, 'dec3'), num0(g.n)];
        return i === 0 ? [cell('Step 1', 'text', { rowSpan: hl!.groups.length }), ...r] : r;
      });
      blocks.push(
        tbl({
          title: 'Contingency Table for Hosmer and Lemeshow Test',
          header: [
            [hcell('', { colSpan: 2, rowSpan: 2 }), hcell(`${depVar.name} = ${nonEventLabel}`, { colSpan: 2 }), hcell(`${depVar.name} = ${eventLabel}`, { colSpan: 2 }), hcell('Total', { rowSpan: 2 })],
            [hcell('Observed'), hcell('Expected'), hcell('Observed'), hcell('Expected')],
          ],
          stubColumns: 2,
          rows,
        }),
      );
    }
  }
  const classification = classificationTable(y, fit.fitted, w, cut, depVar, nonEventLabel, eventLabel, 'Step 1', [`The cut value is ${noLead(cut, 3)}`]);
  blocks.push(classification);

  // Variables in the Equation
  const conf = confPct / 100;
  {
    const top: Cell[] = [hcell('', { colSpan: 2, rowSpan: showCI ? 2 : 1 }), hcell('B', { rowSpan: showCI ? 2 : 1 }), hcell('S.E.', { rowSpan: showCI ? 2 : 1 }), hcell('Wald', { rowSpan: showCI ? 2 : 1 }), hcell('df', { rowSpan: showCI ? 2 : 1 }), hcell('Sig.', { rowSpan: showCI ? 2 : 1 }), hcell('Exp(B)', { rowSpan: showCI ? 2 : 1 })];
    const header: Cell[][] = [top];
    if (showCI) {
      top.push(hcell(`${levelText(confPct / 100)}% C.I. for EXP(B)`, { colSpan: 2 }));
      header.push([hcell('Lower'), hcell('Upper')]);
    }
    const body: Cell[][] = [];
    let anyMarked = false;
    const coefRow = (label: string, j: number, indent = 0): Cell[] => {
      const b = fit.coef[j], se = fit.se[j];
      const seCell = coefCell(se);
      if (fit.unstable[j]) {
        seCell.mark = 'a';
        anyMarked = true;
      }
      const r: Cell[] = [cell(label, 'text', { indent }), coefCell(b, 'coef', se), seCell, cell(fit.wald[j], 'dec3'), cell(1, 'int'), pCell(fit.p[j]), cell(Math.exp(b), 'dec3')];
      if (showCI) {
        const [lo, hi] = expCI(b, se, conf);
        r.push(cell(lo, 'dec3'), cell(hi, 'dec3'));
      }
      return r;
    };
    for (const t of uniqueTerms(cols)) {
      const idx = cols.map((c, j) => (c.term === t ? j : -1)).filter((j) => j >= 0);
      if (t.kind === 'factor' && idx.length > 1) {
        const wt = waldTest(fit.coef, fit.cov, idx.map((j) => j + 1));
        const r: Cell[] = [cell(`${t.variable.name} (ref = ${t.refLabel})`, 'text'), cell(null), cell(null), cell(wt.chi2, 'dec3'), cell(wt.df, 'int'), pCell(wt.p), cell(null)];
        if (showCI) r.push(cell(null), cell(null));
        body.push(r);
        for (const j of idx) body.push(coefRow(`${t.variable.name}: ${t.levelLabels[cols[j].level]}`, j + 1, 1));
      } else if (t.kind === 'factor') {
        for (const j of idx) body.push(coefRow(`${t.variable.name}: ${t.levelLabels[cols[j].level]} (ref = ${t.refLabel})`, j + 1));
      } else for (const j of idx) body.push(coefRow(cols[j].name, j + 1));
    }
    body.push(coefRow('Constant', 0));
    const rows = body.map((r, i) => (i === 0 ? [cell('Step 1', 'text', { rowSpan: body.length }), ...r] : r));
    const foot = [`Variable(s) entered on step 1: ${terms.map((t) => t.variable.name).join(', ')}.`];
    if (factorTerms.length) foot.push('Categorical predictors are indicator-coded; each category is compared with the reference category.');
    if (anyMarked) foot.push('a. Not a real estimate: because of separation (see the warnings) this coefficient grows without limit with every iteration, so the value shown is where the iterations stopped. Its standard error is huge and its Wald test, significance and odds ratio are meaningless.');
    if (!fit.converged && !anyMarked && !sep) foot.push('The estimates did not converge and should not be trusted.');
    blocks.push(tbl({ title: 'Variables in the Equation', header, rows, stubColumns: 2, footnotes: foot }));
  }

  // ----- Warnings -----
  if (sep) warnings.push(separationText(sep, cols, depVar, eventLabel, nonEventLabel, fit.unstable.some((u, j) => j > 0 && u === 1)));
  else if (!fit.converged) warnings.push(`The model did not converge within ${maxIter} iterations. The estimates are not reliable. Try fewer predictors or merge sparse categories.`);
  const rare = Math.min(nEvents, W - nEvents);
  if (p > 0 && rare / p < 10) warnings.push(`Only ${num(rare / p, 1)} cases of the rarer outcome per predictor (${num(rare, 0)} cases, ${p} parameters). A common rule of thumb asks for at least 10; with fewer, odds ratios can be biased and unstable.`);
  const bigSE = cols.filter((_, j) => fit.se[j + 1] > 5 && !fit.unstable[j + 1] && !(sep && sep.variables.includes(j))).map((c) => c.name);
  if (bigSE.length) warnings.push(`Very large standard errors for ${listText(bigSE)} suggest sparse categories or near-separation. Interpret those odds ratios with great care.`);
  if (hl && hl.p < 0.05) warnings.push(`The Hosmer-Lemeshow test is significant (${fmtP(hl.p)}): predicted probabilities do not match observed rates well in some groups. Consider adding interactions or non-linear terms.`);
  if (hl && hl.df < 1) notes.push('The Hosmer-Lemeshow test needs at least three groups of distinct predicted probabilities, so it could not be computed.');
  for (const t of warnings) blocks.push(textBlock('warning', t));
  for (const t of notes) blocks.push(textBlock('note', t));

  // ----- Interpretation / APA -----
  const pctCorrect = classificationRate(y, fit.fitted, w, cut);
  const baseRate = Math.max(nEvents, W - nEvents) / W;
  // One naming convention for every sentence: labels only if all the variables have usable labels.
  const nm = proseNamer([depVar, ...terms.map((t) => t.variable)]);
  const depText = nm(depVar);
  const oddsOf = `the odds of "${eventLabel}"`;
  const ip: string[] = [];
  const modelTestable = p > 0 && Number.isFinite(modelP);
  const NO_PRED = 'No predictor could be estimated (constant or collinear predictors are left out), so the model cannot be compared with a model with no predictors.';
  ip.push(
    !modelTestable
      ? NO_PRED
      : modelP < 0.05
      ? `The predictors together improve the prediction of ${depText} significantly compared with a model with no predictors (${fmtP(modelP)}). Nagelkerke pseudo R² = ${noLead(pr.nagelkerke)}; unlike R² in linear regression this is not a share of variance explained, only a rough guide to how much better the model fits than one without predictors (values between .2 and .4 are common for survey data).`
      : `The predictors together do not significantly improve the prediction of ${depText} compared with a model with no predictors (${fmtP(modelP)}).`,
  );
  ip.push(`The model classifies ${pctCorrect.toFixed(1)}% of cases correctly, compared with ${(baseRate * 100).toFixed(1)}% by always predicting the most common outcome.`);
  const sigRows: string[] = [], nonsig: Col[] = [];
  cols.forEach((c, j) => {
    const pv = fit.p[j + 1];
    const or = Math.exp(fit.coef[j + 1]);
    if (!(pv < 0.05) || (sep && sep.variables.includes(j)) || fit.unstable[j + 1]) {
      if (!(pv < 0.05) && !fit.unstable[j + 1] && !(sep && sep.variables.includes(j))) nonsig.push(c);
      return;
    }
    if (c.term.kind === 'factor') sigRows.push(`compared with ${nm(c.term.variable)} = ${c.term.refLabel}, ${oddsOf} were ${oddsPhrase(or)} for ${c.term.levelLabels[c.level]} (${fmtP(pv)})`);
    else sigRows.push(`each one-unit increase in ${nm(c.term.variable)} multiplied ${oddsOf} by ${num(or, 2)} (${fmtP(pv)})`);
  });
  sigRows.forEach((s, i) => ip.push(i === 0 && p > 1 ? `Holding the other predictors constant, ${s}.` : `${capitalize(s)}.`));
  if (nonsig.length) ip.push(`Not significantly related to ${depText}${p > 1 ? ' once the other predictors were taken into account' : ''} (p ≥ .05): ${listText(describeCols(nonsig, nm))}.`);
  ip.push('An odds ratio (Exp(B)) above 1 means higher odds of the event; below 1 means lower odds.');
  blocks.push(textBlock('interpretation', ip.join(' ')));

  const apa: string[] = [];
  apa.push(
    `A binary logistic regression was performed to assess the effects of ${listText(terms.map((t) => nm(t.variable)))} on the likelihood of ${depText} being "${eventLabel}". ` +
      (modelTestable
        ? `The model was ${modelP < 0.05 ? '' : 'not '}statistically significant, χ²(${p}, N = ${dfText(W)}) = ${num(modelChi, 2)}, ${fmtP(modelP)}, Nagelkerke pseudo R² = ${noLead(pr.nagelkerke)}, and correctly classified ${pctCorrect.toFixed(1)}% of cases.`
        : `No predictor could be estimated, so the model was not tested; it correctly classified ${pctCorrect.toFixed(1)}% of cases.`),
  );
  const sigApa = cols
    .map((c, j) => ({ c, j }))
    .filter(({ j }) => fit.p[j + 1] < 0.05)
    .map(({ c, j }) => {
      const [lo, hi] = expCI(fit.coef[j + 1], fit.se[j + 1], conf);
      return `${colProse(c, nm)} (B = ${num(fit.coef[j + 1], 2)}, SE = ${num(fit.se[j + 1], 2)}, Wald = ${num(fit.wald[j + 1], 2)}, ${fmtP(fit.p[j + 1])}, OR = ${num(Math.exp(fit.coef[j + 1]), 2)}, ${levelText(confPct / 100)}% CI [${num(lo, 2)}, ${num(hi, 2)}])`;
    });
  if (sigApa.length) apa.push(`Significant predictors were ${listText(sigApa)}.`);
  blocks.push(textBlock('apa', apa.join(' ')));

  const syntax = buildSyntax(ds, depVar, depLevels.map((l) => l.value), eventChoice, terms, { cut, showCI, confPct, showHL, maxIter, reference });
  return makeItem(binaryLogistic.id, 'Binary Logistic Regression', ds, blocks, syntax, caseNote(ds, sel));
}

function num0(x: number): Cell {
  return Number.isInteger(x) ? cell(x, 'int') : cell(x, 'dec1');
}

function tbl(t: OutputTable): OutputBlock {
  return { kind: 'table', table: t };
}

export function uniqueTerms(cols: Col[]): Term[] {
  const out: Term[] = [];
  for (const c of cols) if (!out.includes(c.term)) out.push(c.term);
  return out;
}

export function codingsTable(factorTerms: Term[]): OutputBlock {
  const maxK = Math.max(...factorTerms.map((t) => t.cols.length));
  const header: Cell[][] = [
    [hcell('', { colSpan: 2, rowSpan: 2 }), hcell('Frequency', { rowSpan: 2 }), hcell('Parameter coding', { colSpan: maxK })],
    Array.from({ length: maxK }, (_, k) => hcell(`(${k + 1})`)),
  ];
  const rows: Cell[][] = [];
  const rules: number[] = [];
  for (const t of factorTerms) {
    if (rows.length) rules.push(rows.length);
    const levels = t.levels ?? [];
    levels.forEach((lv, i) => {
      const r: Cell[] = [];
      if (i === 0) r.push(cell(t.variable.name, 'text', { rowSpan: levels.length }));
      r.push(cell(labelOf(t.variable, lv.value), 'text'), Number.isInteger(lv.count) ? cell(lv.count, 'int') : cell(lv.count, 'dec1'));
      for (let k = 0; k < maxK; k++) {
        if (k >= t.cols.length) r.push(cell(null));
        else r.push(cell(t.levelValues[k] === lv.value ? 1 : 0, 'dec3'));
      }
      rows.push(r);
    });
  }
  return tbl({ title: 'Categorical Variables Codings', header, rows, stubColumns: 2, ruleBefore: rules, footnotes: ['Indicator coding: a category coded .000 on every parameter is the reference category.'] });
}

function classificationRate(y: Float64Array, prob: ArrayLike<number>, w: ArrayLike<number>, cut: number): number {
  let ok = 0, W = 0;
  for (let i = 0; i < y.length; i++) {
    W += w[i];
    if ((prob[i] >= cut ? 1 : 0) === y[i]) ok += w[i];
  }
  return (100 * ok) / W;
}

function classificationTable(y: Float64Array, prob: ArrayLike<number>, w: ArrayLike<number>, cut: number, depVar: Variable, lab0: string, lab1: string, step: string, foot: string[]): OutputBlock {
  const m = [[0, 0], [0, 0]];
  for (let i = 0; i < y.length; i++) m[y[i]][prob[i] >= cut ? 1 : 0] += w[i];
  const n0 = m[0][0] + m[0][1], n1 = m[1][0] + m[1][1];
  const pc0 = n0 ? (100 * m[0][0]) / n0 : NaN;
  const pc1 = n1 ? (100 * m[1][1]) / n1 : NaN;
  const overall = (100 * (m[0][0] + m[1][1])) / (n0 + n1);
  const cnt = (x: number) => (Number.isInteger(x) ? cell(x, 'int') : cell(x, 'dec1'));
  return tbl({
    title: 'Classification Table',
    header: [
      [hcell('Observed', { colSpan: 3, rowSpan: 2 }), hcell('Predicted', { colSpan: 3 })],
      [hcell(lab0), hcell(lab1), hcell('Percentage Correct')],
    ],
    stubColumns: 3,
    rows: [
      [cell(step, 'text', { rowSpan: 3 }), cell(depVar.name, 'text', { rowSpan: 2 }), cell(lab0, 'text'), cnt(m[0][0]), cnt(m[0][1]), cell(pc0, 'dec1')],
      [cell(lab1, 'text'), cnt(m[1][0]), cnt(m[1][1]), cell(pc1, 'dec1')],
      [cell('Overall Percentage', 'text', { colSpan: 2 }), cell(null), cell(null), cell(overall, 'dec1', { bold: true })],
    ],
    footnotes: foot,
  });
}

function separationText(sep: NonNullable<ReturnType<typeof detectSeparation>>, cols: Col[], depVar: Variable, eventLabel: string, nonEventLabel: string, marked: boolean): string {
  const parts: string[] = [];
  sep.variables.forEach((j, k) => {
    const c = cols[j];
    const d = sep.details[k];
    if (d === 'range') parts.push(`${c.name} separates the outcomes completely: every case above some value has one outcome and every case below it the other`);
    else if (d === 'diverging') parts.push(`the coefficient for ${c.name} keeps growing without limit`);
    else {
      const [xv, yv] = d.split(':');
      const outcome = yv === '1' ? eventLabel : nonEventLabel;
      if (c.term.kind === 'factor') {
        const group = xv === '1' ? `the "${c.term.levelLabels[c.level]}" category of ${c.term.variable.name}` : `every category of ${c.term.variable.name} other than "${c.term.levelLabels[c.level]}"`;
        parts.push(`all cases in ${group} have ${depVar.name} = "${outcome}"`);
      } else parts.push(`all cases with ${c.name} = ${xv} have ${depVar.name} = "${outcome}"`);
    }
  });
  const kind = sep.kind === 'complete' ? 'Complete separation' : 'Quasi-complete separation';
  return (
    `${kind} detected: ${parts.join('; ')}. ` +
    'When a predictor perfectly predicts the outcome for some cases, the maximum-likelihood estimate is infinite, so the B, S.E. and odds ratio for that variable are meaningless' +
    (marked && sep.kind === 'quasi-complete'
      ? ' (marked a in the Variables in the Equation table, with a huge standard error). The other estimates, standard errors and tests are not affected and can be read as usual. '
      : '. ') +
    'Merge sparse categories, drop the variable, or collect more data.'
  );
}

function buildSyntax(
  ds: Dataset,
  depVar: Variable,
  levels: Array<number | string>,
  event: 'higher' | 'lower',
  terms: Term[],
  o: { cut: number; showCI: boolean; confPct: number; showHL: boolean; maxIter: number; reference: ReferenceChoice },
): string {
  const lines = syntaxPreamble(ds);
  let dep = depVar.name;
  if (event === 'lower') {
    const lit = (v: number | string) => (typeof v === 'number' ? String(v) : `'${v}'`);
    dep = `${depVar.name}_event`.slice(0, 64);
    lines.push('* Recode so that the chosen event (the lower value) is the higher code, as SPSS models the higher code.');
    lines.push(`RECODE ${depVar.name} (${lit(levels[0])}=1) (${lit(levels[1])}=0) INTO ${dep}.`, 'EXECUTE.');
  }
  lines.push(`LOGISTIC REGRESSION VARIABLES ${dep}`, `  /METHOD=ENTER ${terms.map((t) => t.variable.name).join(' ')}`);
  const factors = terms.filter((t) => t.kind === 'factor' && t.levels && t.levels.length > 1);
  if (factors.length) {
    lines.push(`  /CATEGORICAL=${factors.map((t) => t.variable.name).join(' ')}`);
    for (const t of factors) {
      const pos = (t.levels ?? []).findIndex((l) => l.value === t.refValue) + 1;
      lines.push(pos === t.levels!.length ? `  /CONTRAST (${t.variable.name})=Indicator` : `  /CONTRAST (${t.variable.name})=Indicator(${pos})`);
    }
  }
  const print: string[] = [];
  if (o.showHL) print.push('GOODFIT');
  if (o.showCI) print.push(`CI(${levelText(o.confPct / 100)})`);
  if (print.length) lines.push(`  /PRINT=${print.join(' ')}`);
  lines.push(`  /CRITERIA=PIN(.05) POUT(.10) ITERATE(${o.maxIter}) CUT(${noLead(o.cut, 2)}).`);
  return lines.join('\n');
}

