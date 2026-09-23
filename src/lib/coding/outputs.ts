// OutputItem builders for the Output viewer (procedure 'coding').

import type { Cell, OutputBlock, OutputItem } from '../../core/output';
import { cell, hcell } from '../../core/output';
import { newId } from '../../core/types';
import type { CodeDef } from '../../core/coding-types';
import type { CodeByAttribute, CodeFrequency, CooccurrenceMode } from './analysis';
import type { WordCount, KwicLine } from './text';
import type { ReliabilityResult } from './reliability';
import { landisKoch } from './reliability';

function item(title: string, blocks: OutputBlock[], caseNote?: string): OutputItem {
  return { id: newId('out'), procedure: 'coding', title, createdAt: Date.now(), blocks, caseNote };
}

function fmtPct(x: number): string {
  return `${x.toFixed(1)}%`;
}

export function frequenciesOutput(
  codes: CodeDef[],
  rows: CodeFrequency[],
  nDocs: number,
  nCoded: number,
  opts: { unitLabel: string; depthOf: (id: string) => number; scopeNote: string },
): OutputItem {
  const byId = new Map(codes.map((c) => [c.id, c]));
  const unit = opts.unitLabel;
  const bodyRows: Cell[][] = rows.map((r) => [
    hcell(byId.get(r.codeId)?.name ?? '', { indent: opts.depthOf(r.codeId) }),
    cell(r.segments, 'int'),
    cell(r.docs, 'int'),
    cell(r.pctDocs, 'pct'),
    cell(r.docsInclSub, 'int'),
    cell(r.pctDocsInclSub, 'pct'),
  ]);
  const top = [...rows].filter((r) => r.docs > 0).sort((a, b) => b.docs - a.docs).slice(0, 3);
  const interp = top.length
    ? `The most frequent code${top.length > 1 ? 's were' : ' was'} ${top
        .map((r) => `"${byId.get(r.codeId)?.name}" (${r.docs} of ${nDocs} ${unit}, ${fmtPct(r.pctDocs)})`)
        .join(', ')}. ${nCoded} of ${nDocs} ${unit} (${fmtPct(nDocs ? (100 * nCoded) / nDocs : 0)}) have at least one code.`
    : `No ${unit} have been coded yet.`;
  const chartCodes = rows.filter((r) => r.docs > 0).sort((a, b) => b.docs - a.docs).slice(0, 25);
  const blocks: OutputBlock[] = [
    {
      kind: 'table',
      table: {
        title: 'Code frequencies',
        subtitle: opts.scopeNote,
        header: [[hcell('Code'), hcell('Segments'), hcell(cap(unit)), hcell(`% of ${unit}`), hcell(`${cap(unit)} incl. sub-codes`), hcell('% incl. sub-codes')]],
        rows: bodyRows,
        footnotes: [`Percentages are of all ${nDocs} ${unit} in scope. A ${singular(unit)} counts once per code however many segments it has.`],
      },
    },
    { kind: 'text', style: 'interpretation', text: interp },
  ];
  if (chartCodes.length)
    blocks.push({
      kind: 'chart',
      chart: {
        type: 'bar',
        title: `Percentage of ${unit} coded`,
        horizontal: true,
        percent: true,
        categories: chartCodes.map((r) => byId.get(r.codeId)?.name ?? ''),
        series: [{ name: `% of ${unit}`, values: chartCodes.map((r) => Number(r.pctDocs.toFixed(2))) }],
        yLabel: `% of ${unit}`,
      },
    });
  return item('Code frequencies', blocks, `${nDocs} ${unit}; ${nCoded} coded`);
}

export function cooccurrenceOutput(codes: CodeDef[], matrix: number[][], mode: CooccurrenceMode, scopeNote: string): OutputItem {
  const names = codes.map((c) => c.name);
  const header: Cell[][] = [[hcell(''), ...names.map((n) => hcell(n))]];
  const rows: Cell[][] = matrix.map((r, i) => [hcell(names[i]), ...r.map((v, j) => cell(v, 'int', i === j ? { tone: 'muted' } : {}))]);
  let best: [number, number, number] | null = null;
  for (let i = 0; i < matrix.length; i++) for (let j = i + 1; j < matrix.length; j++) if (!best || matrix[i][j] > best[2]) best = [i, j, matrix[i][j]];
  const what = mode === 'document' ? 'documents or responses coded with both codes' : 'pairs of overlapping segments';
  const interp = best && best[2] > 0
    ? `"${names[best[0]]}" and "${names[best[1]]}" occur together most often (${best[2]} ${what}).`
    : 'None of these codes occur together yet.';
  return item('Code co-occurrence', [
    {
      kind: 'table',
      table: {
        title: 'Code co-occurrence',
        subtitle: scopeNote,
        header,
        rows,
        footnotes: [
          mode === 'document'
            ? 'Cells: number of documents or responses coded with both codes. Diagonal: number coded with the code.'
            : 'Cells: number of pairs of overlapping segments in the same document. Diagonal: number of segments of the code.',
        ],
      },
    },
    { kind: 'text', style: 'interpretation', text: interp },
    {
      kind: 'chart',
      chart: { type: 'heatmap', title: 'Code co-occurrence', rowLabels: names, colLabels: names, values: matrix.map((r, i) => r.map((v, j) => (i === j ? null : v))), scale: 'sequential' },
    },
  ]);
}

export function codeByAttributeOutput(codes: CodeDef[], attribute: string, r: CodeByAttribute, unitLabel: string): OutputItem {
  const header: Cell[][] = [
    [hcell('Code', { rowSpan: 2 }), ...r.values.map((v, j) => hcell(`${v} (n = ${r.bases[j]})`, { colSpan: 2, align: 'center' }))],
    r.values.flatMap(() => [hcell('Count'), hcell('Column %')]),
  ];
  const rows: Cell[][] = codes.map((c, i) => [hcell(c.name), ...r.values.flatMap((_, j) => [cell(r.counts[i][j], 'int'), cell(r.colPct[i][j], 'pct')])]);
  const lines: string[] = [];
  codes.forEach((c, i) => {
    if (r.values.length < 2) return;
    const pcts = r.colPct[i];
    const hi = pcts.indexOf(Math.max(...pcts));
    const lo = pcts.indexOf(Math.min(...pcts));
    if (pcts[hi] - pcts[lo] >= 10) lines.push(`"${c.name}" was mentioned more often in the ${r.values[hi]} group (${fmtPct(pcts[hi])}) than in the ${r.values[lo]} group (${fmtPct(pcts[lo])}).`);
  });
  const blocks: OutputBlock[] = [
    {
      kind: 'table',
      table: {
        title: `Codes by ${attribute}`,
        header,
        rows,
        footnotes: [
          `Count: ${unitLabel} coded with the code. Column %: of all ${unitLabel} in that ${attribute} group.`,
          ...(r.nMissing ? [`${r.nMissing} ${unitLabel} without a value for ${attribute} are left out.`] : []),
        ],
      },
    },
    {
      kind: 'text',
      style: 'interpretation',
      text: lines.length ? lines.slice(0, 6).join(' ') : `Differences between ${attribute} groups are small (under 10 percentage points for every code).`,
    },
    { kind: 'text', style: 'note', text: 'These are descriptive counts. To test differences, export the codes to the dataset (Text coding > Export codes to dataset) and run Crosstabs with a chi-square test.' },
  ];
  if (codes.length && r.values.length)
    blocks.push({
      kind: 'chart',
      chart: {
        type: 'bar',
        title: `Codes by ${attribute} (column %)`,
        categories: codes.map((c) => c.name),
        series: r.values.map((v, j) => ({ name: v, values: codes.map((_, i) => Number(r.colPct[i][j].toFixed(2))) })),
        percent: true,
        yLabel: 'Column %',
      },
    });
  return item(`Codes by ${attribute}`, blocks);
}

export function wordFrequencyOutput(words: WordCount[], bigrams: WordCount[] | null, nTexts: number, scopeNote: string, top = 50): OutputItem {
  const mk = (title: string, list: WordCount[], label: string) => ({
    kind: 'table' as const,
    table: {
      title,
      subtitle: scopeNote,
      header: [[hcell('Rank'), hcell(label), hcell('Count'), hcell('Texts'), hcell('% of texts')]],
      rows: list.slice(0, top).map((w, i) => [cell(i + 1, 'int'), hcell(w.term), cell(w.count, 'int'), cell(w.docs, 'int'), cell(nTexts ? (100 * w.docs) / nTexts : 0, 'pct')]),
    },
  });
  const blocks: OutputBlock[] = [mk('Word frequencies', words, 'Word')];
  const chartWords = words.slice(0, 20);
  if (chartWords.length)
    blocks.push({ kind: 'chart', chart: { type: 'bar', title: 'Most frequent words', horizontal: true, categories: chartWords.map((w) => w.term), series: [{ name: 'Count', values: chartWords.map((w) => w.count) }], yLabel: 'Count' } });
  if (bigrams) blocks.push(mk('Word pairs (bigrams)', bigrams, 'Word pair'));
  return item('Word frequencies', blocks, `${nTexts} texts`);
}

export function kwicOutput(query: string, lines: Array<KwicLine & { source: string }>, top = 200): OutputItem {
  return item(`Keyword in context: ${query}`, [
    {
      kind: 'table',
      table: {
        title: `Keyword in context: "${query}"`,
        subtitle: `${lines.length} match${lines.length === 1 ? '' : 'es'}`,
        header: [[hcell('Source'), hcell('Left context'), hcell('Keyword'), hcell('Right context')]],
        rows: lines.slice(0, top).map((l) => [hcell(l.source), cell(l.left, 'text', { align: 'right' }), cell(l.match, 'text', { bold: true }), cell(l.right, 'text')]),
        footnotes: lines.length > top ? [`Showing the first ${top} of ${lines.length} matches.`] : undefined,
      },
    },
  ]);
}

export function reliabilityOutput(codes: CodeDef[], r: ReliabilityResult): OutputItem {
  const byId = new Map(codes.map((c) => [c.id, c]));
  const rows: Cell[][] = r.perCode.map((c) => [
    hcell(byId.get(c.codeId)?.name ?? ''),
    cell(c.both, 'int'),
    cell(c.onlyA, 'int'),
    cell(c.onlyB, 'int'),
    cell(c.neither, 'int'),
    cell(c.agreement, 'pct'),
    cell(Number.isFinite(c.kappa) ? c.kappa : NaN, 'r', { tone: Number.isFinite(c.kappa) && c.kappa < 0.4 ? 'warn' : undefined }),
    cell(Number.isFinite(c.alpha) ? c.alpha : NaN, 'r'),
    hcell(landisKoch(c.kappa)),
  ]);
  const units = [r.nResponseUnits ? `${r.nResponseUnits} responses` : '', r.nSentenceUnits ? `${r.nSentenceUnits} sentences` : ''].filter(Boolean).join(' and ');
  const weak = r.perCode.filter((c) => Number.isFinite(c.kappa) && c.kappa < 0.6).map((c) => `"${byId.get(c.codeId)?.name}"`);
  const interp =
    `${r.coderA} and ${r.coderB} were compared on ${r.docIds.length} source${r.docIds.length === 1 ? '' : 's'} that both coded (${units}). ` +
    `Overall Krippendorff's alpha = ${fmtR(r.pooledAlpha)} and mean Cohen's kappa = ${fmtR(r.meanKappa)} (${landisKoch(r.meanKappa)} agreement by the Landis and Koch rule of thumb). ` +
    (weak.length ? `Agreement is below .60 for ${weak.slice(0, 6).join(', ')}${weak.length > 6 ? ' and others' : ''}; review the disagreements and sharpen those code definitions.` : 'All codes reach at least moderate agreement.');
  return item(
    `Intercoder reliability: ${r.coderA} vs ${r.coderB}`,
    [
      {
        kind: 'table',
        table: {
          title: 'Intercoder agreement by code',
          subtitle: `${r.coderA} (A) vs ${r.coderB} (B)`,
          header: [[hcell('Code'), hcell('Both'), hcell('A only'), hcell('B only'), hcell('Neither'), hcell('% agreement'), hcell("Cohen's κ"), hcell("Krippendorff's α"), hcell('Landis & Koch')]],
          rows,
          footnotes: [
            'Unit of analysis: each open-ended response is one unit; interview documents are split into sentences and each sentence is one unit. A unit counts as coded when the coder applied the code anywhere in it.',
            'κ is not computable (".") when both coders used a single category for every unit.',
          ],
        },
      },
      {
        kind: 'table',
        table: {
          title: 'Overall agreement',
          header: [[hcell('Statistic'), hcell('Value')]],
          rows: [
            [hcell("Krippendorff's α (nominal, all codes pooled)"), cell(r.pooledAlpha, 'r')],
            [hcell('Percent agreement (all codes pooled)'), cell(r.pooledAgreement, 'pct')],
            [hcell("Mean Cohen's κ across codes"), cell(r.meanKappa, 'r')],
            [hcell('Sources compared'), cell(r.docIds.length, 'int')],
            [hcell('Disagreements'), cell(r.disagreements.length, 'int')],
          ],
        },
      },
      { kind: 'text', style: 'interpretation', text: interp },
      {
        kind: 'text',
        style: 'note',
        text: 'Landis and Koch (1977) bands, a rule of thumb: below 0 poor, 0.00 to 0.20 slight, 0.21 to 0.40 fair, 0.41 to 0.60 moderate, 0.61 to 0.80 substantial, 0.81 to 1.00 almost perfect. Krippendorff (2004) suggests α ≥ .80 for firm conclusions and α ≥ .667 for tentative ones.',
      },
    ],
    `${r.docIds.length} sources coded by both`,
  );
}

function fmtR(x: number): string {
  if (!Number.isFinite(x)) return 'not computable';
  const s = x.toFixed(2);
  return s.replace(/^0\./, '.').replace(/^-0\./, '-.');
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function singular(unit: string) {
  return unit.endsWith('ses') ? unit.slice(0, -1) : unit.endsWith('s') ? unit.slice(0, -1) : unit;
}
