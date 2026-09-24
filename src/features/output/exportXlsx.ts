// Output tables -> .xlsx (one sheet per table). Numbers stay numbers with Excel formats that match
// the on-screen formatting; p < .001 is written as text so it never shows as 0.000.
import writeXlsxFile from 'write-excel-file/universal';
import type { Cell, OutputTable } from '../../core/output';
import { formatCell, layoutRows, percentColumns, type TableStyle } from './format';

type XCell = { value?: string | number; type?: StringConstructor | NumberConstructor; format?: string; fontWeight?: 'bold'; fontStyle?: 'italic'; align?: 'left' | 'center' | 'right'; columnSpan?: number; rowSpan?: number; bottomBorderStyle?: 'thin' | 'medium'; topBorderStyle?: 'thin' | 'medium'; indent?: number; wrap?: boolean } | null;

const FORMATS: Record<string, string> = {
  int: '#,##0',
  dec1: '#,##0.0',
  dec2: '#,##0.00',
  dec3: '#,##0.000',
  dec4: '#,##0.0000',
  coef: '#,##0.000',
  r: '.000;-.000',
  p: '.000',
};

function xcell(c: Cell, style: TableStyle, pctCol: boolean): XCell {
  const base: NonNullable<XCell> = {};
  if (c.bold) base.fontWeight = 'bold';
  if (c.italic) base.fontStyle = 'italic';
  if (c.indent) base.indent = c.indent;
  if (c.align) base.align = c.align;
  const v = c.v;
  if (v === null || v === undefined) return { ...base };
  if (typeof v === 'number' && Number.isFinite(v) && !c.mark && c.fmt !== 'text') {
    if (c.fmt === 'p' && v < 0.001) return { ...base, value: style === 'apa' ? '< .001' : '<.001', type: String, align: 'right' };
    if (c.fmt === 'r' && Math.abs(v) >= 0.9995) return { ...base, value: v, type: Number, format: '0.000' };
    if (c.fmt === 'pct') return { ...base, value: v, type: Number, format: pctCol ? '0.0' : '0.0"%"' };
    return { ...base, value: v, type: Number, format: c.fmt ? FORMATS[c.fmt] ?? '0.###' : Number.isInteger(v) ? '#,##0' : '0.###' };
  }
  const f = formatCell(c, { style, percentColumn: pctCol });
  return { ...base, value: f.text + (f.mark ?? ''), type: String, align: base.align ?? (f.numeric ? 'right' : undefined) };
}

/** Sheet rows for one table: title, header rows, body, footnotes. */
export function tableSheetData(table: OutputTable, style: TableStyle): { data: XCell[][]; widths: number[] } {
  const pctCols = percentColumns(table);
  const head = layoutRows(table.header);
  const body = layoutRows(table.rows);
  const columns = Math.max(1, head.columns, body.columns);
  const data: XCell[][] = [];
  const widths = new Array(columns).fill(8);
  data.push([{ value: table.title, type: String, fontWeight: 'bold' }]);
  if (table.subtitle) data.push([{ value: table.subtitle, type: String, fontStyle: 'italic' }]);
  const rules = new Set(table.ruleBefore ?? []);
  const place = (grid: ReturnType<typeof layoutRows>['grid'], isHeader: boolean) => {
    const start = data.length;
    grid.forEach((row, r) => {
      const line: XCell[] = data[start + r] ?? new Array(columns).fill(null);
      data[start + r] = line;
      for (const g of row) {
        const x = xcell(g.cell, style, pctCols[g.col]);
        if (!x) continue;
        if (isHeader) {
          x.fontWeight = 'bold';
          x.align = x.align ?? (g.col < (table.stubColumns ?? 1) ? 'left' : 'center');
          x.wrap = true;
          if (r + g.rowSpan >= grid.length) x.bottomBorderStyle = 'thin';
        }
        if (!isHeader && rules.has(r)) x.topBorderStyle = 'thin';
        if (g.colSpan > 1) x.columnSpan = g.colSpan;
        if (g.rowSpan > 1) x.rowSpan = g.rowSpan;
        line[g.col] = x;
        const len = String(x.value ?? '').length + (g.cell.indent ?? 0) * 2;
        if (g.colSpan === 1) widths[g.col] = Math.min(isHeader ? 24 : 50, Math.max(widths[g.col], len + 2));
      }
      // Pad spanned positions so rows keep their shape.
      for (let c = 0; c < columns; c++) if (line[c] === undefined) line[c] = null;
      // Rows spanned from above need their slots created too.
      for (const g of row)
        for (let rr = 1; rr < g.rowSpan; rr++) {
          data[start + r + rr] = data[start + r + rr] ?? new Array(columns).fill(null);
        }
    });
  };
  place(head.grid, true);
  place(body.grid, false);
  for (const fn of table.footnotes ?? []) data.push([{ value: fn, type: String, fontStyle: 'italic' }]);
  return { data, widths };
}

function sheetName(title: string, used: Set<string>): string {
  const base = title.replace(/[[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28).trim() || 'Table';
  let name = base;
  for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base.slice(0, 27 - String(i).length)} ${i}`;
  used.add(name.toLowerCase());
  return name;
}

/** Workbook with one sheet per table. */
export async function tablesToXlsx(tables: OutputTable[], style: TableStyle): Promise<Blob> {
  if (!tables.length) throw new Error('There are no tables to export.');
  const used = new Set<string>();
  const sheets = tables.map((t, i) => {
    const { data, widths } = tableSheetData(t, style);
    return { data: data as any, sheet: sheetName(`${i + 1} ${t.title}`, used), columns: widths.map((w) => ({ width: w })) };
  });
  return writeXlsxFile(sheets as any, { fontFamily: 'Calibri', fontSize: 11 }).toBlob();
}
