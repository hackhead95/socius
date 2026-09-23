// Reliability Analysis (SPSS RELIABILITY /MODEL=ALPHA) with McDonald's omega.

import type { Dataset } from '../../core/types';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import type { Cell, OutputBlock, OutputTable } from '../../core/output';
import { oneFactorML, reliabilityAnalysis } from '../../lib/stats/reliability';
import {
  caseNote,
  cell,
  dfCell,
  footName,
  hcell,
  heading,
  listText,
  makeItem,
  noLead,
  num,
  numericValues,
  optBool,
  selectAll,
  slot,
  syntaxPreamble,
  textBlock,
  vars as varsOf,
} from './common';

/** George & Mallery (2003) rule-of-thumb bands for alpha. */
export function alphaBand(a: number): string {
  if (a >= 0.9) return 'excellent';
  if (a >= 0.8) return 'good';
  if (a >= 0.7) return 'acceptable';
  if (a >= 0.6) return 'questionable';
  if (a >= 0.5) return 'poor';
  return 'unacceptable';
}

export const reliability: ProcedureDef = {
  id: 'models.reliability',
  menu: 'Scale',
  title: 'Reliability Analysis',
  description: "Check whether several items measure the same thing well enough to be combined into a scale (Cronbach's alpha, McDonald's omega, item-total statistics).",
  guidance:
    'Enter the items of one scale. Reverse-worded items must be recoded first so that high values mean the same thing for every item; ' +
    'the output flags items that correlate negatively with the rest of the scale.',
  slots: [{ key: 'items', label: 'Items', min: 2, max: Infinity, types: ['numeric'], help: 'The items of one scale (at least two; three or more recommended).' }],
  options: [
    { key: 'itemStats', label: 'Item statistics', type: 'checkbox', default: true, group: 'Descriptives' },
    { key: 'scaleStats', label: 'Scale statistics', type: 'checkbox', default: true, group: 'Descriptives' },
    { key: 'itemTotal', label: 'Scale if item deleted (item-total statistics)', type: 'checkbox', default: true, group: 'Descriptives' },
    { key: 'interItem', label: 'Inter-item correlation matrix', type: 'checkbox', default: false, group: 'Inter-item' },
    { key: 'summary', label: 'Summary item statistics (means, variances, correlations)', type: 'checkbox', default: false, group: 'Inter-item' },
    { key: 'omega', label: "McDonald's omega (one-factor model)", type: 'checkbox', default: true, group: 'Model' },
  ],
  run: (ds, v, o) => runReliability(ds, v, o),
};

function tbl(t: OutputTable): OutputBlock {
  return { kind: 'table', table: t };
}

function runReliability(ds: Dataset, vars: SlotValues, opts: OptionValues) {
  const ids = slot(vars, 'items');
  if (ids.length < 2) throw new Error('Choose at least two items.');
  if (new Set(ids).size !== ids.length) throw new Error('Each item can be entered only once.');
  const items = varsOf(ds, ids);
  const sel = selectAll(ds, ids, 3);
  const w = sel.weights;
  const cols = items.map((v) => numericValues(ds, v, sel.rows));
  const r = reliabilityAnalysis(cols, w);
  const k = r.k;
  const blocks: OutputBlock[] = [heading(`Reliability: ${k} items`)];
  const warnings: string[] = [];
  const notes: string[] = [];

  // Case Processing Summary
  {
    const total = sel.rows.length + sel.nMissing;
    blocks.push(
      tbl({
        title: 'Case Processing Summary',
        header: [[hcell('', { colSpan: 2 }), hcell('N'), hcell('%')]],
        stubColumns: 2,
        rows: [
          [cell('Cases', 'text', { rowSpan: 3 }), cell('Valid', 'text'), cell(sel.rows.length, 'int'), cell(total ? (100 * sel.rows.length) / total : NaN, 'pct')],
          [cell('Excluded', 'text', { mark: 'a' }), cell(sel.nMissing, 'int'), cell(total ? (100 * sel.nMissing) / total : NaN, 'pct')],
          [cell('Total', 'text'), cell(total, 'int'), cell(100, 'pct')],
        ],
        footnotes: ['a. Listwise deletion based on all variables in the procedure.', ...(ds.weightVarId ? [`Statistics are weighted (weighted N = ${num(r.n, Number.isInteger(r.n) ? 0 : 1)}); counts here are unweighted.`] : [])],
      }),
    );
  }
  blocks.push(
    tbl({
      title: 'Reliability Statistics',
      header: [[hcell("Cronbach's Alpha"), hcell("Cronbach's Alpha Based on Standardized Items"), hcell('N of Items')]],
      rows: [[cell(r.alpha, 'r', { tone: r.alpha < 0.6 ? 'bad' : r.alpha < 0.7 ? 'warn' : 'good' }), cell(r.alphaStandardized, 'r'), cell(k, 'int')]],
    }),
  );
  let omega: ReturnType<typeof oneFactorML> | null = null;
  if (optBool(opts, 'omega', true) && k >= 3) {
    omega = oneFactorML(r.corr);
    blocks.push(
      tbl({
        title: "McDonald's Omega",
        header: [[hcell('Omega Total'), hcell('N of Items')]],
        rows: [[cell(omega.omega, 'r'), cell(k, 'int')]],
        footnotes: ['Computed from a one-factor maximum-likelihood model of the item correlations: ω = (Σλ)² / ((Σλ)² + Σψ).'],
      }),
    );
    const negLoad = items.filter((_, i) => omega!.loadings[i] < 0).map((v) => v.name);
    if (negLoad.length) warnings.push(`Omega assumes all items measure the construct in the same direction, but ${listText(negLoad)} ${negLoad.length === 1 ? 'loads' : 'load'} negatively on the common factor. Recode reverse-worded items first; until then omega is not meaningful.`);
    if (omega.heywood) notes.push('In the one-factor model behind omega, at least one item has a uniqueness at the lower bound (a Heywood case). Omega may be overestimated.');
    if (!omega.converged) notes.push('The one-factor model behind omega did not fully converge; treat omega as approximate.');
  } else if (optBool(opts, 'omega', true)) notes.push("McDonald's omega needs at least three items, so it is not shown.");

  if (optBool(opts, 'itemStats', true)) {
    blocks.push(
      tbl({
        title: 'Item Statistics',
        header: [[hcell(''), hcell('Mean'), hcell('Std. Deviation'), hcell('N')]],
        rows: items.map((v, i) => [cell(footName(v), 'text'), cell(r.means[i], 'dec3'), cell(r.sds[i], 'dec3'), dfCell(r.n)]),
      }),
    );
  }
  if (optBool(opts, 'interItem', false)) {
    blocks.push(
      tbl({
        title: 'Inter-Item Correlation Matrix',
        header: [[hcell(''), ...items.map((v) => hcell(v.name))]],
        rows: items.map((v, a) => [cell(v.name, 'text'), ...items.map((_, b) => cell(r.corr[a][b], 'r', r.corr[a][b] < 0 && a !== b ? { tone: 'warn' } : {}))]),
      }),
    );
  }
  if (optBool(opts, 'summary', false)) {
    const row = (label: string, s: typeof r.summary.means, fmt: 'dec3' | 'r'): Cell[] => [cell(label, 'text'), cell(s.mean, fmt), cell(s.min, fmt), cell(s.max, fmt), cell(s.range, fmt), cell(s.ratio, 'dec3'), cell(s.variance, 'dec3'), cell(k, 'int')];
    blocks.push(
      tbl({
        title: 'Summary Item Statistics',
        header: [[hcell(''), hcell('Mean'), hcell('Minimum'), hcell('Maximum'), hcell('Range'), hcell('Maximum / Minimum'), hcell('Variance'), hcell('N of Items')]],
        rows: [row('Item Means', r.summary.means, 'dec3'), row('Item Variances', r.summary.variances, 'dec3'), row('Inter-Item Covariances', r.summary.covariances, 'dec3'), row('Inter-Item Correlations', r.summary.correlations, 'r')],
      }),
    );
  }
  if (optBool(opts, 'itemTotal', true)) {
    blocks.push(
      tbl({
        title: 'Item-Total Statistics',
        header: [[hcell(''), hcell('Scale Mean if Item Deleted'), hcell('Scale Variance if Item Deleted'), hcell('Corrected Item-Total Correlation'), hcell('Squared Multiple Correlation'), hcell("Cronbach's Alpha if Item Deleted")]],
        rows: items.map((v, i) => {
          const it = r.itemTotal[i];
          return [
            cell(v.name, 'text'),
            cell(it.scaleMeanIfDeleted, 'dec3'),
            cell(it.scaleVarianceIfDeleted, 'dec3'),
            cell(it.correctedItemTotal, 'r', it.correctedItemTotal < 0 ? { tone: 'bad' } : it.correctedItemTotal < 0.3 ? { tone: 'warn' } : {}),
            cell(it.squaredMultiple, 'r'),
            cell(it.alphaIfDeleted, 'r', it.alphaIfDeleted > r.alpha + 0.01 ? { tone: 'warn' } : {}),
          ];
        }),
      }),
    );
  }
  if (optBool(opts, 'scaleStats', true)) {
    blocks.push(
      tbl({
        title: 'Scale Statistics',
        header: [[hcell('Mean'), hcell('Variance'), hcell('Std. Deviation'), hcell('N of Items')]],
        rows: [[cell(r.scaleMean, 'dec3'), cell(r.scaleVariance, 'dec3'), cell(Math.sqrt(r.scaleVariance), 'dec3'), cell(k, 'int')]],
      }),
    );
  }

  // Warnings
  const negative = items.filter((_, i) => r.itemTotal[i].correctedItemTotal < 0);
  for (const v of negative) {
    const i = items.indexOf(v);
    warnings.push(`${v.name} correlates negatively with the rest of the scale (corrected item-total r = ${noLead(r.itemTotal[i].correctedItemTotal, 2)}). It may be reverse-worded and need reverse coding (for example, recode 1→5, 2→4, ... with Transform > Recode) before it is combined with the other items.`);
  }
  if (r.alpha < 0.6) warnings.push(`Cronbach's alpha is ${noLead(r.alpha, 2)}, below .60: these items are not consistent enough to be combined into one reliable scale as they stand.`);
  if (r.alpha < 0) warnings.push('A negative alpha means the items on average correlate negatively, almost always because some items are reverse-worded and not yet recoded.');
  const weak = items.filter((_, i) => r.itemTotal[i].correctedItemTotal >= 0 && r.itemTotal[i].correctedItemTotal < 0.3).map((v) => v.name);
  if (weak.length) notes.push(`Weak items (corrected item-total r below .30): ${listText(weak)}. They contribute little to the scale.`);
  let bestDel = -1;
  for (let i = 0; i < k; i++) if (r.itemTotal[i].alphaIfDeleted > r.alpha + 0.01 && (bestDel < 0 || r.itemTotal[i].alphaIfDeleted > r.itemTotal[bestDel].alphaIfDeleted)) bestDel = i;
  if (bestDel >= 0) notes.push(`Removing ${items[bestDel].name} would raise alpha from ${noLead(r.alpha, 2)} to ${noLead(r.itemTotal[bestDel].alphaIfDeleted, 2)}. Drop items only if that also makes sense for the content of the scale.`);
  if (k === 2) notes.push("With only two items, alpha understates reliability; the Spearman-Brown coefficient or the inter-item correlation is often reported instead.");
  const sds = r.sds;
  if (Math.max(...sds) / Math.min(...sds) > 2) notes.push("Item standard deviations differ a lot (the items may use different response scales). If you will standardize the items before summing, report the alpha based on standardized items.");
  if (sel.rows.length < 30) warnings.push(`Only ${sel.rows.length} cases: alpha is imprecise in small samples.`);
  for (const t of warnings) blocks.push(textBlock('warning', t));
  for (const t of notes) blocks.push(textBlock('note', t));

  // Interpretation / APA
  const band = alphaBand(r.alpha);
  const ip = [
    `Cronbach's alpha for the ${k} items is ${noLead(r.alpha, 2)}, which by a common rule of thumb (George & Mallery, 2003: ≥ .9 excellent, ≥ .8 good, ≥ .7 acceptable, ≥ .6 questionable, ≥ .5 poor) counts as ${band}.`,
  ];
  if (omega) ip.push(`McDonald's omega, which does not assume that all items are equally strong indicators, is ${noLead(omega.omega, 2)}.`);
  ip.push(`On average the items correlate r = ${noLead(r.summary.correlations.mean, 2)} with each other.`);
  if (negative.length) ip.push(`Before using the scale, check ${listText(negative.map((v) => v.name))}: ${negative.length === 1 ? 'it runs' : 'they run'} in the opposite direction to the rest.`);
  else if (r.alpha >= 0.7) ip.push('The items can reasonably be combined into one scale score (for example their mean).');
  blocks.push(textBlock('interpretation', ip.join(' ')));
  blocks.push(
    textBlock(
      'apa',
      `The ${k}-item scale showed ${band} internal consistency, Cronbach's α = ${noLead(r.alpha, 2)}${omega ? `, McDonald's ω = ${noLead(omega.omega, 2)}` : ''} (N = ${num(r.n, Number.isInteger(r.n) ? 0 : 1)}).`,
    ),
  );

  const names = items.map((v) => v.name).join(' ');
  const stats = ['DESCRIPTIVE', 'SCALE'];
  if (optBool(opts, 'interItem', false)) stats.push('CORR');
  const lines = [...syntaxPreamble(ds), 'RELIABILITY', `  /VARIABLES=${names}`, "  /SCALE('ALL VARIABLES') ALL", '  /MODEL=ALPHA', `  /STATISTICS=${stats.join(' ')}`];
  const summ = ['TOTAL'];
  if (optBool(opts, 'summary', false)) summ.push('MEANS', 'VARIANCE', 'COV', 'CORR');
  lines.push(`  /SUMMARY=${summ.join(' ')}.`);
  if (omega) lines.push("* McDonald's omega: SPSS 27 or later offers /MODEL=OMEGA; its estimation method may differ slightly from the one-factor ML model used here.");
  return makeItem(reliability.id, 'Reliability Analysis', ds, blocks, lines.join('\n'), caseNote(ds, sel));
}
