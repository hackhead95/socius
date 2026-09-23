// Multinomial Logistic Regression (SPSS NOMREG): baseline-category logit for an unordered outcome.

import type { Dataset, Variable } from '../../core/types';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import type { Cell, OutputBlock, OutputTable } from '../../core/output';
import { categoryLabel, requireVariable } from '../../core/data';
import { chi2Sf } from '../../lib/stats/distributions';
import { expCI, fitMultinomial, multinomialNullLogLik, pseudoR2, screenCollinear, type MultinomialFit } from '../../lib/stats/logistic';
import { sum } from '../../lib/stats/models-util';
import {
  buildTerms,
  caseNote,
  cell,
  coefCell,
  countPatterns,
  dfText,
  fmtP,
  footName,
  hcell,
  heading,
  levelsOf,
  listText,
  makeItem,
  marginalCaseSummary,
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
  textName,
  type ReferenceChoice,
  type Term,
} from './common';
import { oddsPhrase } from './binary';

interface Col {
  x: Float64Array;
  term: Term;
  level: number;
  name: string;
}

export const multinomialLogistic: ProcedureDef = {
  id: 'models.multinomial',
  menu: 'Regression',
  title: 'Multinomial Logistic Regression',
  description: 'Predict an unordered outcome with three or more categories (for example party preference) from several predictors.',
  guidance:
    'Each outcome category is compared with a reference category, giving one set of odds ratios per comparison. ' +
    'Needs a reasonable number of cases in every outcome category; merge very small categories first.',
  slots: [
    { key: 'dependent', label: 'Dependent (categories)', min: 1, max: 1, measures: ['nominal'], help: 'An unordered categorical outcome.' },
    { key: 'predictors', label: 'Predictors', min: 1, max: Infinity, help: 'Nominal/ordinal variables with value labels are treated as factors (dummy-coded).' },
  ],
  options: [
    {
      key: 'outcomeRef',
      label: 'Reference category of the outcome',
      type: 'select',
      default: 'last',
      choices: [
        { value: 'last', label: 'Last (highest code), SPSS default' },
        { value: 'first', label: 'First (lowest code)' },
        { value: 'frequent', label: 'Most frequent' },
      ],
      group: 'Dependent',
    },
    { key: 'dummy', label: 'Treat nominal/ordinal predictors as factors', type: 'checkbox', default: true, group: 'Categorical predictors' },
    {
      key: 'reference',
      label: 'Reference category for factors',
      type: 'select',
      default: 'first',
      choices: [
        { value: 'first', label: 'First (lowest code)' },
        { value: 'last', label: 'Last (highest code), SPSS default' },
        { value: 'frequent', label: 'Most frequent' },
      ],
      group: 'Categorical predictors',
    },
    { key: 'classification', label: 'Classification table', type: 'checkbox', default: true, group: 'Output' },
    { key: 'confLevel', label: 'Confidence level (%)', type: 'number', default: 95, min: 50, max: 99.9, step: 1, group: 'Output' },
    { key: 'maxIter', label: 'Maximum iterations', type: 'number', default: 100, min: 5, max: 1000, step: 5, group: 'Output' },
  ],
  validate: (ds, v) => {
    const dep = slot(v, 'dependent')[0];
    if (dep && slot(v, 'predictors').includes(dep)) return 'The dependent variable cannot also be a predictor.';
    return null;
  },
  run: (ds, v, o) => runMultinomial(ds, v, o),
};

function tbl(t: OutputTable): OutputBlock {
  return { kind: 'table', table: t };
}

function runMultinomial(ds: Dataset, vars: SlotValues, opts: OptionValues) {
  const depId = slot(vars, 'dependent')[0];
  const predIds = slot(vars, 'predictors');
  if (!depId) throw new Error('Choose a dependent variable.');
  if (!predIds.length) throw new Error('Choose at least one predictor.');
  if (predIds.includes(depId)) throw new Error('The dependent variable cannot also be a predictor.');
  const outcomeRef = optStr<ReferenceChoice>(opts, 'outcomeRef', 'last');
  const dummy = optBool(opts, 'dummy', true);
  const reference = optStr<ReferenceChoice>(opts, 'reference', 'first');
  const showClass = optBool(opts, 'classification', true);
  const confPct = Math.min(Math.max(optNum(opts, 'confLevel', 95), 50), 99.9);
  const conf = confPct / 100;
  const maxIter = Math.round(optNum(opts, 'maxIter', 100));

  const depVar = requireVariable(ds, depId);
  const sel = selectAll(ds, [depId, ...predIds], 3);
  const w = sel.weights;
  const depVals = rawValues(ds, depVar, sel.rows);
  const depLevels = levelsOf(depVals, w);
  const J = depLevels.length;
  if (J < 2) throw new Error(`${depVar.name} has only one category among the cases used, so there is nothing to predict.`);
  if (J > 25) throw new Error(`${depVar.name} has ${J} categories. Multinomial logistic regression needs a manageable number of categories; recode it into fewer groups.`);
  let ref = outcomeRef === 'first' ? 0 : J - 1;
  if (outcomeRef === 'frequent') {
    ref = 0;
    for (let j = 1; j < J; j++) if (depLevels[j].count > depLevels[ref].count) ref = j;
  }
  const idxOf = new Map(depLevels.map((l, i) => [l.value, i]));
  const y = Int32Array.from(depVals, (v) => idxOf.get(v)!);
  const catLabel = (j: number) => categoryLabel(depVar, depLevels[j].value);

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
  const p = X.length;
  const W = sum(w);

  const fit = fitMultinomial(y, J, ref, X, w, { maxIter });
  const ll0 = multinomialNullLogLik(y, J, w);
  const chi = -2 * ll0 - fit.m2ll;
  const dfModel = (J - 1) * p;
  const pModel = chi2Sf(chi, dfModel);
  const pr = pseudoR2(ll0, fit.logLik, W);
  const usedTerms = terms.filter((t) => cols.some((c) => c.term === t));

  const blocks: OutputBlock[] = [heading(`Multinomial Logistic Regression: ${footName(depVar)}`)];
  const factorTerms = terms.filter((t) => t.kind === 'factor' && t.cols.length > 0);
  blocks.push(tbl(marginalCaseSummary(depVar, depLevels, factorTerms, sel, countPatterns(X, y.length))));
  blocks.push(
    tbl({
      title: 'Model Fitting Information',
      header: [
        [hcell('Model', { rowSpan: 2 }), hcell('Model Fitting Criteria'), hcell('Likelihood Ratio Tests', { colSpan: 3 })],
        [hcell('-2 Log Likelihood'), hcell('Chi-Square'), hcell('df'), hcell('Sig.')],
      ],
      rows: [
        [cell('Intercept Only', 'text'), cell(-2 * ll0, 'dec3'), cell(null), cell(null), cell(null)],
        [cell('Final', 'text'), cell(fit.m2ll, 'dec3'), cell(chi, 'dec3'), cell(dfModel, 'int'), pCell(pModel)],
      ],
    }),
  );
  blocks.push(
    tbl({
      title: 'Pseudo R-Square',
      header: [[hcell(''), hcell('')]],
      rows: [
        [cell('Cox and Snell', 'text'), cell(pr.coxSnell, 'r')],
        [cell('Nagelkerke', 'text'), cell(pr.nagelkerke, 'r')],
        [cell('McFadden', 'text'), cell(pr.mcfadden, 'r')],
      ],
    }),
  );

  // Likelihood Ratio Tests per effect
  const lrByTerm = new Map<Term, { m2ll: number; chi: number; df: number; p: number }>();
  {
    const rows: Cell[][] = [];
    for (const t of usedTerms) {
      const keep = cols.map((c, j) => (c.term === t ? -1 : j)).filter((j) => j >= 0);
      const red = fitMultinomial(y, J, ref, keep.map((j) => X[j]), w, { maxIter });
      const c = Math.max(red.m2ll - fit.m2ll, 0);
      const df = (J - 1) * (p - keep.length);
      const pv = chi2Sf(c, df);
      lrByTerm.set(t, { m2ll: red.m2ll, chi: c, df, p: pv });
      rows.push([cell(t.variable.name, 'text'), cell(red.m2ll, 'dec3'), cell(c, 'dec3'), cell(df, 'int'), pCell(pv)]);
    }
    blocks.push(
      tbl({
        title: 'Likelihood Ratio Tests',
        header: [
          [hcell('Effect', { rowSpan: 2 }), hcell('Model Fitting Criteria'), hcell('Likelihood Ratio Tests', { colSpan: 3 })],
          [hcell('-2 Log Likelihood of Reduced Model'), hcell('Chi-Square'), hcell('df'), hcell('Sig.')],
        ],
        rows,
        footnotes: ['The chi-square statistic is the difference in -2 log-likelihoods between the final model and a reduced model. The reduced model is formed by omitting an effect from the final model. The null hypothesis is that all parameters of that effect are 0.'],
      }),
    );
  }

  // Parameter Estimates
  {
    const header: Cell[][] = [
      [hcell(depVar.name, { colSpan: 2, rowSpan: 2, mark: 'a' }), hcell('B', { rowSpan: 2 }), hcell('Std. Error', { rowSpan: 2 }), hcell('Wald', { rowSpan: 2 }), hcell('df', { rowSpan: 2 }), hcell('Sig.', { rowSpan: 2 }), hcell('Exp(B)', { rowSpan: 2 }), hcell(`${confPct.toFixed(0)}% Confidence Interval for Exp(B)`, { colSpan: 2 })],
      [hcell('Lower Bound'), hcell('Upper Bound')],
    ];
    const rows: Cell[][] = [];
    const rules: number[] = [];
    let anyRedundant = false;
    fit.cats.forEach((cat, k) => {
      const group: Cell[][] = [];
      const pr1 = (label: string, j: number): Cell[] => {
        const b = fit.coef[k][j], se = fit.se[k][j];
        const wald = (b / se) ** 2;
        const r: Cell[] = [cell(label, 'text'), coefCell(b), coefCell(se), cell(wald, 'dec3'), cell(1, 'int'), pCell(chi2Sf(wald, 1))];
        if (j === 0) r.push(cell(null), cell(null), cell(null));
        else {
          const [lo, hi] = expCI(b, se, conf);
          r.push(cell(Math.exp(b), 'dec3'), cell(lo, 'dec3'), cell(hi, 'dec3'));
        }
        return r;
      };
      group.push(pr1('Intercept', 0));
      for (const t of usedTerms) {
        const idx = cols.map((c, j) => (c.term === t ? j : -1)).filter((j) => j >= 0);
        if (t.kind === 'factor') {
          for (const lv of t.levels ?? []) {
            if (lv.value === t.refValue) {
              anyRedundant = true;
              group.push([cell(`[${t.variable.name} = ${categoryLabel(t.variable, lv.value)}]`, 'text'), cell(0, 'coef', { mark: 'b' }), cell(null), cell(null), cell(0, 'int'), cell(null), cell(null), cell(null), cell(null)]);
              continue;
            }
            const j = idx.find((jj) => cols[jj].term.levelValues[cols[jj].level] === lv.value);
            if (j !== undefined) group.push(pr1(`[${t.variable.name} = ${categoryLabel(t.variable, lv.value)}]`, j + 1));
          }
        } else for (const j of idx) group.push(pr1(cols[j].name, j + 1));
      }
      if (rows.length) rules.push(rows.length);
      group.forEach((r, i) => rows.push(i === 0 ? [cell(catLabel(cat), 'text', { rowSpan: group.length, bold: true }), ...r] : r));
    });
    const foot = [`a. The reference category is: ${catLabel(ref)}.`];
    if (anyRedundant) foot.push('b. This parameter is set to zero because it is redundant (reference category of the factor).');
    if (!fit.converged) foot.push('The estimates did not converge and should not be trusted.');
    blocks.push(tbl({ title: 'Parameter Estimates', header, rows, stubColumns: 2, ruleBefore: rules, footnotes: foot }));
  }

  // Classification
  let pctCorrect = NaN;
  if (showClass) {
    const m = Array.from({ length: J }, () => new Array<number>(J).fill(0));
    for (let i = 0; i < y.length; i++) m[y[i]][predictCategory(fit, X, i)] += w[i];
    const rowsC: Cell[][] = [];
    let correct = 0;
    const colTotals = new Array<number>(J).fill(0);
    for (let a = 0; a < J; a++) {
      const tot = m[a].reduce((s, v) => s + v, 0);
      correct += m[a][a];
      m[a].forEach((v, b) => (colTotals[b] += v));
      rowsC.push([cell(catLabel(a), 'text'), ...m[a].map((v) => cntCell(v)), cell(tot ? (100 * m[a][a]) / tot : NaN, 'dec1')]);
    }
    pctCorrect = (100 * correct) / W;
    rowsC.push([cell('Overall Percentage', 'text'), ...colTotals.map((v) => cell((100 * v) / W, 'pct')), cell(pctCorrect, 'dec1', { bold: true })]);
    blocks.push(
      tbl({
        title: 'Classification',
        header: [
          [hcell('Observed', { rowSpan: 2 }), hcell('Predicted', { colSpan: J + 1 })],
          [...depLevels.map((_, j) => hcell(catLabel(j))), hcell('Percent Correct')],
        ],
        rows: rowsC,
        ruleBefore: [J],
      }),
    );
  }

  // Warnings
  if (!fit.converged || fit.singular)
    warnings.push(`The model did not converge${fit.singular ? ' (unexpected singularities in the Hessian matrix)' : ''}. This usually means some combination of predictor and outcome categories is empty (separation). Estimates are unreliable; merge sparse categories or drop predictors.`);
  const bigSE: string[] = [];
  fit.cats.forEach((cat, k) => cols.forEach((c, j) => { if (fit.se[k][j + 1] > 5) bigSE.push(`${c.name} (${catLabel(cat)})`); }));
  if (bigSE.length) warnings.push(`Very large standard errors for ${listText(bigSE.slice(0, 6))}${bigSE.length > 6 ? ' and others' : ''} suggest sparse cells or separation. Interpret these estimates with great care.`);
  const minCat = Math.min(...depLevels.map((l) => l.count));
  const nPar = (J - 1) * (p + 1);
  if (minCat < 10) warnings.push(`The smallest outcome category has only ${num(minCat, 0)} cases. Estimates involving it will be imprecise; consider merging categories.`);
  if (W / nPar < 10) warnings.push(`Only ${num(W / nPar, 1)} cases per estimated parameter (${nPar} parameters). Results may be unstable.`);
  if (J === 2) notes.push(`${depVar.name} has only two categories, so this model is identical to a binary logistic regression.`);
  for (const t of warnings) blocks.push(textBlock('warning', t));
  for (const t of notes) blocks.push(textBlock('note', t));

  // Interpretation
  const depText = textName(depVar);
  const refLab = catLabel(ref);
  const ip: string[] = [];
  ip.push(
    pModel < 0.05
      ? `The predictors together improve the prediction of ${depText} significantly compared with a model with no predictors (${fmtP(pModel)}); Nagelkerke R² = ${noLead(pr.nagelkerke)}.`
      : `The predictors together do not significantly improve the prediction of ${depText} compared with a model with no predictors (${fmtP(pModel)}).`,
  );
  const sigT = usedTerms.filter((t) => (lrByTerm.get(t)?.p ?? 1) < 0.05).map((t) => t.variable.name);
  const nsT = usedTerms.filter((t) => !((lrByTerm.get(t)?.p ?? 1) < 0.05)).map((t) => t.variable.name);
  if (sigT.length) ip.push(`According to the likelihood ratio tests, ${listText(sigT)} ${sigT.length === 1 ? 'is' : 'are'} significantly related to ${depText}.`);
  if (nsT.length) ip.push(sigT.length ? `The other predictor${nsT.length === 1 ? '' : 's'} (${listText(nsT)}) ${nsT.length === 1 ? 'is' : 'are'} not (p ≥ .05).` : `None of the predictors (${listText(nsT)}) is significantly related to ${depText} on its own (p ≥ .05).`);
  ip.push(`Each outcome category is compared with "${refLab}".`);
  const details: string[] = [];
  fit.cats.forEach((cat, k) => {
    cols.forEach((c, j) => {
      const b = fit.coef[k][j + 1], se = fit.se[k][j + 1];
      const pv = chi2Sf((b / se) ** 2, 1);
      if (!(pv < 0.05) || !((lrByTerm.get(c.term)?.p ?? 1) < 0.05)) return;
      const or = Math.exp(b);
      const odds = `the odds of "${catLabel(cat)}" rather than "${refLab}"`;
      if (c.term.kind === 'factor') details.push(`for ${c.term.variable.name} = ${c.term.levelLabels[c.level]} (compared with ${c.term.refLabel}), ${odds} are ${oddsPhrase(or)} (${fmtP(pv)})`);
      else details.push(`each one-unit increase in ${textName(c.term.variable)} multiplies ${odds} by ${num(or, 2)} (${fmtP(pv)})`);
    });
  });
  if (details.length) ip.push(`Holding the other predictors constant: ${details.slice(0, 8).join('; ')}${details.length > 8 ? '; see the Parameter Estimates table for the rest' : ''}.`);
  if (Number.isFinite(pctCorrect)) ip.push(`The model classifies ${pctCorrect.toFixed(1)}% of cases correctly (the largest category alone is ${((100 * Math.max(...depLevels.map((l) => l.count))) / W).toFixed(1)}%).`);
  blocks.push(textBlock('interpretation', ip.join(' ')));

  const apa: string[] = [
    `A multinomial logistic regression was conducted to predict ${depText} (reference category: ${refLab}) from ${listText(terms.map((t) => t.variable.name))}. ` +
      `The model ${pModel < 0.05 ? 'fit significantly better' : 'did not fit significantly better'} than the intercept-only model, χ²(${dfModel}, N = ${dfText(W)}) = ${num(chi, 2)}, ${fmtP(pModel)}, Nagelkerke R² = ${noLead(pr.nagelkerke)}.`,
  ];
  const lrApa = usedTerms.map((t) => {
    const r = lrByTerm.get(t)!;
    return `${t.variable.name}, χ²(${r.df}) = ${num(r.chi, 2)}, ${fmtP(r.p)}`;
  });
  if (lrApa.length) apa.push(`Likelihood ratio tests: ${lrApa.join('; ')}.`);
  blocks.push(textBlock('apa', apa.join(' ')));

  const syntax = buildSyntax(ds, depVar, terms, ref === 0 ? 'FIRST' : ref === J - 1 ? 'LAST' : depLevels[ref].value, confPct, maxIter);
  return makeItem(multinomialLogistic.id, 'Multinomial Logistic Regression', ds, blocks, syntax, caseNote(ds, sel));
}

function cntCell(x: number): Cell {
  return Number.isInteger(x) ? cell(x, 'int') : cell(x, 'dec1');
}

function predictCategory(fit: MultinomialFit, X: ArrayLike<number>[], i: number): number {
  let best = fit.ref, bestEta = 0;
  fit.cats.forEach((cat, k) => {
    let e = fit.coef[k][0];
    for (let j = 0; j < X.length; j++) e += fit.coef[k][j + 1] * X[j][i];
    if (e > bestEta) {
      bestEta = e;
      best = cat;
    }
  });
  return best;
}

function buildSyntax(ds: Dataset, depVar: Variable, terms: Term[], base: string | number, confPct: number, maxIter: number): string {
  const lines = syntaxPreamble(ds);
  const compute = terms.flatMap((t) => t.syntaxCompute);
  if (compute.length) lines.push('* Dummy variables for categorical predictors (reference category left out).', ...compute, 'EXECUTE.');
  const baseText = typeof base === 'number' ? String(base) : base === 'FIRST' || base === 'LAST' ? base : `'${base}'`;
  lines.push(
    `NOMREG ${depVar.name} (BASE=${baseText} ORDER=ASCENDING) WITH ${terms.flatMap((t) => t.syntaxNames).join(' ')}`,
    `  /CRITERIA CIN(${Number(confPct.toFixed(1))}) DELTA(0) MXITER(${maxIter}) MXSTEP(5) CHKSEP(20) LCONVERGE(0) PCONVERGE(0.000001) SINGULAR(0.00000001)`,
    `  /MODEL`,
    '  /STEPWISE=PIN(.05) POUT(0.1) MINEFFECT(0) RULE(SINGLE) ENTRYMETHOD(LR) REMOVALMETHOD(LR)',
    '  /INTERCEPT=INCLUDE',
    '  /PRINT=CLASSTABLE PARAMETER SUMMARY LRT CPS STEP MFI.',
  );
  return lines.join('\n');
}
