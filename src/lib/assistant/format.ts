// Text for the model: compact renderings of output items, numbers and variables, and size trimming.
import type { OutputBlock, OutputItem, OutputTable } from '../../core/output';
import type { Variable } from '../../core/types';
import { tableToText } from '../../features/output/tableRender';

const enc = new TextEncoder();
export const byteLength = (s: string): number => enc.encode(s).length;

/** Cut text to at most `max` bytes (UTF-8), at a line break when one is near, with a note. */
export function trimToBytes(text: string, max: number, note = 'The rest was cut to save space. Ask for fewer variables or a narrower question for more detail.'): string {
  if (byteLength(text) <= max) return text;
  let suffix = `\n[... ${note}]`;
  if (byteLength(suffix) > max / 2) suffix = '\n[...]';
  const room = Math.max(0, max - byteLength(suffix));
  // Binary search on characters for the byte budget.
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (byteLength(text.slice(0, mid)) <= room) lo = mid;
    else hi = mid - 1;
  }
  let cut = text.slice(0, lo);
  const nl = cut.lastIndexOf('\n');
  if (nl > lo * 0.7) cut = cut.slice(0, nl);
  return cut + suffix;
}

/** A number for the model: up to `dp` decimals, no trailing zeros, "." for not computable. */
export function num(x: number, dp = 3): string {
  if (x === null || x === undefined || Number.isNaN(x)) return '.';
  if (!Number.isFinite(x)) return x > 0 ? 'inf' : '-inf';
  if (Number.isInteger(x)) return String(x);
  return String(+x.toFixed(dp));
}

export function pct(x: number): string {
  return Number.isFinite(x) ? `${x.toFixed(1)}%` : '.';
}

/** Short one-line description of a variable's dictionary entry. */
export function varHead(v: Variable): string {
  return `${v.name}${v.label ? ` "${v.label}"` : ''} [${v.type === 'string' ? 'string' : 'numeric'}, ${v.measure}]`;
}

export function valueLabelsText(v: Variable, max = 12): string {
  if (!v.valueLabels.length) return '';
  const shown = v.valueLabels.slice(0, max).map((l) => `${typeof l.value === 'string' ? `'${l.value.trimEnd()}'` : l.value}=${l.label}`);
  return shown.join('; ') + (v.valueLabels.length > max ? `; ... (${v.valueLabels.length - max} more)` : '');
}

export function missingText(v: Variable): string {
  const parts = v.missing.discrete.map((d) => (typeof d === 'string' ? `'${d}'` : String(d)));
  if (v.missing.range) {
    const { lo, hi } = v.missing.range;
    parts.push(`${lo === -Infinity ? 'LO' : lo} thru ${hi === Infinity ? 'HI' : hi}`);
  }
  return parts.join(', ');
}

/** A table with at most `maxRows` body rows (a note says how many were dropped). */
export function clipTable(t: OutputTable, maxRows: number): OutputTable {
  if (t.rows.length <= maxRows) return t;
  // Do not cut inside a row-spanned group: drop spans that would reach past the cut.
  const rows = t.rows.slice(0, maxRows).map((r) => r.map((c) => (c.rowSpan && c.rowSpan > 1 ? { ...c, rowSpan: 1 } : c)));
  return { ...t, rows, footnotes: [...(t.footnotes ?? []), `(${t.rows.length - maxRows} more rows not shown)`] };
}

function blockText(b: OutputBlock, maxRows: number): string {
  switch (b.kind) {
    case 'heading':
      return `## ${b.text}`;
    case 'table':
      return tableToText(clipTable(b.table, maxRows), 'apa');
    case 'chart':
      return `[Chart: ${b.chart.type}, "${b.chart.title}" (shown in the Output tab)]`;
    case 'text': {
      const prefix = b.style === 'interpretation' ? 'Interpretation: ' : b.style === 'apa' ? 'APA sentence: ' : b.style === 'warning' ? 'WARNING: ' : 'Note: ';
      return prefix + b.text;
    }
  }
}

/**
 * An output item as compact text for the model: title, case base, tables (clipped), warnings,
 * interpretation and APA sentence. Charts are named, not described. Syntax is included when asked.
 */
export function outputItemText(item: OutputItem, opts: { maxRows?: number; syntax?: boolean } = {}): string {
  const maxRows = opts.maxRows ?? 30;
  const out: string[] = [`# ${item.title}${item.id ? ` (output id ${item.id})` : ''}`];
  if (item.caseNote) out.push(`Cases: ${item.caseNote}`);
  // Warnings, then the interpretation and APA sentence, then the tables: the most important parts
  // come first so they survive trimming.
  const isText = (b: OutputBlock, style: string) => b.kind === 'text' && b.style === style;
  for (const style of ['warning', 'interpretation', 'apa']) for (const b of item.blocks) if (isText(b, style)) out.push(blockText(b, maxRows));
  for (const b of item.blocks) if (!(b.kind === 'text' && ['warning', 'interpretation', 'apa'].includes(b.style))) out.push(blockText(b, maxRows));
  if (opts.syntax && item.syntax) out.push(`SPSS syntax:\n${item.syntax}`);
  return out.join('\n\n');
}

/** Near matches for a mistyped name (for "did you mean" messages). */
export function closestNames(target: string, names: string[], n = 3): string[] {
  const t = target.toLowerCase();
  const scored = names.map((name) => {
    const s = name.toLowerCase();
    let score = levenshtein(t, s);
    if (s.startsWith(t) || t.startsWith(s)) score -= 2;
    if (s.includes(t) || t.includes(s)) score -= 1;
    return { name, score };
  });
  scored.sort((a, b) => a.score - b.score);
  const limit = Math.max(2, Math.ceil(t.length / 2));
  return scored.filter((x) => x.score <= limit).slice(0, n).map((x) => x.name);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = new Array(b.length + 1).fill(0).map((_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}
