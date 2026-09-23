// Output items -> Word (.docx) with the `docx` library. Tables become real Word tables in APA style
// (horizontal rules only, bold header, no vertical borders); charts are embedded as PNG images.

import {
  AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, Packer, Paragraph, Table, TableCell, TableLayoutType, TableRow, TextRun,
  VerticalAlignTable, WidthType, type IBorderOptions,
} from 'docx';
import type { ChartSpec, OutputItem, OutputTable } from '../../core/output';
import { formatCell, layoutRows, percentColumns } from './format';
import { blockVisible, itemMeta, type ReportOptions } from './reportHtml';

export interface ChartImage {
  bytes: Uint8Array;
  /** CSS pixels (the image is usually rendered at 2x for sharpness). */
  width: number;
  height: number;
}

export type ChartImageProvider = (spec: ChartSpec) => Promise<ChartImage | null>;

const FONT = 'Times New Roman';
const MONO = 'Consolas';
const NONE: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const RULE_THICK: IBorderOptions = { style: BorderStyle.SINGLE, size: 12, color: '000000' };
const RULE: IBorderOptions = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
/** Usable text width on US Letter / A4 with 1-inch margins, in twips (6.5 in). */
const TEXT_WIDTH = 9360;

function tableToDocx(table: OutputTable, number: number): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  out.push(new Paragraph({ spacing: { before: 240, after: 0 }, keepNext: true, children: [new TextRun({ text: `Table ${number}`, bold: true, font: FONT, size: 24 })] }));
  out.push(new Paragraph({ spacing: { before: 120, after: 120 }, keepNext: true, children: [new TextRun({ text: table.title, italics: true, font: FONT, size: 24 })] }));
  if (table.subtitle) out.push(new Paragraph({ spacing: { after: 80 }, keepNext: true, children: [new TextRun({ text: table.subtitle, font: FONT, size: 20 })] }));

  const pctCols = percentColumns(table);
  const head = layoutRows(table.header);
  const body = layoutRows(table.rows);
  const columns = Math.max(1, head.columns, body.columns);
  const stubs = table.stubColumns ?? 1;
  const rules = new Set(table.ruleBefore ?? []);

  // Column widths from content length (twips), scaled to fit the text width.
  const chars = new Array(columns).fill(3);
  const measure = (grid: typeof head.grid) =>
    grid.forEach((row) =>
      row.forEach((g) => {
        if (g.colSpan !== 1) return;
        const f = formatCell(g.cell, { style: 'apa', percentColumn: pctCols[g.col] });
        chars[g.col] = Math.max(chars[g.col], Math.min(40, f.text.length + (f.mark?.length ?? 0) + (g.cell.indent ?? 0) * 2));
      }),
    );
  measure(head.grid);
  measure(body.grid);
  let widths = chars.map((c) => 160 + c * 110);
  const total = widths.reduce((a, b) => a + b, 0);
  if (total > TEXT_WIDTH) widths = widths.map((w) => Math.floor((w / total) * TEXT_WIDTH));

  const mkCell = (g: (typeof head.grid)[number][number], isHeader: boolean, lastHeaderRow: boolean, ruleTop: boolean) => {
    const c = g.cell;
    const f = formatCell(c, { style: 'apa', percentColumn: pctCols[g.col] });
    const isStub = g.col < stubs;
    const align = c.align ?? (isStub ? 'left' : isHeader ? 'center' : f.numeric ? 'right' : 'left');
    const runs = [new TextRun({ text: f.text, bold: c.bold || isHeader, italics: c.italic, font: FONT, size: 20 })];
    if (f.mark) runs.push(new TextRun({ text: f.mark, superScript: true, font: FONT, size: 20 }));
    const width = widths.slice(g.col, g.col + g.colSpan).reduce((a, b) => a + b, 0);
    const bottom = isHeader && (lastHeaderRow || g.colSpan > 1) ? RULE : NONE;
    return new TableCell({
      children: [
        new Paragraph({
          alignment: align === 'right' ? AlignmentType.RIGHT : align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
          indent: c.indent ? { left: c.indent * 200 } : undefined,
          children: runs,
        }),
      ],
      columnSpan: g.colSpan > 1 ? g.colSpan : undefined,
      rowSpan: g.rowSpan > 1 ? g.rowSpan : undefined,
      width: { size: width, type: WidthType.DXA },
      verticalAlign: isHeader ? VerticalAlignTable.BOTTOM : VerticalAlignTable.TOP,
      margins: { top: 30, bottom: 30, left: 90, right: 90 },
      borders: { top: ruleTop ? RULE : NONE, bottom, left: NONE, right: NONE },
    });
  };

  const rows: TableRow[] = [];
  head.grid.forEach((row, r) => {
    rows.push(new TableRow({ tableHeader: true, cantSplit: true, children: row.map((g) => mkCell(g, true, r + g.rowSpan >= head.grid.length, false)) }));
  });
  body.grid.forEach((row, r) => {
    rows.push(new TableRow({ cantSplit: true, children: row.map((g) => mkCell(g, false, false, rules.has(r))) }));
  });
  if (!rows.length) return out;
  out.push(
    new Table({
      rows,
      columnWidths: widths,
      layout: TableLayoutType.FIXED,
      width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      borders: { top: RULE_THICK, bottom: RULE_THICK, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
    }),
  );
  (table.footnotes ?? []).forEach((fn, i) => {
    out.push(
      new Paragraph({
        spacing: { before: i === 0 ? 80 : 0 },
        children: [...(i === 0 ? [new TextRun({ text: 'Note. ', italics: true, font: FONT, size: 20 })] : []), new TextRun({ text: fn, font: FONT, size: 20 })],
      }),
    );
  });
  return out;
}

function para(text: string, opts: { size?: number; italics?: boolean; color?: string; bold?: boolean; before?: number; after?: number; lead?: string } = {}): Paragraph {
  const runs: TextRun[] = [];
  if (opts.lead) runs.push(new TextRun({ text: opts.lead, bold: true, font: FONT, size: opts.size ?? 24, color: opts.color }));
  text.split('\n').forEach((line, i) => runs.push(new TextRun({ text: line, break: i > 0 ? 1 : undefined, italics: opts.italics, bold: opts.bold, color: opts.color, font: FONT, size: opts.size ?? 24 })));
  return new Paragraph({ spacing: { before: opts.before ?? 80, after: opts.after ?? 80 }, children: runs });
}

/** Build the Word document for a set of output items. */
export async function buildDocx(items: OutputItem[], opts: ReportOptions, chartImage: ChartImageProvider, title = 'Analysis report'): Promise<Uint8Array> {
  const children: Array<Paragraph | Table> = [];
  const datasets = [...new Set(items.map((i) => i.datasetName).filter(Boolean))] as string[];
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: title, font: FONT, size: 36, bold: true, color: '000000' })] }));
  children.push(para([datasets.length ? `Data: ${datasets.join(', ')}` : '', `Created ${date}`].filter(Boolean).join('. ') + '.', { size: 20, color: '555555', after: 240 }));

  let tableNo = 0;
  let figNo = 0;
  for (const item of items) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 60 }, keepNext: true, children: [new TextRun({ text: item.title, font: FONT, size: 28, bold: true, color: '000000' })] }));
    const meta = [...itemMeta(item), item.caseNote].filter(Boolean).join('. ');
    children.push(para(meta, { size: 18, color: '666666', before: 0, after: 120 }));
    for (const b of item.blocks) {
      if (!blockVisible(b, opts)) continue;
      switch (b.kind) {
        case 'heading':
          children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 240, after: 60 }, children: [new TextRun({ text: b.text, font: FONT, size: 24, bold: true, color: '000000' })] }));
          break;
        case 'table':
          children.push(...tableToDocx(b.table, ++tableNo));
          break;
        case 'chart': {
          const img = await chartImage(b.chart);
          if (!img) break;
          figNo++;
          const maxW = 576; // 6 in at 96 dpi
          const w = Math.min(maxW, img.width);
          const h = Math.round((img.height / img.width) * w);
          children.push(new Paragraph({ spacing: { before: 240, after: 0 }, keepNext: true, children: [new TextRun({ text: `Figure ${figNo}`, bold: true, font: FONT, size: 24 })] }));
          children.push(new Paragraph({ spacing: { before: 120, after: 120 }, keepNext: true, children: [new TextRun({ text: b.chart.title, italics: true, font: FONT, size: 24 })] }));
          children.push(new Paragraph({ children: [new ImageRun({ type: 'png', data: img.bytes, transformation: { width: w, height: h }, altText: { title: b.chart.title, description: b.chart.title, name: `Figure ${figNo}` } })] }));
          break;
        }
        case 'text':
          if (b.style === 'interpretation') children.push(para(b.text));
          else if (b.style === 'apa') children.push(para(b.text));
          else if (b.style === 'warning') children.push(para(b.text, { size: 20, lead: 'Check this: ' }));
          else children.push(para(b.text, { size: 20, color: '555555' }));
          break;
      }
    }
    if (opts.includeSyntax && item.syntax) {
      children.push(para('Syntax', { size: 18, bold: true, color: '555555', before: 160, after: 40 }));
      for (const line of item.syntax.split('\n')) children.push(new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: line || ' ', font: MONO, size: 17 })] }));
    }
  }

  const doc = new Document({
    creator: 'Socius',
    title,
    description: 'Analysis output exported from Socius',
    styles: { default: { document: { run: { font: FONT, size: 24 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  const buf = await Packer.toArrayBuffer(doc);
  return new Uint8Array(buf);
}
