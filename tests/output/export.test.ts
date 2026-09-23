import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildDocx } from '../../src/features/output/exportDocx';
import { reportToHtmlDocument, itemToHtml } from '../../src/features/output/reportHtml';
import { reportToText } from '../../src/features/output/exportText';
import { tableToHtml, tableToText } from '../../src/features/output/tableRender';
import { tablesToXlsx, tableSheetData } from '../../src/features/output/exportXlsx';
import { sampleItem, TINY_PNG } from './fixtures';

const opts = { style: 'apa' as const, includeInterpretations: true, includeSyntax: true };

describe('Word export', () => {
  it('produces a valid docx with tables, image and text', async () => {
    const bytes = await buildDocx([sampleItem()], opts, async () => ({ bytes: TINY_PNG, width: 680, height: 340 }));
    const files = unzipSync(bytes);
    expect(Object.keys(files)).toContain('word/document.xml');
    const xml = strFromU8(files['word/document.xml']);
    expect(xml).toContain('Education by sex');
    expect(xml).toContain('Pearson Chi-Square');
    expect(xml).toContain('&lt; .001');
    expect(xml).toContain('Table 1');
    expect(xml).toContain('Table 2');
    expect(xml).toContain('Figure 1');
    expect(xml).toContain('<w:tbl>');
    expect(xml).toContain('w:vMerge');
    expect(xml).toContain('w:gridSpan');
    expect(xml).toContain('Women were slightly more likely');
    expect(xml).toContain('CROSSTABS');
    expect(Object.keys(files).some((f) => f.startsWith('word/media/'))).toBe(true);
    // No vertical borders on the table.
    expect(xml).not.toMatch(/<w:insideV w:val="single"/);
  });
  it('skips charts when no image is available and hides interpretations on request', async () => {
    const bytes = await buildDocx([sampleItem()], { ...opts, includeInterpretations: false, includeSyntax: false }, async () => null);
    const xml = strFromU8(unzipSync(bytes)['word/document.xml']);
    expect(xml).not.toContain('Figure 1');
    expect(xml).not.toContain('Women were slightly more likely');
    expect(xml).not.toContain('CROSSTABS');
  });
});

describe('HTML export', () => {
  it('builds a standalone document with APA tables', () => {
    const html = reportToHtmlDocument([sampleItem()], opts, () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<table');
    expect(html).toContain('Table 1');
    expect(html).toContain('Figure 1');
    expect(html).toContain('<i>Note.</i> Counts are weighted.');
    expect(html).toContain('What this means.');
    expect(html).toContain('@media print');
    expect(html).toContain('&lt; .001');
    expect(html).toContain('rowspan="2"');
    expect(html).toContain('colspan="2"');
  });
  it('uses SPSS formatting in SPSS style', () => {
    const t = sampleItem().blocks[2];
    if (t.kind !== 'table') throw new Error('fixture');
    const html = tableToHtml(t.table, { style: 'spss' });
    expect(html).toContain('&lt;.001');
    expect(html).not.toContain('Table ');
  });
  it('escapes user text', () => {
    const it0 = sampleItem();
    it0.title = '<script>alert(1)</script>';
    const html = itemToHtml(it0, opts, { table: 0, figure: 0 }, () => null);
    expect(html).not.toContain('<script>');
  });
});

describe('Text and Excel export', () => {
  it('renders aligned plain text', () => {
    const txt = reportToText([sampleItem()], opts);
    expect(txt).toContain('CROSSTABS: EDUCATION BY SEX');
    expect(txt).toContain('Pearson Chi-Square');
    expect(txt).toContain('14.20a');
    const t = sampleItem().blocks[1];
    if (t.kind !== 'table') throw new Error('fixture');
    const tt = tableToText(t.table);
    expect(tt).toContain('51.2%');
  });
  it('writes numbers as numbers and p < .001 as text', async () => {
    const t = sampleItem().blocks[2];
    if (t.kind !== 'table') throw new Error('fixture');
    const { data } = tableSheetData(t.table, 'apa');
    const flat = data.flat().filter(Boolean) as Array<{ value?: unknown }>;
    expect(flat.some((c) => c.value === '< .001')).toBe(true);
    expect(flat.some((c) => c.value === 1204)).toBe(true);
    const blob = await tablesToXlsx([t.table], 'apa');
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    expect(Object.keys(files)).toContain('xl/workbook.xml');
  });
});
