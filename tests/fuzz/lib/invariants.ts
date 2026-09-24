// Invariant checks shared by the fuzz suites. Each returns a list of problems (empty = fine).
import type { Cell, OutputItem, OutputTable } from '../../../src/core/output';
import { layoutRows } from '../../../src/features/output/format';
import { itemToText } from '../../../src/features/output/exportText';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Chart } from '../../../src/features/charts/Chart';

/** Render a chart to static SVG markup (as the Output viewer would) and look for broken values. */
export function chartProblems(spec: unknown): string[] {
  let html = '';
  try {
    html = renderToStaticMarkup(createElement(Chart, { spec: spec as never, width: 640 }));
  } catch (e) {
    return [`chart render threw: ${(e as Error).message?.slice(0, 120)}`];
  }
  const out: string[] = [];
  const m = /[a-zA-Z-]+="[^"]*\b(NaN|undefined|Infinity)\b[^"]*"/.exec(html);
  if (m) out.push(`chart SVG attribute contains ${m[1]}: ${m[0].slice(0, 100)}`);
  const text = html.replace(/<[^>]+>/g, ' ');
  const bad = badWords(text).filter((b) => b !== 'null');
  if (bad.length) out.push(`chart text contains ${bad.join(',')}: "${(text.match(/[^ ]{0,40}(NaN|undefined|Infinity)[^ ]{0,40}/)?.[0] ?? '').trim()}"`);
  return out;
}

/** Words that must never reach a user in an error or output text. */
const BAD_TEXT: Array<[RegExp, string]> = [
  [/\bNaN\b/, 'NaN'],
  [/\bundefined\b/, 'undefined'],
  [/\[object Object\]/, '[object Object]'],
  [/(?<![∞-])\bInfinity\b/, 'Infinity'],
  [/cannot read propert/i, 'cannot read properties'],
  [/is not a function/i, 'is not a function'],
  [/is not iterable/i, 'is not iterable'],
  [/Maximum call stack/i, 'stack overflow'],
  [/Invalid array length/i, 'Invalid array length'],
  [/\bnull\b(?! hypothesis)/, 'null'],
  [/of undefined|of null/i, 'of undefined/null'],
];

export function badWords(text: string): string[] {
  const out: string[] = [];
  for (const [re, name] of BAD_TEXT) if (re.test(text)) out.push(name);
  return out;
}

/** A thrown value must be an Error with a plain-English message. */
export function errorProblems(e: unknown): string[] {
  if (!(e instanceof Error)) return [`threw a non-Error value: ${String(e).slice(0, 80)}`];
  const msg = e.message ?? '';
  const probs: string[] = [];
  if (!msg.trim()) probs.push(`empty error message (${e.name})`);
  if (e instanceof TypeError || e instanceof RangeError || e instanceof ReferenceError || e instanceof SyntaxError) probs.push(`internal ${e.name}: ${msg.slice(0, 160)}`);
  const bad = badWords(msg);
  if (bad.length) probs.push(`error message contains ${bad.join(', ')}: ${msg.slice(0, 160)}`);
  return probs;
}

/** Walk a value: only plain JSON (objects, arrays, strings, booleans, null, numbers). NaN only allowed at Cell.v. */
export function jsonProblems(x: unknown, path = '$', out: string[] = [], allowNaN = false): string[] {
  if (out.length > 5) return out;
  if (x === null || typeof x === 'string' || typeof x === 'boolean') return out;
  if (x === undefined) {
    // An undefined object property is dropped by JSON, which is fine; undefined in an array is not.
    return out;
  }
  if (typeof x === 'number') {
    // NaN is allowed (Cell.v renders "."; charts skip it; project files encode it). ±Infinity only in Cell.v ("∞").
    if (!Number.isNaN(x) && !Number.isFinite(x) && !allowNaN) out.push(`${x} at ${path}`);
    return out;
  }
  if (typeof x === 'function') {
    out.push(`function at ${path}`);
    return out;
  }
  if (ArrayBuffer.isView(x)) {
    out.push(`typed array at ${path}`);
    return out;
  }
  if (Array.isArray(x)) {
    x.forEach((v, i) => {
      if (v === undefined) out.push(`undefined array element at ${path}[${i}]`);
      else jsonProblems(v, `${path}[${i}]`, out, false);
    });
    return out;
  }
  if (typeof x === 'object') {
    const proto = Object.getPrototypeOf(x);
    if (proto !== Object.prototype && proto !== null) {
      out.push(`non-plain object (${(x as object).constructor?.name}) at ${path}`);
      return out;
    }
    const isCell = 'v' in (x as object) && Object.keys(x as object).every((k) => ['v', 'fmt', 'mark', 'bold', 'italic', 'colSpan', 'rowSpan', 'tone', 'indent', 'align'].includes(k));
    for (const [k, v] of Object.entries(x as object)) jsonProblems(v, `${path}.${k}`, out, isCell && k === 'v');
  }
  return out;
}

/** Row widths (with col/row spans) of header and body must all match. */
export function tableShapeProblems(t: OutputTable): string[] {
  const probs: string[] = [];
  const all = [...t.header, ...t.rows];
  if (!t.rows.length) return probs; // an empty body is allowed (the renderer shows the header)
  for (const [name, rows] of [['header', t.header], ['body', t.rows]] as const) {
    if (!rows.length) continue;
    const { grid } = layoutRows(rows);
    // Width of each row = furthest column occupied in that row (by own cells or spans from above).
    const occupied: number[] = new Array(rows.length).fill(0);
    grid.forEach((row, r) => {
      for (const g of row) for (let rr = r; rr < Math.min(rows.length, r + g.rowSpan); rr++) occupied[rr] = Math.max(occupied[rr], g.col + g.colSpan);
    });
    const widths = new Set(occupied);
    if (widths.size > 1) probs.push(`${name} rows have different widths [${[...widths].join(',')}] in "${t.title}"`);
    (t as any)[`_${name}W`] = Math.max(...occupied);
  }
  const hw = (t as any)._headerW, bw = (t as any)._bodyW;
  delete (t as any)._headerW;
  delete (t as any)._bodyW;
  if (t.header.length && hw !== undefined && bw !== undefined && hw !== bw) probs.push(`header width ${hw} != body width ${bw} in "${t.title}"`);
  void all;
  return probs;
}

/** Every string in the item: titles, cells, text, footnotes, chart labels, syntax, caseNote. */
export function allStrings(x: unknown, out: Array<{ path: string; s: string }> = [], path = '$'): Array<{ path: string; s: string }> {
  if (typeof x === 'string') out.push({ path, s: x });
  else if (Array.isArray(x)) x.forEach((v, i) => allStrings(v, out, `${path}[${i}]`));
  else if (x && typeof x === 'object' && !ArrayBuffer.isView(x)) for (const [k, v] of Object.entries(x)) allStrings(v, out, `${path}.${k}`);
  return out;
}

export function tables(item: OutputItem): OutputTable[] {
  return item.blocks.filter((b) => b.kind === 'table').map((b) => (b as { table: OutputTable }).table);
}

export function hasSignificance(item: OutputItem): boolean {
  return tables(item).some((t) => t.rows.some((r) => r.some((c) => c.fmt === 'p' && typeof c.v === 'number' && Number.isFinite(c.v))));
}

export interface OutputCheckOptions {
  /** Require an interpretation/APA text block when a finite p-value is shown. */
  requireApaWhenSig?: boolean;
}

/** All invariants on a produced OutputItem. */
export function outputProblems(item: OutputItem, opts: OutputCheckOptions = {}): Array<{ check: string; detail: string }> {
  const probs: Array<{ check: string; detail: string }> = [];
  for (const p of jsonProblems(item)) probs.push({ check: 'json', detail: p });
  try {
    JSON.stringify(item);
  } catch (e) {
    probs.push({ check: 'json', detail: `JSON.stringify threw: ${(e as Error).message}` });
  }
  if (!item.syntax || !item.syntax.trim()) probs.push({ check: 'syntax', detail: 'no SPSS syntax' });
  for (const { path, s } of allStrings(item)) {
    if (path.endsWith('.syntax')) {
      const bad = badWords(s).filter((b) => b !== 'null');
      if (bad.length) probs.push({ check: 'text', detail: `${bad.join(',')} in syntax: ${s.slice(0, 100)}` });
      continue;
    }
    const bad = badWords(s).filter((b) => !(b === 'null' && /\.text$/.test(path)));
    if (bad.length) probs.push({ check: 'text', detail: `${bad.join(',')} at ${path.replace(/\[\d+\]/g, '[]')}: "${s.slice(0, 120)}"` });
  }
  // Rendered text (what the user sees/exports): formatting of every cell and chart data table.
  try {
    const txt = itemToText(item, { style: 'apa', includeInterpretations: true, includeSyntax: false });
    const bad = badWords(txt).filter((b) => b !== 'null');
    if (bad.length) {
      const line = txt.split('\n').find((l) => badWords(l).filter((b) => b !== 'null').length) ?? '';
      probs.push({ check: 'rendered', detail: `rendered output contains ${bad.join(',')}: "${line.trim().slice(0, 120)}"` });
    }
  } catch (e) {
    probs.push({ check: 'rendered', detail: `itemToText threw: ${(e as Error).message}` });
  }
  for (const t of tables(item)) for (const p of tableShapeProblems(t)) probs.push({ check: 'shape', detail: p });
  if (opts.requireApaWhenSig !== false && hasSignificance(item)) {
    const hasText = item.blocks.some((b) => b.kind === 'text' && (b.style === 'apa' || b.style === 'interpretation'));
    if (!hasText) probs.push({ check: 'apa', detail: 'p-values shown but no interpretation/APA text' });
  }
  for (const p of percentProblems(item)) probs.push({ check: 'percent', detail: p });
  for (const b of item.blocks) {
    if (b.kind === 'text' && (b.style === 'apa' || b.style === 'interpretation')) {
      const neg = /(?:^|[\s(])(?:t|r|F|H|χ²|df)\s*\((?:[^)]*,\s*)?-\d/.exec(b.text);
      if (neg) probs.push({ check: 'apa-df', detail: `${b.style} text reports negative degrees of freedom: "…${b.text.slice(Math.max(0, neg.index - 40), neg.index + 40)}…"` });
      const empty = /(?:^|[.;:] )(?:For|In|Among) ,|\b(?:for|in) ,|""/.exec(b.text);
      if (empty) probs.push({ check: 'text-empty-name', detail: `${b.style} text has an empty name: "…${b.text.slice(Math.max(0, empty.index - 40), empty.index + 40)}…"` });
      const na = /=\s*n\/a/.exec(b.text);
      if (na && b.style === 'apa') probs.push({ check: 'apa-na', detail: `APA sentence reports a statistic as n/a: "…${b.text.slice(Math.max(0, na.index - 60), na.index + 30)}…"` });
    }
    if (b.kind === 'chart') for (const p of chartProblems(b.chart)) probs.push({ check: 'chart', detail: `${b.chart.type}: ${p}` });
    if (b.kind === 'text' && !b.text.trim()) probs.push({ check: 'text', detail: `empty ${b.style} block` });
    if (b.kind === 'table' && !b.table.title) probs.push({ check: 'text', detail: 'table without title' });
  }
  return probs;
}

/** Numeric content of all tables, as a flat list (for metamorphic comparisons). */
export function tableNumbers(item: OutputItem, filter?: (t: OutputTable) => boolean): Array<{ t: string; r: number; c: number; v: number | string | null }> {
  const out: Array<{ t: string; r: number; c: number; v: number | string | null }> = [];
  tables(item).forEach((t, ti) => {
    if (filter && !filter(t)) return;
    t.rows.forEach((row, r) => row.forEach((cell: Cell, c) => out.push({ t: `${ti}:${t.title}`, r, c, v: cell.v })));
  });
  return out;
}

/** Compare two outputs' table cells; returns the first mismatch description or null. */
export function compareTables(a: OutputItem, b: OutputItem, tol = 1e-6, skip?: (t: OutputTable) => boolean, hugeTol = false): string | null {
  const ta = tables(a).filter((t) => !skip?.(t));
  const tb = tables(b).filter((t) => !skip?.(t));
  if (ta.length !== tb.length) return `table count ${ta.length} vs ${tb.length} (${ta.map((t) => t.title).join(' | ')} vs ${tb.map((t) => t.title).join(' | ')})`;
  for (let i = 0; i < ta.length; i++) {
    const x = ta[i], y = tb[i];
    if (x.title !== y.title) return `table ${i} title "${x.title}" vs "${y.title}"`;
    if (x.rows.length !== y.rows.length) return `"${x.title}": ${x.rows.length} rows vs ${y.rows.length}`;
    for (let r = 0; r < x.rows.length; r++) {
      if (x.rows[r].length !== y.rows[r].length) return `"${x.title}" row ${r}: ${x.rows[r].length} cells vs ${y.rows[r].length}`;
      for (let c = 0; c < x.rows[r].length; c++) {
        const u = x.rows[r][c].v, v = y.rows[r][c].v;
        if (typeof u === 'number' && typeof v === 'number') {
          if (Object.is(u, v) || (Number.isNaN(u) && Number.isNaN(v))) continue;
          const d = Math.abs(u - v);
          // Diverging estimates (perfect separation): only the order of magnitude is meaningful.
          const t2 = hugeTol && Math.max(Math.abs(u), Math.abs(v)) > 1e5 ? 1e-2 : tol;
          if (!(d <= t2 * Math.max(1, Math.abs(u), Math.abs(v)))) return `"${x.title}" row ${r} col ${c}: ${u} vs ${v}`;
        } else if (u !== v) {
          return `"${x.title}" row ${r} col ${c}: ${JSON.stringify(u)} vs ${JSON.stringify(v)}`;
        }
      }
    }
  }
  return null;
}

/** Percentages that must add up: frequency tables (Percent / Valid Percent / Cumulative) and row % in crosstabs. */
export function percentProblems(item: OutputItem): string[] {
  const out: string[] = [];
  for (const t of tables(item)) {
    const head = layoutRows(t.header);
    const hdr: string[] = [];
    head.grid.forEach((row) => row.forEach((g) => { for (let c = g.col; c < g.col + g.colSpan; c++) hdr[c] = String(g.cell.v ?? ''); }));
    const body = layoutRows(t.rows);
    const mat: Array<Array<Cell | undefined>> = t.rows.map(() => []);
    body.grid.forEach((row, r) => row.forEach((g) => { for (let rr = r; rr < r + g.rowSpan && rr < mat.length; rr++) for (let c = g.col; c < g.col + g.colSpan; c++) mat[rr][c] = g.cell; }));
    const num = (c: Cell | undefined) => (c && typeof c.v === 'number' && Number.isFinite(c.v) ? c.v : null);
    const iPct = hdr.findIndex((h) => h === 'Percent');
    const iValid = hdr.findIndex((h) => h === 'Valid Percent');
    const iCum = hdr.findIndex((h) => h === 'Cumulative Percent');
    if (iPct > 0 && iValid > 0) {
      let sumValid = 0, sumPct = 0, nValid = 0, lastCum: number | null = null;
      mat.forEach((row) => {
        const a = String(row[0]?.v ?? ''), b = String(row[1]?.v ?? '');
        if (a === 'Total' || b === 'Total') return;
        if (a === 'Valid' && num(row[iValid]) !== null) {
          nValid++;
          sumValid += num(row[iValid]) ?? 0;
          if (iCum > 0 && num(row[iCum]) !== null) lastCum = num(row[iCum]);
        }
        if (a === 'Valid' || a === 'Missing') sumPct += num(row[iPct]) ?? 0;
      });
      if (nValid && Math.abs(sumValid - 100) > 0.5) out.push(`"${t.title}": valid percents add up to ${sumValid.toFixed(2)}`);
      if (nValid && Math.abs(sumPct - 100) > 0.5 && sumPct > 0) out.push(`"${t.title}": percents add up to ${sumPct.toFixed(2)}`);
      if (lastCum !== null && Math.abs(lastCum - 100) > 0.5) out.push(`"${t.title}": cumulative percent ends at ${lastCum}`);
    }
    // Crosstab rows "% within <row variable>": the Total column is 100.
    if (/Crosstabulation/.test(t.title)) {
      const rowVar = t.title.split(' * ')[0];
      mat.forEach((row, r) => {
        const stubText = row.slice(0, t.stubColumns ?? 1).map((c) => String(c?.v ?? '')).join(' ');
        if (!stubText.includes(`% within ${rowVar}`)) return;
        const last = num(row[row.length - 1]);
        if (last !== null && Math.abs(last - 100) > 0.05 && last !== 0) out.push(`"${t.title}" row ${r}: row percent total is ${last}`);
      });
    }
  }
  return out;
}
