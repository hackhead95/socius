// Output table -> HTML string (inline styles, for Word/Google Docs paste and the HTML report) and
// -> plain text. Pure: no DOM, so exporters and tests share it.

import type { Cell, OutputTable } from '../../core/output';
import { formatCell, layoutRows, percentColumns, stubCount, type TableStyle } from './format';

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface TableHtmlOptions {
  style: TableStyle;
  /** APA table number ("Table 3"). */
  number?: number;
  /** Font family for the table; omit to inherit the target document's font. */
  fontFamily?: string;
}

const INK = '#000000';
const GRID = '#b7c0cc';
const HEAD_BG = '#eef1f4';

function cellAlign(cell: Cell, isStub: boolean, numeric: boolean, header: boolean): string {
  if (cell.align) return cell.align;
  if (isStub) return 'left';
  if (header) return 'center';
  return numeric ? 'right' : 'left';
}

/** One table as an HTML fragment with inline styles only. */
export function tableToHtml(table: OutputTable, opts: TableHtmlOptions): string {
  const apa = opts.style === 'apa';
  const stubs = stubCount(table);
  const pctCols = percentColumns(table);
  const head = layoutRows(table.header);
  const body = layoutRows(table.rows);
  const rules = new Set(table.ruleBefore ?? []);
  const font = opts.fontFamily ? `font-family:${opts.fontFamily};` : '';
  const size = apa ? '10.5pt' : '9pt';
  const parts: string[] = [];

  // Caption
  if (apa) {
    if (opts.number !== undefined) parts.push(`<p style="margin:12pt 0 0 0;${font}font-size:11pt;font-weight:bold;">Table ${opts.number}</p>`);
    parts.push(`<p style="margin:${opts.number !== undefined ? '4pt' : '12pt'} 0 6pt 0;${font}font-size:11pt;font-style:italic;">${esc(table.title)}</p>`);
  } else {
    parts.push(`<p style="margin:12pt 0 4pt 0;${font}font-size:10pt;font-weight:bold;">${esc(table.title)}</p>`);
  }
  if (table.subtitle) parts.push(`<p style="margin:0 0 4pt 0;${font}font-size:9.5pt;color:#444444;">${esc(table.subtitle)}</p>`);

  const tableStyle = apa
    ? `border-collapse:collapse;${font}font-size:${size};border-top:1.5px solid ${INK};border-bottom:1.5px solid ${INK};`
    : `border-collapse:collapse;${font}font-size:${size};border:1px solid ${GRID};`;
  parts.push(`<table style="${tableStyle}" cellspacing="0" cellpadding="0">`);

  const cellHtml = (g: { cell: Cell; col: number; colSpan: number; rowSpan: number }, isHeader: boolean, lastHeaderRow: boolean, ruleTop: boolean, isLastBodyRow: boolean) => {
    const c = g.cell;
    const isStub = g.col < stubs;
    const f = formatCell(c, { style: opts.style, percentColumn: pctCols[g.col] });
    const align = cellAlign(c, isStub, f.numeric, isHeader);
    const st: string[] = [`padding:${apa ? '3pt 8pt' : '2pt 6pt'}`, `text-align:${align}`, 'vertical-align:' + (isHeader ? 'bottom' : 'top')];
    if (apa) {
      if (isHeader && lastHeaderRow) st.push(`border-bottom:1px solid ${INK}`);
      else if (isHeader && g.colSpan > 1) st.push(`border-bottom:1px solid ${INK}`);
      if (ruleTop) st.push(`border-top:1px solid ${INK}`);
      if (isLastBodyRow) st.push(`border-bottom:1.5px solid ${INK}`);
    } else {
      st.push(`border:1px solid ${GRID}`);
      if (isHeader || isStub) st.push(`background:${HEAD_BG}`);
      if (ruleTop) st.push(`border-top:1.5px solid #5d6878`);
    }
    if (c.italic) st.push('font-style:italic');
    if (c.indent) st.push(`padding-left:${(apa ? 8 : 6) + c.indent * 12}pt`);
    if (f.numeric) st.push('white-space:nowrap');
    const tag = isHeader || isStub ? 'th' : 'td';
    const span = `${g.colSpan > 1 ? ` colspan="${g.colSpan}"` : ''}${g.rowSpan > 1 ? ` rowspan="${g.rowSpan}"` : ''}`;
    const scope = isHeader ? ' scope="col"' : isStub ? ' scope="row"' : '';
    const mark = f.mark ? `<sup style="line-height:0;">${esc(f.mark)}</sup>` : '';
    return `<${tag}${span}${scope} style="${st.join(';')};font-weight:${c.bold || isHeader ? 'bold' : 'normal'}">${esc(f.text)}${mark}</${tag}>`;
  };

  if (head.grid.length) {
    parts.push('<thead>');
    head.grid.forEach((row, r) => {
      parts.push('<tr>' + row.map((g) => cellHtml(g, true, r + g.rowSpan >= head.grid.length, false, false)).join('') + '</tr>');
    });
    parts.push('</thead>');
  }
  parts.push('<tbody>');
  body.grid.forEach((row, r) => {
    parts.push('<tr>' + row.map((g) => cellHtml(g, false, false, rules.has(r), false)).join('') + '</tr>');
  });
  parts.push('</tbody></table>');
  if (table.footnotes?.length) {
    parts.push(
      table.footnotes
        .map((fn, i) => `<p style="margin:${i ? '1pt' : '4pt'} 0 0 0;${font}font-size:${apa ? '9.5pt' : '8.5pt'};">${apa && i === 0 ? '<i>Note.</i> ' : ''}${esc(fn)}</p>`)
        .join(''),
    );
  }
  return parts.join('');
}

/** Plain-text table with aligned columns (spans flattened into their first column). */
export function tableToText(table: OutputTable, style: TableStyle = 'apa'): string {
  const pctCols = percentColumns(table);
  const head = layoutRows(table.header);
  const body = layoutRows(table.rows);
  const columns = Math.max(head.columns, body.columns);
  const stubs = stubCount(table);
  const toMatrix = (grid: typeof head.grid) =>
    grid.map((row) => {
      const out: string[] = new Array(columns).fill('');
      for (const g of row) {
        const f = formatCell(g.cell, { style, percentColumn: pctCols[g.col] });
        out[g.col] = ' '.repeat((g.cell.indent ?? 0) * 2) + f.text + (f.mark ?? '');
      }
      return out;
    });
  const hm = toMatrix(head.grid);
  const bm = toMatrix(body.grid);
  const widths = new Array(columns).fill(0);
  // Spanning header text should not blow up a single column: count only single-column cells.
  head.grid.forEach((row, r) => row.forEach((g) => { if (g.colSpan === 1) widths[g.col] = Math.max(widths[g.col], hm[r][g.col].length); }));
  bm.forEach((row) => row.forEach((t, c) => (widths[c] = Math.max(widths[c], t.length))));
  const line = (row: string[]) =>
    row
      .map((t, c) => (c < stubs ? t.padEnd(widths[c]) : t.padStart(widths[c])))
      .join('  ')
      .trimEnd();
  const total = widths.reduce((a, b) => a + b, 0) + 2 * (columns - 1);
  const rule = '-'.repeat(Math.max(total, table.title.length));
  const out = [table.title];
  if (table.subtitle) out.push(table.subtitle);
  out.push(rule, ...hm.map(line), rule);
  const rules = new Set(table.ruleBefore ?? []);
  bm.forEach((row, r) => {
    if (rules.has(r) && r > 0) out.push('-'.repeat(total));
    out.push(line(row));
  });
  out.push(rule);
  for (const fn of table.footnotes ?? []) out.push(fn);
  return out.join('\n');
}

