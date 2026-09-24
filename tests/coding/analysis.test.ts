import { describe, expect, it } from 'vitest';
import { codeByAttribute, codeFrequencies, constantAttributeKeys, cooccurrence, orderedAttributes } from '../../src/lib/coding/analysis';
import type { CodeDef, CodedSegment, TextDoc } from '../../src/core/coding-types';

const code = (id: string, parentId: string | null = null): CodeDef => ({ id, name: id.toUpperCase(), description: '', color: '#000', parentId, createdAt: 0 });
const doc = (id: string, gender?: string): TextDoc => ({ id, name: id, kind: 'response', text: 'x'.repeat(50), attributes: gender ? { gender } : {}, createdAt: 0 });
const seg = (docId: string, codeId: string, start = 0, end = 50): CodedSegment => ({ id: `${docId}-${codeId}-${start}`, docId, codeId, start, end, coder: 'A', origin: 'manual', createdAt: 0 });

const codes = [code('a'), code('b'), code('c', 'a')];
const docs = [doc('d1', 'Woman'), doc('d2', 'Man'), doc('d3', 'Woman'), doc('d4')];
const segments = [seg('d1', 'a', 0, 10), seg('d1', 'a', 20, 30), seg('d1', 'b', 5, 25), seg('d2', 'b'), seg('d3', 'c'), seg('d3', 'b', 0, 5)];

describe('code frequencies', () => {
  it('counts segments, documents and percentages, with sub-codes rolled up', () => {
    const f = codeFrequencies(codes, docs, segments);
    expect(f.nDocs).toBe(4);
    expect(f.nCodedDocs).toBe(3);
    const a = f.rows.find((r) => r.codeId === 'a')!;
    expect(a).toMatchObject({ segments: 2, docs: 1, pctDocs: 25, docsInclSub: 2, pctDocsInclSub: 50 });
    expect(f.rows.find((r) => r.codeId === 'b')).toMatchObject({ segments: 3, docs: 3, pctDocs: 75 });
  });
});

describe('co-occurrence', () => {
  it('document mode counts documents with both codes', () => {
    const m = cooccurrence(['a', 'b', 'c'], docs, segments, 'document');
    expect(m).toEqual([
      [1, 1, 0],
      [1, 3, 1],
      [0, 1, 1],
    ]);
  });
  it('overlap mode counts overlapping segment pairs', () => {
    const m = cooccurrence(['a', 'b', 'c'], docs, segments, 'overlap');
    // d1: b(5-25) overlaps a(0-10) and a(20-30); d3: b(0-5) overlaps c(0-50)
    expect(m[0][1]).toBe(2);
    expect(m[1][2]).toBe(1);
    expect(m[0][0]).toBe(2);
    expect(m[1][1]).toBe(3);
  });
});

describe('code by attribute', () => {
  it('counts documents per attribute value with column percentages', () => {
    const r = codeByAttribute(['a', 'b'], docs, segments, 'gender');
    expect(r.values).toEqual(['Man', 'Woman']);
    expect(r.bases).toEqual([1, 2]);
    expect(r.counts).toEqual([
      [0, 1],
      [1, 2],
    ]);
    expect(r.colPct[0]).toEqual([0, 50]);
    expect(r.nMissing).toBe(1);
  });
});

describe('themes rolled up with their sub-codes', () => {
  it('co-occurrence of top-level themes counts sub-code segments in their theme', () => {
    // Theme a has sub-code c; d3 is coded c and b, so theme a co-occurs with b in d1 and d3.
    const m = cooccurrence(['a', 'b'], docs, segments, 'document', { a: ['a', 'c'], b: ['b'] });
    expect(m).toEqual([
      [2, 2],
      [2, 3],
    ]);
    // Without roll-up, d3 does not count for a.
    expect(cooccurrence(['a', 'b'], docs, segments, 'document')).toEqual([
      [1, 1],
      [1, 3],
    ]);
  });
  it('codes by attribute: theme rows count sources with the theme or a sub-code, in value-label order', () => {
    const r = codeByAttribute(['a', 'c'], docs, segments, 'gender', ['Man', 'Woman'], { a: ['a', 'c'] });
    expect(r.values).toEqual(['Man', 'Woman']);
    expect(r.counts).toEqual([
      [0, 2],
      [0, 1],
    ]);
    // A source coded with both the theme and a sub-code counts once.
    const r2 = codeByAttribute(['a'], docs, [...segments, seg('d1', 'c')], 'gender', undefined, { a: ['a', 'c'] });
    expect(r2.counts[0]).toEqual([0, 2]);
  });
});

describe('informative attributes', () => {
  it('puts attributes shared by every source last', () => {
    const ds: TextDoc[] = [
      { id: '1', name: 'I1', kind: 'document', text: '', attributes: { study: 'Belonging study', age: '58', gender: 'Woman' }, createdAt: 0 },
      { id: '2', name: 'I2', kind: 'document', text: '', attributes: { study: 'Belonging study', age: '26', gender: 'Man' }, createdAt: 0 },
    ];
    const constant = constantAttributeKeys(ds);
    expect([...constant]).toEqual(['study']);
    expect(orderedAttributes(ds[0].attributes, constant).map(([k]) => k)).toEqual(['age', 'gender', 'study']);
    expect(constantAttributeKeys(ds.slice(0, 1)).size).toBe(0);
  });
});
