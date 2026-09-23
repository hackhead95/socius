import { describe, expect, it } from 'vitest';
import { strToU8, zipSync, unzipSync, strFromU8 } from 'fflate';
import { decodeText, extractDocxText, normaliseText, parseCsv, toCsv } from '../../src/lib/coding/importers';
import { reportData, reportHtml, segmentTable } from '../../src/lib/coding/exports';
import { codebookDocx, reportDocx } from '../../src/lib/coding/docxExports';
import type { CodingProject } from '../../src/core/coding-types';

function tinyDocx(bodyXml: string): Uint8Array {
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml}<w:sectPr/></w:body></w:document>`;
  return zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'),
    'word/document.xml': strToU8(doc),
  });
}

describe('docx extraction', () => {
  it('keeps paragraphs, runs, tabs, breaks and entities', () => {
    const bytes = tinyDocx(
      '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Interview 3</w:t></w:r></w:p>' +
        '<w:p><w:r><w:t xml:space="preserve">Q: How did you </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>find</w:t></w:r><w:r><w:t xml:space="preserve"> work &amp; housing?</w:t></w:r></w:p>' +
        '<w:p/><w:p/>' +
        '<w:p><w:r><w:t>A:</w:t></w:r><w:r><w:tab/><w:t>Through my cousin.</w:t><w:br/><w:t>আমি খুশি।</w:t></w:r><w:del><w:r><w:delText>removed</w:delText></w:r></w:del></w:p>',
    );
    expect(extractDocxText(bytes)).toBe('Interview 3\nQ: How did you find work & housing?\n\nA:\tThrough my cousin.\nআমি খুশি।');
  });
  it('rejects non-docx input', () => {
    expect(() => extractDocxText(strToU8('hello'))).toThrow(/not a valid/);
    expect(() => extractDocxText(zipSync({ 'a.txt': strToU8('x') }))).toThrow(/no main document/);
  });
});

describe('text & CSV', () => {
  it('normalises text', () => {
    expect(normaliseText('﻿a  \r\nb\r\n\r\n\r\n\r\nc  ')).toBe('a\nb\n\nc');
  });
  it('decodes windows-1252 fallback', () => {
    expect(decodeText(new Uint8Array([0x63, 0x61, 0x66, 0xe9]))).toBe('café');
    expect(decodeText(strToU8('কলকাতা'))).toBe('কলকাতা');
  });
  it('parses quoted CSV with embedded newlines and detects semicolons', () => {
    expect(parseCsv('id,answer\n1,"Too ""expensive""\nreally"\n2,ok\n')).toEqual([['id', 'answer'], ['1', 'Too "expensive"\nreally'], ['2', 'ok']]);
    expect(parseCsv('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('round-trips CSV output', () => {
    const csv = toCsv([['a', 'b'], ['x, y', 'say "hi"\nnow']], false);
    expect(parseCsv(csv)).toEqual([['a', 'b'], ['x, y', 'say "hi"\nnow']]);
  });
});

const project: CodingProject = {
  codes: [
    { id: 'k1', name: 'Work', description: 'Talk about jobs.', inclusion: 'Paid work', exclusion: 'Housework', example: 'I found a job', color: '#e9b200', parentId: null, createdAt: 0 },
    { id: 'k2', name: 'Informal work', description: 'Cash jobs', color: '#2f9be0', parentId: 'k1', createdAt: 0 },
  ],
  docs: [{ id: 'd1', name: 'Interview 1', kind: 'document', text: 'I found a job in a small factory near the station.', attributes: { gender: 'Woman' }, createdAt: 0 }],
  segments: [{ id: 's1', docId: 'd1', codeId: 'k2', start: 2, end: 13, coder: 'Coder 1', origin: 'manual', memo: 'first job', createdAt: 0 }],
  memos: [],
  coders: ['Coder 1'],
  activeCoder: 'Coder 1',
};

describe('exports', () => {
  it('segment table includes attributes, parent code, text and memo', () => {
    const t = segmentTable(project);
    expect(t.header).toEqual(['Document', 'Type', 'gender', 'Code', 'Parent code', 'Code path', 'Text', 'Start', 'End', 'Coder', 'Origin', 'Memo']);
    expect(t.rows[0]).toEqual(['Interview 1', 'Document', 'Woman', 'Informal work', 'Work', 'Work > Informal work', 'found a job', 2, 13, 'Coder 1', 'Manual', 'first job']);
  });
  it('codebook DOCX is a valid Word file with the codes in a table', async () => {
    const bytes = await codebookDocx(project, { includeCounts: true });
    const xml = strFromU8(unzipSync(bytes)['word/document.xml']);
    expect(xml).toContain('<w:tbl>');
    expect(xml).toContain('Informal work');
    expect(xml).toContain('Housework');
    // Round trip through our own extractor.
    expect(extractDocxText(bytes)).toContain('Talk about jobs.');
  });
  it('report HTML and DOCX contain definitions and quotes', async () => {
    const data = reportData(project);
    const html = reportHtml(data);
    expect(html).toContain('Work &gt; Informal work');
    expect(html).toContain('found a job');
    const text = extractDocxText(await reportDocx(data));
    expect(text).toContain('Include when: Paid work');
    expect(text).toContain('"found a job"');
  });
});
