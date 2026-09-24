import { describe, expect, it } from 'vitest';
import type { CodeDef, CodedSegment, TextDoc } from '../../src/core/coding-types';
import { codeByAttribute, codeFrequencies, cooccurrence } from '../../src/lib/coding/analysis';
import { compareCoders } from '../../src/lib/coding/reliability';
import { codeByAttributeOutput, cooccurrenceOutput, frequenciesOutput, kwicOutput, reliabilityOutput, wordFrequencyOutput } from '../../src/lib/coding/outputs';
import { kwic, wordFrequencies } from '../../src/lib/coding/text';

const codes: CodeDef[] = ['Work', 'Family'].map((n, i) => ({ id: `k${i}`, name: n, description: '', color: '#000', parentId: null, createdAt: 0 }));
const docs: TextDoc[] = Array.from({ length: 6 }, (_, i) => ({ id: `d${i}`, name: `R${i}`, kind: 'response', text: i % 2 ? 'work and family' : 'family only', attributes: { gender: i % 2 ? 'Man' : 'Woman' }, createdAt: 0 }));
const seg = (d: number, k: number, coder = 'A'): CodedSegment => ({ id: `${d}${k}${coder}`, docId: `d${d}`, codeId: `k${k}`, start: 0, end: docs[d].text.length, coder, origin: 'manual', createdAt: 0 });
const segments = [seg(1, 0), seg(3, 0), seg(5, 0), seg(0, 1), seg(1, 1), seg(2, 1), seg(1, 0, 'B'), seg(3, 0, 'B'), seg(0, 1, 'B')];

function isPlainJson(x: unknown) {
  expect(JSON.parse(JSON.stringify(x))).toEqual(x);
}

describe('output items', () => {
  it('frequencies, co-occurrence, attribute, words, KWIC and reliability items are well formed', () => {
    const a = segments.filter((s) => s.coder === 'A');
    const f = codeFrequencies(codes, docs, a);
    const items = [
      frequenciesOutput(codes, f.rows, f.nDocs, f.nCodedDocs, { unitLabel: 'responses', depthOf: () => 0, scopeNote: '6 responses' }),
      cooccurrenceOutput(codes, cooccurrence(['k0', 'k1'], docs, a, 'document'), 'document', '6 responses'),
      codeByAttributeOutput(codes, 'gender', codeByAttribute(['k0', 'k1'], docs, a, 'gender'), 'responses'),
      wordFrequencyOutput(wordFrequencies(docs.map((d) => d.text)), null, 6, 'all'),
      kwicOutput('work', kwic(docs.map((d) => d.text), 'work').map((l) => ({ ...l, source: docs[l.docIndex].name }))),
      reliabilityOutput(codes, compareCoders(docs, segments, 'A', 'B', ['k0', 'k1'])),
    ];
    for (const it of items) {
      expect(it.procedure).toBe('coding');
      expect(it.blocks.length).toBeGreaterThan(0);
      isPlainJson(it);
      for (const b of it.blocks) if (b.kind === 'table') for (const r of b.table.rows) expect(r.length).toBeGreaterThan(0);
    }
    const freqText = items[0].blocks.find((b) => b.kind === 'text' && b.style === 'interpretation') as any;
    expect(freqText.text).toContain('"Work" (3 of 6 responses, 50.0%)');
    const attrText = items[2].blocks.find((b) => b.kind === 'text' && b.style === 'interpretation') as any;
    expect(attrText.text).toContain('"Work" was mentioned more often in the Man group (100.0%) than in the Woman group (0.0%)');
    const rel = items[5].blocks.find((b) => b.kind === 'text' && b.style === 'interpretation') as any;
    expect(rel.text).toMatch(/A and B were compared on 3 sources/);
  });
});

describe('UI-019: code frequencies of themes', () => {
  const tree: CodeDef[] = [
    { id: 't', name: 'Infrastructure', description: '', color: '#000', parentId: null, createdAt: 0 },
    { id: 'w', name: 'Water', description: '', color: '#111', parentId: 't', createdAt: 1 },
    { id: 'r', name: 'Roads', description: '', color: '#222', parentId: 't', createdAt: 2 },
    { id: 'x', name: 'Safety', description: '', color: '#333', parentId: null, createdAt: 3 },
  ];
  const s = (d: number, k: string): CodedSegment => ({ id: `${d}${k}`, docId: `d${d}`, codeId: k, start: 0, end: 1, coder: 'A', origin: 'manual', createdAt: 0 });
  const segs = [s(0, 'w'), s(1, 'w'), s(1, 'r'), s(2, 'r'), s(3, 't'), s(4, 'x')];

  it('counts segments and sources of a theme with its sub-codes', () => {
    const f = codeFrequencies(tree, docs, segs);
    const t = f.rows.find((r) => r.codeId === 't')!;
    expect(t).toMatchObject({ hasChildren: true, segments: 1, docs: 1, segmentsInclSub: 5, docsInclSub: 4 });
    expect(f.rows.find((r) => r.codeId === 'w')).toMatchObject({ hasChildren: false, segmentsInclSub: 2, docsInclSub: 2 });
  });

  it('shows the theme total in the main columns, marked and explained, instead of its own 0 / 0.0%', () => {
    const f = codeFrequencies(tree, docs, segs);
    const it = frequenciesOutput(tree, f.rows, f.nDocs, f.nCodedDocs, { unitLabel: 'responses', depthOf: (id) => (tree.find((c) => c.id === id)!.parentId ? 1 : 0), scopeNote: '6 responses' });
    const table = it.blocks.find((b) => b.kind === 'table')!;
    if (table.kind !== 'table') throw new Error('no table');
    expect(table.table.header[0].map((c) => c.v)).toEqual(['Code', 'Segments', 'Responses', '% of responses']);
    const theme = table.table.rows[0];
    expect(theme[0]).toMatchObject({ v: 'Infrastructure', bold: true, mark: 'a' });
    expect(theme.slice(1).map((c) => c.v)).toEqual([5, 4, (100 * 4) / 6]);
    expect(table.table.rows[3][0]).toMatchObject({ v: 'Safety' });
    expect(table.table.rows[3][0].mark).toBeUndefined();
    const notes = table.table.footnotes!.join(' ');
    expect(notes).toMatch(/^.*a\. Theme: the total of the theme and all its sub-codes/);
    expect(notes).toContain('Infrastructure: coded with the theme itself in 1 response (16.7%), included in its total.');
  });
});
