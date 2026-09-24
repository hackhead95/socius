// Number formatting for output tables. Pure functions (unit-tested); every renderer and exporter
// (screen, clipboard, Word, HTML, Excel, text) formats cells through here so they always agree.
//
// Rules, by CellFormat:
// - int      Rounded, thousands separators: 1,234. (Weighted counts are rounded like SPSS shows them.)
// - dec1..4  Fixed decimals, thousands separators from 1,000 up: 1,234.50.
// - pct      One decimal. The "%" sign is shown unless the column header already names the unit
//            ("Percent", "%", "Valid Percent"): 45.2% in a crosstab cell, 45.2 under "Percent".
//            SPSS output does the same, so the rule is identical in both table styles.
// - p        Three decimals without the leading zero. Below .001: APA "< .001", SPSS "<.001".
//            Never "0.000" or ".000". 1 shows as "1.000".
// - r        Three decimals, leading zero dropped (".452", "-.087"); |r| >= 1 keeps it ("1.000").
// - coef     Three decimals, leading zero kept (coefficients can exceed 1): 0.452, 12.300.
// - text     As given. Numbers without a format: integers get separators, others up to 3 decimals.
// Special values: NaN -> "." (SPSS: not computable); null -> blank; ±Infinity -> "∞" / "-∞".
// Marks (e.g. "*", "a") are returned separately so renderers can superscript them.

import type { Cell, CellFormat, OutputTable } from '../../core/output';

export type TableStyle = 'apa' | 'spss';

export interface FormatContext {
  style: TableStyle;
  /** The column header already says the values are percentages. */
  percentColumn?: boolean;
}

function group(v: number, decimals: number): string {
  const s = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: Math.abs(v) >= 1000 });
  // Normalise negative zero ("-0.00" -> "0.00").
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s;
}

function dropLeadingZero(s: string): string {
  return s.replace(/^(-?)0\./, '$1.');
}

/** Format a number by CellFormat. */
export function formatNumber(v: number, fmt: CellFormat | undefined, ctx: FormatContext = { style: 'apa' }): string {
  if (Number.isNaN(v)) return '.';
  if (v === Infinity) return '∞';
  if (v === -Infinity) return '-∞';
  switch (fmt) {
    case 'int':
      return group(Math.round(v), 0);
    case 'dec1':
      return group(v, 1);
    case 'dec2':
      return group(v, 2);
    case 'dec3':
      return group(v, 3);
    case 'dec4':
      return group(v, 4);
    case 'pct': {
      const s = group(v, 1);
      return ctx.percentColumn ? s : s + '%';
    }
    case 'p':
      return formatP(v, ctx.style);
    case 'r': {
      if (Math.abs(v) >= 0.9995) return group(v, 3);
      return dropLeadingZero(group(v, 3));
    }
    case 'coef':
      return group(v, 3);
    case 'text':
    case undefined:
    default: {
      if (Number.isInteger(v)) return group(v, 0);
      const s = v.toLocaleString('en-US', { maximumFractionDigits: 3, useGrouping: Math.abs(v) >= 1000 });
      return s === '-0' ? '0' : s;
    }
  }
}

/** p-value text. APA: ".032", "< .001". SPSS: ".032", "<.001". */
export function formatP(p: number, style: TableStyle = 'apa'): string {
  if (Number.isNaN(p)) return '.';
  if (p < 0.001) return style === 'apa' ? '< .001' : '<.001';
  // APA 7: p values that round to 1 are reported as "> .999"; SPSS tables print 1.000.
  if (p >= 0.9995) return style === 'apa' ? '> .999' : '1.000';
  return dropLeadingZero(p.toFixed(3));
}

export interface FormattedCell {
  text: string;
  mark?: string;
  /** Numeric cells align right by default. */
  numeric: boolean;
}

/** Format one table cell. */
export function formatCell(cell: Cell, ctx: FormatContext = { style: 'apa' }): FormattedCell {
  const { v } = cell;
  if (v === null || v === undefined) return { text: '', mark: cell.mark, numeric: false };
  if (typeof v === 'string') return { text: v, mark: cell.mark, numeric: false };
  return { text: formatNumber(v, cell.fmt, ctx), mark: cell.mark, numeric: cell.fmt !== 'text' };
}

/** Plain text of a cell including its mark (for text/Excel export and clipboard fallbacks). */
export function cellText(cell: Cell, ctx: FormatContext = { style: 'apa' }): string {
  const f = formatCell(cell, ctx);
  return f.text + (f.mark ?? '');
}

/** True if a p-value cell is below .05 (used for subtle highlighting when the procedure did not set a tone). */
export function isSignificantP(cell: Cell): boolean {
  return cell.fmt === 'p' && typeof cell.v === 'number' && Number.isFinite(cell.v) && cell.v < 0.05;
}

// ---------- Table geometry ----------

export interface GridCell {
  cell: Cell;
  /** Absolute column index of the cell's first column. */
  col: number;
  colSpan: number;
  rowSpan: number;
}

/**
 * Lay out rows of cells with colSpan/rowSpan onto absolute column positions (like an HTML table
 * does), so exporters and the percent-column rule know which column every cell sits in.
 */
export function layoutRows(rows: Cell[][]): { grid: GridCell[][]; columns: number } {
  const occupied: boolean[][] = [];
  const grid: GridCell[][] = [];
  let columns = 0;
  rows.forEach((row, r) => {
    occupied[r] = occupied[r] ?? [];
    const out: GridCell[] = [];
    let c = 0;
    for (const cell of row) {
      while (occupied[r][c]) c++;
      const cs = Math.max(1, cell.colSpan ?? 1);
      const rs = Math.max(1, cell.rowSpan ?? 1);
      for (let rr = r; rr < Math.min(rows.length, r + rs); rr++) {
        occupied[rr] = occupied[rr] ?? [];
        for (let cc = c; cc < c + cs; cc++) occupied[rr][cc] = true;
      }
      out.push({ cell, col: c, colSpan: cs, rowSpan: rs });
      c += cs;
      columns = Math.max(columns, c);
    }
    columns = Math.max(columns, occupied[r].length);
    grid.push(out);
  });
  return { grid, columns };
}

const PERCENT_HEADER = /%|\bpercent(age)?\b|\bpct\b/i;

/**
 * For each absolute column, whether its header (any header row covering it) names percentages.
 * Header cells that span several columns count for each column only if they are the lowest header
 * over that column, so a spanning "Sex" over "Count"/"%" columns does not mark both.
 */
export function percentColumns(table: OutputTable): boolean[] {
  const { grid, columns } = layoutRows(table.header);
  const lowest: Array<string | null> = new Array(columns).fill(null);
  grid.forEach((row) => {
    for (const g of row) {
      const text = typeof g.cell.v === 'string' ? g.cell.v : '';
      for (let c = g.col; c < g.col + g.colSpan; c++) lowest[c] = text;
    }
  });
  return lowest.map((t) => !!t && PERCENT_HEADER.test(t));
}

/** Number of stub (row-header) columns. */
export function stubCount(table: OutputTable): number {
  return table.stubColumns ?? 1;
}
