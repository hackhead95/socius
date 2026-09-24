// Ordinal Regression (SPSS PLUM, logit link): proportional-odds cumulative logit model.
// SPSS parameterisation: logit P(Y <= j) = threshold_j - (location), so a positive location
// estimate means higher outcome categories become more likely.

import { ciOption, confLevel, labelOf, levelText } from '../text';
import type { Dataset, Variable } from '../../core/types';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import type { Cell, OutputBlock, OutputTable } from '../../core/output';
import { selMissing } from '../core/common';
import { requireVariable } from '../../core/data';
import { chi2Sf } from '../../lib/stats/distributions';
import { pseudoR2, screenCollinear } from '../../lib/stats/logistic';
import { cumulativeNullLogLik, fitCumulativeLogit, ordinalGoodnessOfFit, waldCI } from '../../lib/stats/ordinal';
import { sum } from '../../lib/stats/models-util';
import {
  buildTerms,
  capitalize,
  caseNote,
  cell,
  coefCell,
  countPatterns,
  describeCols,
  dfText,
  emptyOutcomeCells,
  fmtP,
  footName,
  hcell,
  heading,
  HESSIAN_SINGULARITY_WARNING,
  levelsOf,
  listText,
  makeItem,
  marginalCaseSummary,
  noLead,
  num,
  optBool,
  optNum,
  optStr,
  patternKeyFn,
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

export const ordinalRegression: ProcedureDef = {
  id: 'models.ordinal',
  menu: 'Regression',
  title: 'Ordinal Regression',
  description: 'Predict an ordered outcome such as a Likert item (strongly disagree ... strongly agree) with a proportional-odds (cumulative logit) model.',
  guidance:
    'Use when the outcome has ordered categories but the distances between them are not known. ' +
    'The model assumes each predictor has the same effect at every cut-point of the outcome (proportional odds); the Test of Parallel Lines checks this.',
  slots: [
    { key: 'dependent', label: 'Dependent (ordered categories)', min: 1, max: 1, measures: ['ordinal'], help: 'Categories are ordered by their codes (lowest first).' },
    { key: 'predictors', label: 'Predictors', min: 1, max: Infinity, help: 'Nominal/ordinal variables with value labels are treated as factors (dummy-coded).' },
  ],
  options: [
    { key: 'dummy', label: 'Treat nominal/ordinal predictors as factors', type: 'checkbox', default: true, group: 'Categorical predictors' },
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
    { key: 'parallel', label: 'Test of parallel lines', type: 'checkbox', default: true, group: 'Output' },
    { key: 'gof', label: 'Goodness-of-fit statistics', type: 'checkbox', default: true, group: 'Output' },
    ciOption('confLevel', 'Confidence level (%)', 'Output'),
    { key: 'maxIter', label: 'Maximum iterations', type: 'number', default: 100, min: 5, max: 1000, step: 5, group: 'Output' },
  ],
  validate: (ds, v) => {
    const dep = slot(v, 'dependent')[0];
    if (dep && slot(v, 'predictors').includes(dep)) return 'The dependent variable cannot also be a predictor.';
    return null;
  },
  run: (ds, v, o) => runOrdinal(ds, v, o),
};

function tbl(t: OutputTable): OutputBlock {
  return { kind: 'table', table: t };
}

function runOrdinal(ds: Dataset, vars: SlotValues, opts: OptionValues) {
  const depId = slot(vars, 'dependent')[0];
  const predIds = slot(vars, 'predictors');
  if (!depId) throw new Error('Choose a dependent variable.');
  if (!predIds.length) throw new Error('Choose at least one predictor.');
  if (predIds.includes(depId)) throw new Error('The dependent variable cannot also be a predictor.');
  const dummy = optBool(opts, 'dummy', true);
  const reference = optStr<ReferenceChoice>(opts, 'reference', 'first');
  const showParallel = optBool(opts, 'parallel', true);
  const showGof = optBool(opts, 'gof', true);
  const confPct = confLevel(opts, 'confLevel', 'Confidence level (%)') * 100;
  const maxIter = Math.round(optNum(opts, 'maxIter', 100));

  const depVar = requireVariable(ds, depId);
  const sel = selectAll(ds, [depId, ...predIds], 3);
  const w = sel.weights;
  const depVals = rawValues(ds, depVar, sel.rows);
  const depLevels = levelsOf(depVals, w);
  const J = depLevels.length;
  if (J < 2) throw new Error(`${depVar.name} has only one category among the cases used, so there is nothing to predict.`);
  if (J > 30) throw new Error(`${depVar.name} has ${J} different values. Ordinal regression is meant for a small number of ordered categories; for a quantity use Linear Regression.`);
  const idxOf = new Map(depLevels.map((l, i) => [l.value, i]));
  const y = Int32Array.from(depVals, (v) => idxOf.get(v)!);

  const terms = buildTerms(ds, predIds, sel.rows, w, { dummy, reference });
  const allCols: Col[] = [];
  for (const t of terms) t.cols.forEach((x, l) => allCols.push({ x, term: t, level: l, name: t.kind === 'factor' ? `${t.variable.name}: ${t.levelLabels[l]}` : t.variable.name }));
  const warnings: string[] = [];
  const notes: string[] = [];
  for (const t of terms) if (t.kind === 'factor' && t.cols.length === 0) warnings.push(`${t.variable.name} has only one category among the cases used, so it was left out.`);
  const screen = screenCollinear(allCols.map((c) => c.x), w);
  if (screen.dropped.length) warnings.push(`Left out because they are constant or exact combinations of other predictors (redundant): ${listText(screen.dropped.map((j) => allCols[j].name))}.`);
  const cols = screen.kept.map((j) => allCols[j]);
  const X = cols.map((c) => c.x);
  const q = X.length;
  const W = sum(w);

  const fit = fitCumulativeLogit(y, J, X, w, { maxIter });
  const ll0 = cumulativeNullLogLik(y, J, w);
  // The likelihood-ratio statistic cannot be negative (the null model is nested); a tiny negative value is rounding.
  const chi = Math.max(0, -2 * ll0 - fit.m2ll);
  const pModel = chi2Sf(chi, q);
  const pr = pseudoR2(ll0, fit.logLik, W);
  const nPatterns = countPatterns(X, y.length);

  const blocks: OutputBlock[] = [heading(`Ordinal Regression: ${footName(depVar)}`)];
  const isUnstable = (r: number) => fit.unstable[r] === 1;
  const anyUnstable = fit.unstable.some((u) => u === 1);
  const separated = fit.singular || fit.diverged || anyUnstable;
  if (separated) {
    if (fit.singular) warnings.push(`${HESSIAN_SINGULARITY_WARNING} The procedure continues despite this warning; the results shown are based on the last iteration.`);
    const usedTerms = terms.filter((t) => cols.some((c) => c.term === t));
    const catLab = (j: number) => labelOf(depVar, depLevels[j].value);
    const cells = emptyOutcomeCells(usedTerms, y, J, w)
      .map((c) => ({ c, only: [...Array(J).keys()].filter((j) => !c.empty.includes(j)) }))
      .filter(({ only }) => only.length === 1 && (only[0] === 0 || only[0] === J - 1));
    const affected: string[] = [];
    for (let r = 0; r < fit.params.length; r++) {
      if (!isUnstable(r)) continue;
      if (r < J - 1) affected.push(`the threshold for ${depVar.name} = "${catLab(r)}"`);
      else {
        const c = cols[r - (J - 1)];
        affected.push(c.term.kind === 'factor' ? `${c.term.variable.name} = "${c.term.levelLabels[c.level]}"` : c.name);
      }
    }
    const parts: string[] = [];
    if (cells.length)
      parts.push(
        `Quasi-complete separation: ${cells
          .map(({ c, only }) => `all cases with ${c.term.variable.name} = "${c.label}" have ${depVar.name} = "${catLab(only[0])}", the ${only[0] === 0 ? 'lowest' : 'highest'} category`)
          .join('; ')}. The model can always fit those cases better by moving their estimate further towards infinity, so no finite best estimate exists.`,
      );
    else parts.push('Separation: some predictor values perfectly predict the outcome category, so some estimates grow without limit and no finite best estimate exists.');
    if (affected.length)
      parts.push(
        affected.length === 1
          ? `The estimate for ${affected[0]} is affected: it is marked b in the Parameter Estimates table, its standard error is huge, and its test is meaningless. The other estimates, standard errors and tests are not affected and can be read as usual.`
          : `The estimates for ${listText(affected)} are affected: they are marked b in the Parameter Estimates table, their standard errors are huge, and their tests are meaningless. The other estimates, standard errors and tests are not affected and can be read as usual.`,
      );
    parts.push(cells.length ? `To get usable estimates for every parameter, ${cells.map(({ c }) => `merge "${c.label}" with another category of ${c.term.variable.name}`).join(', or ')}, or merge sparse outcome categories.` : 'Merge sparse categories or leave out the predictor involved.');
    warnings.push(parts.join(' '));
  } else if (!fit.converged)
    warnings.push(`The model did not converge within ${maxIter} iterations. Estimates are unreliable; this usually means sparse categories. Merge rare outcome or predictor categories, or allow more iterations.`);
  const factorTerms = terms.filter((t) => t.kind === 'factor' && t.cols.length > 0);
  blocks.push(tbl(marginalCaseSummary(depVar, depLevels, factorTerms, sel, nPatterns, selMissing(ds, sel))));
  blocks.push(
    tbl({
      title: 'Model Fitting Information',
      header: [[hcell('Model'), hcell('-2 Log Likelihood'), hcell('Chi-Square'), hcell('df'), hcell('Sig.')]],
      rows: [
        [cell('Intercept Only', 'text'), cell(-2 * ll0, 'dec3'), cell(null), cell(null), cell(null)],
        [cell('Final', 'text'), cell(fit.m2ll, 'dec3'), cell(chi, 'dec3'), cell(q, 'int'), pCell(pModel)],
      ],
      footnotes: ['Link function: Logit.'],
    }),
  );
  let gof: ReturnType<typeof ordinalGoodnessOfFit> | null = null;
  if (showGof) {
    gof = ordinalGoodnessOfFit(fit, y, w, patternKeyFn(X));
    const foot = ['Link function: Logit.'];
    if (gof.zeroCells > 0) foot.push(`There are ${gof.zeroCells} (${((100 * gof.zeroCells) / gof.totalCells).toFixed(1)}%) cells (dependent variable levels by combinations of predictor values) with zero frequencies.`);
    blocks.push(
      tbl({
        title: 'Goodness-of-Fit',
        header: [[hcell(''), hcell('Chi-Square'), hcell('df'), hcell('Sig.')]],
        rows: [
          [cell('Pearson', 'text'), cell(gof.pearson, 'dec3'), cell(gof.df, 'int'), cell(gof.pPearson, 'p')],
          [cell('Deviance', 'text'), cell(gof.deviance, 'dec3'), cell(gof.df, 'int'), cell(gof.pDeviance, 'p')],
        ],
        footnotes: foot,
      }),
    );
    if (gof.zeroCells / gof.totalCells > 0.2)
      notes.push('Many cells of the goodness-of-fit table are empty (typical with continuous predictors), so the Pearson and Deviance tests are unreliable here. Rely on the Model Fitting Information and the Test of Parallel Lines instead.');
  }
  blocks.push(
    tbl({
      title: 'Pseudo R-Square',
      header: [[hcell(''), hcell('')]],
      rows: [
        [cell('Cox and Snell', 'text'), cell(pr.coxSnell, 'r')],
        [cell('Nagelkerke', 'text'), cell(pr.nagelkerke, 'r')],
        [cell('McFadden', 'text'), cell(pr.mcfadden, 'r')],
      ],
      footnotes: ['Link function: Logit.'],
    }),
  );

  // Parameter Estimates
  const conf = confPct / 100;
  {
    const header: Cell[][] = [
      [hcell('', { colSpan: 2, rowSpan: 2 }), hcell('Estimate', { rowSpan: 2 }), hcell('Std. Error', { rowSpan: 2 }), hcell('Wald', { rowSpan: 2 }), hcell('df', { rowSpan: 2 }), hcell('Sig.', { rowSpan: 2 }), hcell(`${levelText(confPct / 100)}% Confidence Interval`, { colSpan: 2 })],
      [hcell('Lower Bound'), hcell('Upper Bound')],
    ];
    let anyMarked = false;
    const paramRow = (label: string, r: number): Cell[] => {
      const est = fit.params[r], se = fit.se[r];
      const wald = (est / se) ** 2;
      const [lo, hi] = waldCI(est, se, conf);
      const seCell = coefCell(se);
      if (isUnstable(r)) {
        seCell.mark = 'b';
        anyMarked = true;
      }
      return [cell(label, 'text'), coefCell(est, 'coef', se), seCell, cell(wald, 'dec3'), cell(1, 'int'), pCell(chi2Sf(wald, 1)), coefCell(lo), coefCell(hi)];
    };
    const thrRows: Cell[][] = [];
    for (let j = 0; j < J - 1; j++) thrRows.push(paramRow(`[${depVar.name} = ${labelOf(depVar, depLevels[j].value)}]`, j));
    const locRows: Cell[][] = [];
    let anyRedundant = false;
    for (const t of terms) {
      const idx = cols.map((c, j) => (c.term === t ? j : -1)).filter((j) => j >= 0);
      if (t.kind === 'factor') {
        for (const lv of t.levels ?? []) {
          if (lv.value === t.refValue) {
            anyRedundant = true;
            locRows.push([cell(`[${t.variable.name} = ${labelOf(t.variable, lv.value)}]`, 'text'), cell(0, 'coef', { mark: 'a' }), cell(null), cell(null), cell(0, 'int'), cell(null), cell(null), cell(null)]);
            continue;
          }
          const j = idx.find((jj) => cols[jj].term.levelValues[cols[jj].level] === lv.value);
          if (j !== undefined) locRows.push(paramRow(`[${t.variable.name} = ${labelOf(t.variable, lv.value)}]`, J - 1 + j));
        }
      } else for (const j of idx) locRows.push(paramRow(cols[j].name, J - 1 + j));
    }
    const rows: Cell[][] = [
      ...thrRows.map((r, i) => (i === 0 ? [cell('Threshold', 'text', { rowSpan: thrRows.length }), ...r] : r)),
      ...locRows.map((r, i) => (i === 0 ? [cell('Location', 'text', { rowSpan: locRows.length }), ...r] : r)),
    ];
    const foot = ['Link function: Logit. Model: logit P(Y ≤ j) = Threshold_j − Location, so a positive location estimate means higher categories are more likely.'];
    if (anyRedundant) foot.push('a. This parameter is set to zero because it is redundant (reference category).');
    if (anyMarked) foot.push('b. Not a real estimate: because of separation (see the warnings) this parameter grows without limit with every iteration, so the value shown is where the iterations stopped. Its standard error is huge and its Wald test and significance are meaningless.');
    blocks.push(tbl({ title: 'Parameter Estimates', header, rows, stubColumns: 2, ruleBefore: locRows.length ? [thrRows.length] : [], footnotes: foot }));
  }

  // Test of Parallel Lines
  let parallelP = NaN;
  if (showParallel && J > 2 && q > 0) {
    try {
      const start = new Float64Array((J - 1) * (1 + q));
      for (let j = 0; j < J - 1; j++) {
        start[j * (1 + q)] = fit.params[j];
        for (let k = 0; k < q; k++) start[j * (1 + q) + 1 + k] = fit.params[J - 1 + k];
      }
      const gen = fitCumulativeLogit(y, J, X, w, { general: true, start, maxIter });
      const chiP = Math.max(fit.m2ll - gen.m2ll, 0);
      const dfP = q * (J - 2);
      parallelP = chi2Sf(chiP, dfP);
      const foot = [
        'The null hypothesis states that the location parameters (slope coefficients) are the same across response categories.',
        'Link function: Logit.',
      ];
      if (gen.diverged || gen.singular || gen.unstable.some((u) => u === 1)) foot.push('Some estimates of the general model grow without limit (separation); the test may be inaccurate.');
      else if (!gen.converged) foot.push('The general model did not converge; the test may be inaccurate.');
      blocks.push(
        tbl({
          title: 'Test of Parallel Lines',
          header: [[hcell('Model'), hcell('-2 Log Likelihood'), hcell('Chi-Square'), hcell('df'), hcell('Sig.')]],
          rows: [
            [cell('Null Hypothesis', 'text'), cell(fit.m2ll, 'dec3'), cell(null), cell(null), cell(null)],
            [cell('General', 'text'), cell(gen.m2ll, 'dec3'), cell(chiP, 'dec3'), cell(dfP, 'int'), cell(parallelP, 'p', parallelP < 0.05 ? { tone: 'warn' } : {})],
          ],
          footnotes: foot,
        }),
      );
      if (parallelP < 0.05)
        warnings.push(`The Test of Parallel Lines is significant (${fmtP(parallelP)}): the effects of the predictors seem to differ across the cut-points of ${depVar.name}, so the proportional-odds assumption may not hold. Consider Multinomial Logistic Regression or separate binary logistic regressions as a check. With large samples this test flags even small departures.`);
    } catch {
      notes.push('The general (non-parallel) model could not be estimated, so the Test of Parallel Lines is not shown. This often happens with sparse categories.');
    }
  }

  const nPar = J - 1 + q;
  if (W / nPar < 10) warnings.push(`Only ${num(W / nPar, 1)} cases per estimated parameter (${nPar} parameters). Estimates may be unstable.`);
  const minCat = Math.min(...depLevels.map((l) => l.count));
  if (minCat < 5) warnings.push(`Some categories of ${depVar.name} have very few cases (smallest: ${num(minCat, 0)}). Consider merging adjacent categories.`);
  const bigSE = cols.filter((_, j) => fit.se[J - 1 + j] > 5 && !isUnstable(J - 1 + j)).map((c) => c.name);
  if (bigSE.length) warnings.push(`Very large standard errors for ${listText(bigSE)} suggest sparse categories or separation. Interpret these estimates with great care.`);
  if (J === 2) notes.push(`${depVar.name} has only two categories, so this model is equivalent to a binary logistic regression (with the sign of the estimates reversed relative to the thresholds).`);
  for (const t of warnings) blocks.push(textBlock('warning', t));
  for (const t of notes) blocks.push(textBlock('note', t));

  // Interpretation
  // One naming convention for every sentence: labels only if all the variables have usable labels.
  const nm = proseNamer([depVar, ...terms.map((t) => t.variable)]);
  const depText = nm(depVar);
  const ip: string[] = [];
  const modelTestable = Number.isFinite(pModel) && q > 0;
  ip.push(
    !modelTestable
      ? 'No predictor could be estimated (constant or collinear predictors are left out), so the model cannot be compared with a model with thresholds only.'
      : pModel < 0.05
      ? `The model with predictors fits significantly better than a model with thresholds only (${fmtP(pModel)}); Nagelkerke pseudo R² = ${noLead(pr.nagelkerke)}.`
      : `The model with predictors does not fit significantly better than a model with thresholds only (${fmtP(pModel)}).`,
  );
  const sig: string[] = [];
  const nonsig: Col[] = [];
  cols.forEach((c, j) => {
    const r = J - 1 + j;
    if (isUnstable(r)) return;
    const pv = chi2Sf((fit.params[r] / fit.se[r]) ** 2, 1);
    const or = Math.exp(fit.params[r]);
    if (!(pv < 0.05)) {
      nonsig.push(c);
      return;
    }
    const change = or >= 1 ? `${num(or, 2)} times the odds` : `${num(or, 2)} times the odds (${((1 - or) * 100).toFixed(0)}% lower odds)`;
    if (c.term.kind === 'factor') sig.push(`compared with ${nm(c.term.variable)} = ${c.term.refLabel}, cases in the "${c.term.levelLabels[c.level]}" group have ${change} of being in a higher category of ${depText} (${fmtP(pv)})`);
    else sig.push(`each one-unit increase in ${nm(c.term.variable)} multiplies the odds of being in a higher category of ${depText} by ${num(or, 2)} (${fmtP(pv)})`);
  });
  sig.forEach((s, i) => ip.push(i === 0 && q > 1 ? `Holding the other predictors constant, ${s}.` : `${capitalize(s)}.`));
  if (nonsig.length) ip.push(`Not significantly related to ${depText} (p ≥ .05): ${listText(describeCols(nonsig, nm))}.`);
  if (anyUnstable) ip.push('Estimates affected by separation (marked b in the Parameter Estimates table) are left out of this summary.');
  if (J > 2) {
    const l0 = labelOf(depVar, depLevels[0].value), l1 = labelOf(depVar, depLevels[1].value);
    ip.push(`The odds ratios (exp of the location estimates) apply at every cut-point of the outcome: above "${l0}" versus at it, above "${l1}" versus at or below it, and so on.`);
  }
  blocks.push(textBlock('interpretation', ip.join(' ')));

  const apa: string[] = [
    `An ordinal logistic regression (proportional odds, logit link) was conducted to predict ${depText} from ${listText(terms.map((t) => nm(t.variable)))}. ` +
      (modelTestable
        ? `The final model ${pModel < 0.05 ? 'fit significantly better' : 'did not fit significantly better'} than the thresholds-only model, χ²(${q}, N = ${dfText(W)}) = ${num(chi, 2)}, ${fmtP(pModel)}, Nagelkerke pseudo R² = ${noLead(pr.nagelkerke)}.`
        : 'No predictor could be estimated, so the model was not tested against the thresholds-only model.'),
  ];
  if (Number.isFinite(parallelP)) apa.push(`The assumption of proportional odds was ${parallelP < 0.05 ? 'not ' : ''}supported by the test of parallel lines, ${fmtP(parallelP)}.`);
  const sigApa = cols
    .map((c, j) => ({ c, r: J - 1 + j }))
    .filter(({ r }) => !isUnstable(r) && chi2Sf((fit.params[r] / fit.se[r]) ** 2, 1) < 0.05)
    .map(({ c, r }) => {
      const [lo, hi] = waldCI(fit.params[r], fit.se[r], conf);
      return `${colProse(c, nm)} (b = ${num(fit.params[r], 2)}, SE = ${num(fit.se[r], 2)}, OR = ${num(Math.exp(fit.params[r]), 2)}, ${levelText(confPct / 100)}% CI [${num(Math.exp(lo), 2)}, ${num(Math.exp(hi), 2)}], ${fmtP(chi2Sf((fit.params[r] / fit.se[r]) ** 2, 1))})`;
    });
  if (sigApa.length) apa.push(`Significant predictors were ${listText(sigApa)}.`);
  blocks.push(textBlock('apa', apa.join(' ')));

  const syntax = buildSyntax(ds, depVar, terms, { showParallel, showGof, confPct, maxIter });
  return makeItem(ordinalRegression.id, 'Ordinal Regression', ds, blocks, syntax, caseNote(ds, sel));
}

function buildSyntax(ds: Dataset, depVar: Variable, terms: Term[], o: { showParallel: boolean; showGof: boolean; confPct: number; maxIter: number }): string {
  const lines = syntaxPreamble(ds);
  const compute = terms.flatMap((t) => t.syntaxCompute);
  if (compute.length) lines.push('* Dummy variables for categorical predictors (reference category left out).', ...compute, 'EXECUTE.');
  const withVars = terms.flatMap((t) => t.syntaxNames);
  const print = ['PARAMETER', 'SUMMARY'];
  if (o.showGof) print.unshift('FIT');
  if (o.showParallel) print.push('TPARALLEL');
  lines.push(
    `PLUM ${depVar.name} WITH ${withVars.join(' ')}`,
    `  /CRITERIA=CIN(${levelText(o.confPct / 100)}) DELTA(0) LCONVERGE(0) MXITER(${o.maxIter}) MXSTEP(5) PCONVERGE(1.0E-6) SINGULAR(1.0E-8)`,
    '  /LINK=LOGIT',
    `  /PRINT=${print.join(' ')}.`,
  );
  return lines.join('\n');
}
