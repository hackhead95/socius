// "Explain with AI" for Output items: the item as compact text (titles, table numbers and labels,
// Socius's own summary, APA sentence and warnings) and the prompt around it. Pure: no network.
//
// Never sent: individual cases. Scatter plot points, box plot outlier values, and tables that list
// cases (casewise diagnostics, keyword-in-context quotes...) are left out; only aggregate numbers go.

import type { Cell, ChartSpec, OutputBlock, OutputItem, OutputTable } from '../../core/output';
import { formatCell, layoutRows } from '../output/format';
import { chartDataTable } from '../charts/dataTable';

const enc = new TextEncoder();
export const byteLength = (s: string) => enc.encode(s).length;

/** Tables whose rows are individual cases or quotes, never sent. */
const CASE_LEVEL_TABLE = /casewise|case summar|case list|listing|individual case|extreme values|outlier cases|keyword in context|coded segments|quotes/i;

/** Items that make sense to explain: analyses and charts (not data-change logs or quote lists). */
export function isExplainable(item: OutputItem): boolean {
  if (item.procedure === 'transform' || item.procedure === 'log') return false;
  if (CASE_LEVEL_TABLE.test(item.title)) return false;
  return item.blocks.some((b) => (b.kind === 'table' && !CASE_LEVEL_TABLE.test(b.table.title)) || (b.kind === 'chart' && b.chart.type !== 'scatter') || (b.kind === 'text' && b.style === 'interpretation'));
}

const cellStr = (c: Cell) => {
  const f = formatCell(c, { style: 'apa' });
  return (f.text + (f.mark ?? '')).replace(/\s+/g, ' ').trim();
};

/** A table as compact text: a header line of column names, then one line per row ("a | b | c"). */
export function tableToCompactText(t: OutputTable, maxRows = Infinity): { text: string; rowsLeft: number } {
  const head = layoutRows(t.header);
  const body = layoutRows(t.rows);
  const nCol = Math.max(head.columns, body.columns);
  // Column names: header texts stacked over each column ("Voted: Yes").
  const names: string[][] = Array.from({ length: nCol }, () => []);
  for (const row of head.grid)
    for (const g of row) {
      const s = cellStr(g.cell);
      if (!s) continue;
      for (let c = g.col; c < g.col + g.colSpan; c++) if (names[c][names[c].length - 1] !== s) names[c].push(s);
    }
  // Body: fill a matrix so row-spanning labels repeat on every row they cover.
  const matrix: string[][] = body.grid.map(() => new Array(nCol).fill(''));
  body.grid.forEach((row, r) => {
    for (const g of row) {
      const s = cellStr(g.cell);
      for (let rr = r; rr < Math.min(matrix.length, r + g.rowSpan); rr++) matrix[rr][g.col] = s;
    }
  });
  const lines = [`Table: ${t.title}${t.subtitle ? ` (${t.subtitle})` : ''}`];
  if (names.some((n) => n.length)) lines.push(`Columns: ${names.map((n) => n.join(': ') || '-').join(' | ')}`);
  const shown = matrix.slice(0, maxRows);
  for (const r of shown) lines.push(r.join(' | ').replace(/(\s\|\s)+$/, ''));
  const rowsLeft = matrix.length - shown.length;
  if (rowsLeft > 0) lines.push(`(${rowsLeft} more row${rowsLeft === 1 ? '' : 's'} not sent)`);
  for (const f of t.footnotes ?? []) lines.push(`Footnote: ${f}`);
  return { text: lines.join('\n'), rowsLeft };
}

const num = (v: string | number | null) => (v === null ? '' : typeof v === 'number' ? (Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000)) : v);

/** A chart as compact text of its aggregate data, or null when it only holds individual cases. */
export function chartToCompactText(c: ChartSpec, maxRows = 60): string | null {
  if (c.type === 'scatter') return null;
  const d = chartDataTable(c);
  const lines = [`Chart (${c.type}): ${c.title}`, `Columns: ${d.columns.join(' | ')}`];
  for (const r of d.rows.slice(0, maxRows)) lines.push(r.map(num).join(' | '));
  if (d.rows.length > maxRows) lines.push(`(${d.rows.length - maxRows} more rows not sent)`);
  if (c.type === 'box') lines.push('(Outlier counts only; individual outlier values are not sent.)');
  return lines.join('\n');
}

export interface ExplainContext {
  /** Everything sent about the result. */
  text: string;
  /** Parts left out (individual cases, or cut to fit the provider's size limit). */
  omitted: string[];
  truncated: boolean;
}

const TEXT_LABEL: Record<string, string> = {
  interpretation: "Socius's plain-language summary",
  apa: 'APA sentence produced by Socius',
  warning: 'Warning shown by Socius',
  note: 'Note',
};

/** The result as compact text that fits `maxBytes`. Text blocks come first so they always fit. */
export function outputItemContext(item: OutputItem, maxBytes = 30_000): ExplainContext {
  const omitted: string[] = [];
  const head: string[] = [`Result: ${item.title}`];
  if (item.caseNote) head.push(`Cases: ${item.caseNote}`);
  const texts: string[] = [];
  const tables: Array<{ block: OutputBlock; title: string }> = [];
  for (const b of item.blocks) {
    if (b.kind === 'text') {
      if (b.ai) continue; // earlier AI explanations are not fed back
      texts.push(`${TEXT_LABEL[b.style] ?? 'Note'}: ${b.text.replace(/\s+/g, ' ').trim()}`);
    } else if (b.kind === 'heading') tables.push({ block: b, title: b.text });
    else if (b.kind === 'table') {
      if (CASE_LEVEL_TABLE.test(b.table.title)) omitted.push(`Table "${b.table.title}" (lists individual cases)`);
      else tables.push({ block: b, title: b.table.title });
    } else if (b.kind === 'chart') {
      if (b.chart.type === 'scatter') omitted.push(`Scatter plot "${b.chart.title}" (individual points)`);
      else tables.push({ block: b, title: b.chart.title });
    }
  }
  let out = [...head, ...texts].join('\n');
  let truncated = false;
  for (const t of tables) {
    const b = t.block;
    let piece: string | null;
    if (b.kind === 'heading') piece = `Section: ${b.text}`;
    else if (b.kind === 'chart') piece = chartToCompactText(b.chart);
    else if (b.kind === 'table') piece = tableToCompactText(b.table).text;
    else piece = null;
    if (!piece) continue;
    if (byteLength(out) + byteLength(piece) + 2 <= maxBytes) {
      out += `\n\n${piece}`;
      continue;
    }
    // Too big: send as many rows as fit, then stop adding tables.
    if (b.kind === 'table') {
      let lo = 0;
      let hi = b.table.rows.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (byteLength(out) + byteLength(tableToCompactText(b.table, mid).text) + 2 <= maxBytes) lo = mid;
        else hi = mid - 1;
      }
      if (lo > 0) out += `\n\n${tableToCompactText(b.table, lo).text}`;
      else omitted.push(`Table "${b.table.title}" (too long for this AI service)`);
    } else omitted.push(`"${t.title}" (too long for this AI service)`);
    truncated = true;
    for (const rest of tables.slice(tables.indexOf(t) + 1)) if (rest.block.kind !== 'heading') omitted.push(`"${rest.title}" (too long for this AI service)`);
    break;
  }
  if (item.syntax && byteLength(out) + byteLength(item.syntax) + 20 <= maxBytes) out += `\n\nSPSS syntax that produced it:\n${item.syntax}`;
  return { text: out, omitted, truncated };
}

export const EXPLAIN_INSTRUCTIONS = [
  'You are a patient statistics tutor helping a sociology student understand one result from Socius, a data analysis tool that works like SPSS.',
  'Explain the result below in plain English for someone who has taken one introductory statistics course. Use only the numbers given here and never invent values. If something you would need is missing, say so.',
  'Write five short sections, each starting with its heading on its own line:',
  'What was tested',
  'What the numbers mean',
  'Assumptions and warnings',
  'How to report it',
  'Cautions',
  'In "What the numbers mean", say which numbers matter most and what they show about the people or groups studied, quoting the actual values.',
  'In "Assumptions and warnings", say whether the warnings or assumptions matter for the conclusion (for example small expected counts, unequal variances, small groups).',
  'In "How to report it", give one results sentence in APA 7 style using the numbers.',
  'In "Cautions", mention the limits that apply: association or correlation is not causation, statistical significance is not the same as a large or important effect, very large samples make tiny differences significant, and results only generalise to a population if the data come from a random sample.',
  'Keep the whole answer under 400 words. Use short paragraphs or "-" bullet points, no tables.',
].join('\n');

export interface ExplainPrompt {
  prompt: string;
  context: ExplainContext;
}

/** The full prompt for one item, within the provider's prompt budget (bytes). */
export function buildExplainPrompt(item: OutputItem, opts: { budgetBytes?: number } = {}): ExplainPrompt {
  const budget = opts.budgetBytes ?? 40_000;
  const lead = `${EXPLAIN_INSTRUCTIONS}\n\nTHE RESULT\n`;
  const context = outputItemContext(item, Math.max(2_000, budget - byteLength(lead) - 50));
  return { prompt: lead + context.text, context };
}

/** Markdown-ish model reply -> plain text for the output document and exports. */
export function plainText(md: string): string {
  return md
    .replace(/\r/g, '')
    .split('\n')
    .map((l) =>
      l
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s*[*•]\s+/, '- ')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .trimEnd(),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
