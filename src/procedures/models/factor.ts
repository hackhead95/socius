// Factor Analysis (SPSS FACTOR): principal components or principal axis factoring, with
// varimax / promax / direct oblimin rotation, KMO and Bartlett's test, scree plot.

import type { Dataset, Variable } from '../../core/types';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import type { Cell, OutputBlock, OutputTable } from '../../core/output';
import { columnSS, correlationMatrix, extractFactors, kmoBartlett, rotate, sortOrder, type Extraction, type Rotation } from '../../lib/stats/factor';
import { sum } from '../../lib/stats/models-util';
import {
  caseNote,
  cell,
  chartBlock,
  fmtP,
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
  selectAll,
  slot,
  syntaxPreamble,
  textBlock,
  vars as varsOf,
} from './common';

export function kmoLabel(k: number): string {
  if (k >= 0.9) return 'marvelous';
  if (k >= 0.8) return 'meritorious';
  if (k >= 0.7) return 'middling';
  if (k >= 0.6) return 'mediocre';
  if (k >= 0.5) return 'miserable';
  return 'unacceptable';
}

export const factorAnalysis: ProcedureDef = {
  id: 'models.factor',
  menu: 'Dimension Reduction',
  title: 'Factor Analysis',
  description: 'Find a small number of underlying dimensions behind many items (for example attitude batteries) with principal components or principal axis factoring.',
  guidance:
    'Principal components (the SPSS default) summarise the items; principal axis factoring models the shared variance only and is usual for latent constructs. ' +
    'Use varimax when the dimensions should be independent, promax or direct oblimin when they may correlate (common for attitudes). ' +
    'Aim for at least 5 to 10 cases per variable and a KMO above .60.',
  slots: [{ key: 'variables', label: 'Variables', min: 3, max: Infinity, types: ['numeric'], help: 'At least three numeric variables (items).' }],
  options: [
    {
      key: 'extraction',
      label: 'Extraction method',
      type: 'select',
      default: 'pc',
      choices: [
        { value: 'pc', label: 'Principal components' },
        { value: 'paf', label: 'Principal axis factoring' },
      ],
      group: 'Extraction',
    },
    {
      key: 'criterion',
      label: 'Extract',
      type: 'select',
      default: 'eigen',
      choices: [
        { value: 'eigen', label: 'Based on eigenvalue' },
        { value: 'fixed', label: 'Fixed number of factors' },
      ],
      group: 'Extraction',
    },
    { key: 'minEigen', label: 'Eigenvalues greater than', type: 'number', default: 1, min: 0, max: 10, step: 0.1, group: 'Extraction' },
    { key: 'nFactors', label: 'Number of factors to extract', type: 'number', default: 2, min: 1, max: 50, step: 1, group: 'Extraction' },
    { key: 'maxIter', label: 'Maximum iterations for convergence', type: 'number', default: 25, min: 1, max: 1000, step: 1, group: 'Extraction' },
    { key: 'scree', label: 'Scree plot', type: 'checkbox', default: true, group: 'Extraction' },
    {
      key: 'rotation',
      label: 'Rotation',
      type: 'select',
      default: 'varimax',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'varimax', label: 'Varimax (orthogonal)' },
        { value: 'promax', label: 'Promax (oblique)' },
        { value: 'oblimin', label: 'Direct oblimin (oblique)' },
      ],
      group: 'Rotation',
    },
    { key: 'kappa', label: 'Promax kappa', type: 'number', default: 4, min: 1, max: 10, step: 1, group: 'Rotation' },
    { key: 'delta', label: 'Oblimin delta', type: 'number', default: 0, min: -5, max: 0.8, step: 0.1, group: 'Rotation' },
    { key: 'kmo', label: "KMO and Bartlett's test of sphericity", type: 'checkbox', default: true, group: 'Descriptives' },
    { key: 'corr', label: 'Correlation matrix and determinant', type: 'checkbox', default: false, group: 'Descriptives' },
    { key: 'sort', label: 'Sorted by size', type: 'checkbox', default: false, group: 'Options' },
    { key: 'suppress', label: 'Suppress small coefficients', type: 'checkbox', default: false, group: 'Options' },
    { key: 'suppressBelow', label: 'Absolute value below', type: 'number', default: 0.3, min: 0, max: 0.99, step: 0.05, group: 'Options' },
  ],
  run: (ds, v, o) => runFactor(ds, v, o),
};

function tbl(t: OutputTable): OutputBlock {
  return { kind: 'table', table: t };
}

function runFactor(ds: Dataset, vars: SlotValues, opts: OptionValues) {
  const ids = slot(vars, 'variables');
  if (ids.length < 3) throw new Error('Choose at least three variables.');
  if (new Set(ids).size !== ids.length) throw new Error('Each variable can be entered only once.');
  const method = optStr<Extraction>(opts, 'extraction', 'pc');
  const criterion = optStr<'eigen' | 'fixed'>(opts, 'criterion', 'eigen');
  const minEigen = optNum(opts, 'minEigen', 1);
  const nFixed = Math.round(optNum(opts, 'nFactors', 2));
  const maxIter = Math.round(optNum(opts, 'maxIter', 25));
  let rotation = optStr<Rotation>(opts, 'rotation', 'varimax');
  const kappa = optNum(opts, 'kappa', 4);
  const delta = optNum(opts, 'delta', 0);
  const doSort = optBool(opts, 'sort', false);
  const suppress = optBool(opts, 'suppress', false);
  const below = optNum(opts, 'suppressBelow', 0.3);

  const variables = varsOf(ds, ids);
  const p = variables.length;
  const sel = selectAll(ds, ids, p + 1);
  const w = sel.weights;
  const cols = variables.map((v) => numericValues(ds, v, sel.rows));
  const W = sum(w);
  const zeroVar = variables.filter((_, i) => {
    let mn = Infinity, mx = -Infinity;
    for (const x of cols[i]) {
      mn = Math.min(mn, x);
      mx = Math.max(mx, x);
    }
    return mn === mx;
  });
  if (zeroVar.length) throw new Error(`${listText(zeroVar.map((v) => v.name))} ${zeroVar.length === 1 ? 'has' : 'have'} the same value for every case used. Remove ${zeroVar.length === 1 ? 'it' : 'them'} before running the analysis.`);
  const R = correlationMatrix(cols, w);
  if (criterion === 'fixed' && nFixed > p) throw new Error(`You asked for ${nFixed} factors but there are only ${p} variables.`);
  const ex = extractFactors(R, { method, nFactors: criterion === 'fixed' ? nFixed : undefined, minEigen, maxIter });
  const m = ex.nFactors;
  const isPC = method === 'pc';
  const unit = isPC ? 'Component' : 'Factor';
  const extractionName = isPC ? 'Principal Component Analysis' : 'Principal Axis Factoring';
  const warnings: string[] = [];
  const notes: string[] = [];
  if (rotation !== 'none' && m < 2) {
    notes.push(`Only one ${unit.toLowerCase()} was extracted, so the solution cannot be rotated.`);
    rotation = 'none';
  }
  const rot = rotate(ex.loadings, rotation, { kappa, delta });
  const oblique = rotation === 'promax' || rotation === 'oblimin';
  const rotationName = rotation === 'varimax' ? 'Varimax with Kaiser Normalization' : rotation === 'promax' ? 'Promax with Kaiser Normalization' : rotation === 'oblimin' ? 'Oblimin with Kaiser Normalization' : '';

  const blocks: OutputBlock[] = [heading(`Factor Analysis: ${p} variables`)];
  const kb = kmoBartlett(R, W);
  if (optBool(opts, 'corr', false)) {
    blocks.push(
      tbl({
        title: 'Correlation Matrix',
        header: [[hcell(''), ...variables.map((v) => hcell(v.name))]],
        rows: variables.map((v, a) => [cell(v.name, 'text'), ...variables.map((_, b) => cell(R[a][b], 'r'))]),
        footnotes: [`Determinant = ${kb.determinant < 0.001 ? kb.determinant.toExponential(3) : kb.determinant.toFixed(3)}`],
      }),
    );
  }
  if (optBool(opts, 'kmo', true)) {
    blocks.push(
      tbl({
        title: "KMO and Bartlett's Test",
        header: [[hcell('', { colSpan: 2 }), hcell('')]],
        stubColumns: 2,
        rows: [
          [cell('Kaiser-Meyer-Olkin Measure of Sampling Adequacy.', 'text', { colSpan: 2 }), cell(kb.kmo, 'r', { tone: kb.kmo < 0.6 ? 'bad' : 'good' })],
          [cell("Bartlett's Test of Sphericity", 'text', { rowSpan: 3 }), cell('Approx. Chi-Square', 'text'), cell(kb.chi2, 'dec3')],
          [cell('df', 'text'), cell(kb.df, 'int')],
          [cell('Sig.', 'text'), cell(kb.p, 'p')],
        ],
        footnotes: Number.isNaN(kb.kmo) ? ['The correlation matrix is not positive definite, so KMO cannot be computed.'] : [],
      }),
    );
  }
  // Communalities
  blocks.push(
    tbl({
      title: 'Communalities',
      header: [[hcell(''), hcell('Initial'), hcell('Extraction')]],
      rows: variables.map((v, i) => [cell(v.name, 'text'), cell(ex.initialCommunalities[i], 'dec3'), cell(ex.communalities[i], 'dec3', ex.communalities[i] < 0.2 ? { tone: 'warn' } : ex.communalities[i] > 1 ? { tone: 'bad' } : {})]),
      footnotes: [`Extraction Method: ${extractionName}.`],
    }),
  );
  // Total Variance Explained
  {
    const extSS = columnSS(ex.loadings);
    const rotSS = rotation === 'none' ? [] : columnSS(oblique ? rot.structure : rot.pattern);
    const top: Cell[] = [hcell(unit, { rowSpan: 2 }), hcell('Initial Eigenvalues', { colSpan: 3 }), hcell('Extraction Sums of Squared Loadings', { colSpan: 3 })];
    const sub: Cell[] = [hcell('Total'), hcell('% of Variance'), hcell('Cumulative %'), hcell('Total'), hcell('% of Variance'), hcell('Cumulative %')];
    if (rotation !== 'none') {
      if (oblique) {
        top.push(hcell('Rotation Sums of Squared Loadings', { mark: 'a' }));
        sub.push(hcell('Total'));
      } else {
        top.push(hcell('Rotation Sums of Squared Loadings', { colSpan: 3 }));
        sub.push(hcell('Total'), hcell('% of Variance'), hcell('Cumulative %'));
      }
    }
    let cumI = 0, cumE = 0, cumR = 0;
    const rows = ex.eigenvalues.map((ev, i) => {
      cumI += ev;
      const r: Cell[] = [cell(i + 1, 'int'), cell(ev, 'dec3'), cell((100 * ev) / p, 'dec3'), cell((100 * cumI) / p, 'dec3')];
      if (i < m) {
        cumE += extSS[i];
        r.push(cell(extSS[i], 'dec3'), cell((100 * extSS[i]) / p, 'dec3'), cell((100 * cumE) / p, 'dec3'));
      } else r.push(cell(null), cell(null), cell(null));
      if (rotation !== 'none') {
        if (i < m) {
          if (oblique) r.push(cell(rotSS[i], 'dec3'));
          else {
            cumR += rotSS[i];
            r.push(cell(rotSS[i], 'dec3'), cell((100 * rotSS[i]) / p, 'dec3'), cell((100 * cumR) / p, 'dec3'));
          }
        } else r.push(...(oblique ? [cell(null)] : [cell(null), cell(null), cell(null)]));
      }
      return r;
    });
    const foot = [`Extraction Method: ${extractionName}.`];
    if (oblique) foot.push(`a. When ${unit.toLowerCase()}s are correlated, sums of squared loadings cannot be added to obtain a total variance.`);
    blocks.push(tbl({ title: 'Total Variance Explained', header: [top, sub], rows, footnotes: foot }));
  }
  if (optBool(opts, 'scree', true)) {
    blocks.push(
      chartBlock({
        type: 'line',
        title: 'Scree Plot',
        xLabel: `${unit} Number`,
        yLabel: 'Eigenvalue',
        categories: ex.eigenvalues.map((_, i) => String(i + 1)),
        series: [{ name: 'Eigenvalue', values: ex.eigenvalues.slice() }],
      }),
    );
  }

  const loadingTable = (title: string, L: number[][], foot: string[]): OutputBlock => {
    const order = doSort ? sortOrder(L) : variables.map((_, i) => i);
    return tbl({
      title,
      header: [
        [hcell('', { rowSpan: 2 }), hcell(unit, { colSpan: m })],
        Array.from({ length: m }, (_, k) => hcell(String(k + 1))),
      ],
      rows: order.map((i) => [cell(variables[i].name, 'text'), ...L[i].map((v) => (suppress && Math.abs(v) < below ? cell(null) : cell(v, 'coef', Math.abs(v) >= 0.4 ? { bold: true } : {})))]),
      footnotes: [...foot, ...(suppress ? [`Coefficients with absolute value below ${noLead(below, 2)} are not shown.`] : [])],
    });
  };
  const extFoot = [`Extraction Method: ${extractionName}.`, `${m} ${unit.toLowerCase()}${m === 1 ? '' : 's'} extracted.${!isPC ? ` ${ex.iterations} iterations required.` : ''}`];
  const signNote = 'Signs are oriented so that each column of loadings sums to a positive value.';
  blocks.push(loadingTable(`${unit} Matrix`, ex.loadings, [...extFoot, signNote]));
  if (rotation !== 'none') {
    const rotFoot = [`Extraction Method: ${extractionName}.`, `Rotation Method: ${rotationName}.`, rot.converged ? 'Rotation converged.' : `Rotation failed to converge in ${rot.iterations} iterations.`];
    if (!oblique) blocks.push(loadingTable(`Rotated ${unit} Matrix`, rot.pattern, [...rotFoot, signNote]));
    else {
      blocks.push(loadingTable('Pattern Matrix', rot.pattern, [...rotFoot, signNote]));
      blocks.push(loadingTable('Structure Matrix', rot.structure, rotFoot.slice(0, 2)));
      blocks.push(
        tbl({
          title: `${unit} Correlation Matrix`,
          header: [[hcell(unit), ...Array.from({ length: m }, (_, k) => hcell(String(k + 1)))]],
          rows: rot.phi.map((r, a) => [cell(a + 1, 'int'), ...r.map((v) => cell(v, 'r'))]),
          footnotes: rotFoot.slice(0, 2),
        }),
      );
    }
    if (!rot.converged) warnings.push('The rotation did not converge. The rotated loadings may not be the best simple-structure solution.');
  }

  // Warnings
  if (kb.kmo < 0.6) warnings.push(`KMO = ${noLead(kb.kmo, 2)} (${kmoLabel(kb.kmo)}), below .60: the variables share too little common variance for a factor analysis to be useful. Look at items with low communalities and consider removing them.`);
  if (Number.isFinite(kb.p) && kb.p >= 0.05) warnings.push(`Bartlett's test is not significant (${fmtP(kb.p)}): the correlations between the variables may be too weak for factor analysis.`);
  if (kb.determinant < 1e-5) notes.push(`The determinant of the correlation matrix is very small (${kb.determinant.toExponential(2)}), a sign of multicollinearity: some variables are almost linear combinations of others.`);
  if (ex.heywood || ex.communalities.some((h) => h > 1)) warnings.push('A communality greater than 1 was encountered (a Heywood case). The solution is improper and should be interpreted with caution; try fewer factors or principal components.');
  if (!isPC && !ex.converged) warnings.push(`Principal axis factoring did not converge in ${maxIter} iterations (convergence criterion .001). Increase the maximum number of iterations or extract fewer factors.`);
  if (W / p < 5) warnings.push(`Only ${num(W / p, 1)} cases per variable. Factor solutions are unstable with fewer than about 5 to 10 cases per variable.`);
  const lowComm = variables.filter((_, i) => ex.communalities[i] < 0.2).map((v) => v.name);
  if (lowComm.length) notes.push(`Low extraction communalities (below .20) for ${listText(lowComm)}: the extracted ${unit.toLowerCase()}s explain little of ${lowComm.length === 1 ? 'this variable' : 'these variables'}.`);
  for (const t of warnings) blocks.push(textBlock('warning', t));
  for (const t of notes) blocks.push(textBlock('note', t));

  // Interpretation
  const L = rotation === 'none' ? ex.loadings : rot.pattern;
  const extSS = columnSS(ex.loadings);
  const totalPct = (100 * extSS.reduce((a, b) => a + b, 0)) / p;
  const ip: string[] = [];
  if (Number.isFinite(kb.kmo)) ip.push(`The data are ${kb.kmo >= 0.6 ? 'suitable' : 'not well suited'} for factor analysis (KMO = ${noLead(kb.kmo, 2)}, "${kmoLabel(kb.kmo)}" by Kaiser's labels; Bartlett's test ${fmtP(kb.p)}).`);
  ip.push(
    criterion === 'fixed'
      ? `${m} ${unit.toLowerCase()}${m === 1 ? ' was' : 's were'} extracted as requested, together explaining ${totalPct.toFixed(1)}% of the variance of the ${p} variables.`
      : `${m} ${unit.toLowerCase()}${m === 1 ? ' has an eigenvalue' : 's have eigenvalues'} above ${num(minEigen, minEigen % 1 ? 1 : 0)}, together explaining ${totalPct.toFixed(1)}% of the variance of the ${p} variables. Check the scree plot too: the eigenvalue rule often keeps too many factors.`,
  );
  const defining: string[] = [];
  for (let k = 0; k < m; k++) {
    const vs = variables.map((v, i) => ({ v, l: L[i][k] })).filter((x) => Math.abs(x.l) >= 0.4 && L[variables.indexOf(x.v)].every((o, kk) => kk === k || Math.abs(o) <= Math.abs(x.l)));
    vs.sort((a, b) => Math.abs(b.l) - Math.abs(a.l));
    if (vs.length) defining.push(`${unit} ${k + 1} is defined mainly by ${listText(vs.map((x) => `${x.v.name} (${noLead(x.l, 2)})`))}`);
    else defining.push(`${unit} ${k + 1} has no variable loading .40 or more as its main loading`);
  }
  if (m > 1 || defining.length) ip.push(`${defining.join('; ')}.`);
  const cross = variables.filter((_, i) => L[i].filter((x) => Math.abs(x) >= 0.4).length > 1).map((v) => v.name);
  if (cross.length && m > 1) ip.push(`${listText(cross)} load${cross.length === 1 ? 's' : ''} .40 or more on more than one ${unit.toLowerCase()} (cross-loading), which makes ${cross.length === 1 ? 'it' : 'them'} harder to assign.`);
  if (oblique && m > 1) {
    let maxR = 0;
    for (let a = 0; a < m; a++) for (let b = a + 1; b < m; b++) maxR = Math.max(maxR, Math.abs(rot.phi[a][b]));
    ip.push(`The largest correlation between ${unit.toLowerCase()}s is ${noLead(maxR, 2)}${maxR < 0.2 ? '; an orthogonal (varimax) rotation would give a similar picture' : ', so an oblique rotation is appropriate'}.`);
  }
  if (oblique) ip.push('Interpret the Pattern Matrix (unique contribution of each factor to each variable).');
  blocks.push(textBlock('interpretation', ip.join(' ')));
  const methodText = isPC ? 'A principal component analysis' : 'A principal axis factor analysis';
  const rotText = rotation === 'none' ? 'without rotation' : `with ${rotation === 'varimax' ? 'varimax' : rotation === 'promax' ? `promax (κ = ${kappa})` : `direct oblimin (δ = ${delta})`} rotation`;
  const apaParts = [`${methodText} ${rotText} was conducted on the ${p} items (N = ${num(W, Number.isInteger(W) ? 0 : 1)}).`];
  if (Number.isFinite(kb.kmo)) apaParts.push(`The Kaiser-Meyer-Olkin measure of sampling adequacy was ${noLead(kb.kmo, 2)}, and Bartlett's test of sphericity was ${kb.p < 0.05 ? '' : 'not '}significant, χ²(${kb.df}) = ${num(kb.chi2, 2)}, ${fmtP(kb.p)}.`);
  apaParts.push(`${capitalizeNum(m)} ${unit.toLowerCase()}${m === 1 ? '' : 's'} ${criterion === 'fixed' ? 'were retained' : `with eigenvalues over ${num(minEigen, minEigen % 1 ? 1 : 0)} ${m === 1 ? 'was' : 'were'} retained`}, explaining ${totalPct.toFixed(1)}% of the variance.`);
  blocks.push(textBlock('apa', apaParts.join(' ')));

  const syntax = buildSyntax(ds, variables, { method, criterion, minEigen, nFixed: m, maxIter, rotation, kappa, delta, doSort, suppress, below, kmo: optBool(opts, 'kmo', true), corr: optBool(opts, 'corr', false), scree: optBool(opts, 'scree', true) });
  return makeItem(factorAnalysis.id, 'Factor Analysis', ds, blocks, syntax, caseNote(ds, sel));
}

function capitalizeNum(n: number): string {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  return n < words.length ? words[n] : String(n);
}

function buildSyntax(
  ds: Dataset,
  variables: Variable[],
  o: { method: Extraction; criterion: 'eigen' | 'fixed'; minEigen: number; nFixed: number; maxIter: number; rotation: Rotation; kappa: number; delta: number; doSort: boolean; suppress: boolean; below: number; kmo: boolean; corr: boolean; scree: boolean },
): string {
  const names = variables.map((v) => v.name).join(' ');
  const print = ['INITIAL'];
  if (o.corr) print.push('CORRELATION', 'DET');
  if (o.kmo) print.push('KMO');
  print.push('EXTRACTION');
  if (o.rotation !== 'none') print.push('ROTATION');
  const lines = [...syntaxPreamble(ds), 'FACTOR', `  /VARIABLES ${names}`, '  /MISSING LISTWISE', `  /ANALYSIS ${names}`, `  /PRINT ${print.join(' ')}`];
  const fmt: string[] = [];
  if (o.doSort) fmt.push('SORT');
  if (o.suppress) fmt.push(`BLANK(${noLead(o.below, 2)})`);
  if (fmt.length) lines.push(`  /FORMAT ${fmt.join(' ')}`);
  if (o.scree) lines.push('  /PLOT EIGEN');
  lines.push(`  /CRITERIA ${o.criterion === 'fixed' ? `FACTORS(${o.nFixed})` : `MINEIGEN(${o.minEigen})`} ITERATE(${o.maxIter})`);
  lines.push(`  /EXTRACTION ${o.method === 'pc' ? 'PC' : 'PAF'}`);
  if (o.rotation === 'none') lines.push('  /ROTATION NOROTATE');
  else if (o.rotation === 'varimax') lines.push('  /CRITERIA ITERATE(25)', '  /ROTATION VARIMAX');
  else if (o.rotation === 'promax') lines.push('  /CRITERIA ITERATE(25)', `  /ROTATION PROMAX(${o.kappa})`);
  else lines.push(`  /CRITERIA ITERATE(25) DELTA(${o.delta})`, '  /ROTATION OBLIMIN');
  lines.push('  /METHOD=CORRELATION.');
  return lines.join('\n');
}
