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
