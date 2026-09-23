// Word (DOCX) exports: codebook table (thesis appendix) and the qualitative report.

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { CodingProject } from '../../core/coding-types';
import { codeFrequencies } from './analysis';
import { buildCodeTree, flattenTree } from './tree';
import type { ReportData } from './exports';

const FONT = 'Calibri';

function run(text: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}): TextRun {
  return new TextRun({ text, font: FONT, size: opts.size ?? 20, bold: opts.bold, italics: opts.italics, color: opts.color });
}

function para(text: string, opts: { bold?: boolean; italics?: boolean; size?: number; spacingAfter?: number; indent?: number } = {}): Paragraph {
  const lines = text.split('\n');
  return new Paragraph({
    spacing: { after: opts.spacingAfter ?? 60 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    children: lines.flatMap((l, i) => (i === 0 ? [run(l, opts)] : [new TextRun({ break: 1 }), run(l, opts)])),
  });
}

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function tcell(text: string, opts: { header?: boolean; width?: number; indent?: number } = {}): TableCell {
  return new TableCell({
    borders: cellBorders,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E7EAEE' } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [para(text || ' ', { bold: opts.header, size: 18, spacingAfter: 0, indent: opts.indent })],
  });
}

export interface CodebookDocxOptions {
  title?: string;
  includeCounts?: boolean;
}

/** Codebook as a Word table (for a thesis appendix). Landscape A4. */
export async function codebookDocx(project: CodingProject, opts: CodebookDocxOptions = {}): Promise<Uint8Array> {
  const nodes = flattenTree(buildCodeTree(project.codes));
  const freq = new Map(codeFrequencies(project.codes, project.docs, project.segments).rows.map((r) => [r.codeId, r]));
  const header = ['Code', 'Definition', 'Include when', 'Exclude when', 'Example'];
  if (opts.includeCounts) header.push('Segments', 'Documents');
  const widths = opts.includeCounts ? [16, 22, 16, 16, 18, 6, 6] : [18, 24, 18, 18, 22];
  const rows = [
    new TableRow({ tableHeader: true, children: header.map((h, i) => tcell(h, { header: true, width: widths[i] })) }),
    ...nodes.map(
      (n) =>
        new TableRow({
          cantSplit: true,
          children: [
            tcell(n.code.name, { indent: n.depth * 240 }),
            tcell(n.code.description),
            tcell(n.code.inclusion ?? ''),
            tcell(n.code.exclusion ?? ''),
            tcell(n.code.example ?? ''),
            ...(opts.includeCounts ? [tcell(String(freq.get(n.code.id)?.segments ?? 0)), tcell(String(freq.get(n.code.id)?.docs ?? 0))] : []),
          ],
        }),
    ),
  ];
  const doc = new Document({
    creator: 'Socius',
    title: opts.title ?? 'Codebook',
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE, width: 16838, height: 11906 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(opts.title ?? 'Codebook', { bold: true, size: 28 })], spacing: { after: 120 } }),
          para(`${project.codes.length} codes. Sub-codes are indented under their theme.`, { italics: true, size: 18, spacingAfter: 160 }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
        ],
      },
    ],
  });
  return new Uint8Array(await Packer.toArrayBuffer(doc));
}

/** The same report as a Word document. */
export async function reportDocx(data: ReportData): Promise<Uint8Array> {
  const children: Array<Paragraph | Table> = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [run(data.title, { bold: true, size: 36 })] }),
    para(
      `${data.nDocuments} documents, ${data.nResponses} open-ended responses, ${data.codes.length} codes, ${data.nSegments} coded segments. Generated ${data.generated} with Socius.`,
      { italics: true, size: 18, spacingAfter: 200 },
    ),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run('Code frequencies', { bold: true, size: 28 })], spacing: { after: 120 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ tableHeader: true, children: ['Code', 'Segments', 'Sources', '% of sources'].map((h, i) => tcell(h, { header: true, width: i === 0 ? 55 : 15 })) }),
        ...data.codes.map(
          (c) =>
            new TableRow({
              children: [tcell(c.code.name, { indent: c.depth * 240 }), tcell(String(c.segments)), tcell(String(c.docs)), tcell(`${c.pctDocs.toFixed(1)}%`)],
            }),
        ),
      ],
    }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run('Codebook with example quotes', { bold: true, size: 28 })], spacing: { before: 300, after: 120 } }),
  ];
  for (const c of data.codes) {
    children.push(
      new Paragraph({
        heading: c.depth === 0 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 60 },
        children: [run(c.path, { bold: true, size: c.depth === 0 ? 24 : 22 })],
      }),
      para(`${c.segments} segments in ${c.docs} sources (${c.pctDocs.toFixed(1)}%)`, { italics: true, size: 18 }),
    );
    children.push(para(c.code.description || 'No definition written yet.'));
    if (c.code.inclusion) children.push(new Paragraph({ spacing: { after: 60 }, children: [run('Include when: ', { bold: true }), run(c.code.inclusion)] }));
    if (c.code.exclusion) children.push(new Paragraph({ spacing: { after: 60 }, children: [run('Exclude when: ', { bold: true }), run(c.code.exclusion)] }));
    if (c.code.example) children.push(new Paragraph({ spacing: { after: 60 }, children: [run('Example: ', { bold: true }), run(c.code.example)] }));
    for (const q of c.quotes) {
      children.push(
        new Paragraph({
          indent: { left: 567, right: 567 },
          spacing: { after: 40 },
          children: [run(`"${q.text}"`, { italics: true })],
        }),
        new Paragraph({ indent: { left: 567 }, alignment: AlignmentType.LEFT, spacing: { after: 120 }, children: [run(q.source, { size: 16, color: '5D6878' })] }),
      );
    }
  }
  const doc = new Document({ creator: 'Socius', title: data.title, sections: [{ children }] });
  return new Uint8Array(await Packer.toArrayBuffer(doc));
}
