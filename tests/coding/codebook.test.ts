import { describe, expect, it } from 'vitest';
import type { CodeDef } from '../../src/core/coding-types';
import { codebookToCsv, codebookToJson, mergeCodebook, parseCodebookCsv, parseCodebookJson } from '../../src/lib/coding/codebookIO';
import { buildCodeTree, canReparent, codePath, descendantIds, orderedCodes } from '../../src/lib/coding/tree';
import { buildSuggestBatches, byteLength, parseCodeSuggestions, parseCodebookSuggestions, PROMPT_BUDGET_BYTES } from '../../src/lib/coding/ai';

const codes: CodeDef[] = [
  { id: 'a', name: 'Livelihood', description: 'Making a living', color: '#e9b200', parentId: null, createdAt: 0 },
  { id: 'b', name: 'Informal work', description: 'Cash, "no contract"', color: '#2f9be0', parentId: 'a', rules: ['cash', '/no contract/i'], createdAt: 0 },
  { id: 'c', name: 'Belonging', description: '', color: '#e0566a', parentId: null, createdAt: 0 },
  { id: 'd', name: 'Street vending', description: '', color: '#3eaa6d', parentId: 'b', createdAt: 0 },
];

describe('code tree', () => {
  it('orders depth-first and computes paths and descendants', () => {
    expect(orderedCodes(codes).map((c) => c.id)).toEqual(['a', 'b', 'd', 'c']);
    expect(codePath(codes, 'd')).toBe('Livelihood > Informal work > Street vending');
    expect(descendantIds(codes, 'a').sort()).toEqual(['b', 'd']);
    expect(canReparent(codes, 'a', 'd')).toBe(false);
    expect(canReparent(codes, 'c', 'd')).toBe(true);
  });
  it('survives parent cycles', () => {
    const cyc = [{ ...codes[0], parentId: 'b' }, codes[1]];
    expect(buildCodeTree(cyc).length).toBeGreaterThan(0);
  });
});

describe('codebook import/export', () => {
  it('CSV round trip keeps hierarchy and rules', () => {
    const parsed = parseCodebookCsv(codebookToCsv(codes));
    expect(parsed.map((p) => [p.name, p.parent ?? null])).toEqual([
      ['Livelihood', null],
      ['Informal work', 'Livelihood'],
      ['Street vending', 'Informal work'],
      ['Belonging', null],
    ]);
    expect(parsed[1].rules).toEqual(['cash', '/no contract/i']);
    const { codes: merged, added } = mergeCodebook([], parsed);
    expect(added).toBe(4);
    const inf = merged.find((c) => c.name === 'Informal work')!;
    expect(merged.find((c) => c.id === inf.parentId)!.name).toBe('Livelihood');
  });
  it('JSON round trip and merge updates only empty fields', () => {
    const parsed = parseCodebookJson(codebookToJson(codes));
    expect(parsed).toHaveLength(4);
    const existing: CodeDef[] = [{ ...codes[2], description: '' }, { ...codes[0], description: 'Keep mine' }];
    const r = mergeCodebook(existing, [{ name: 'belonging', description: 'Feeling at home' }, { name: 'Livelihood', description: 'Other' }, { name: 'New code', parent: 'Belonging' }]);
    expect(r.added).toBe(1);
    expect(r.codes.find((c) => c.name === 'Belonging')!.description).toBe('Feeling at home');
    expect(r.codes.find((c) => c.name === 'Livelihood')!.description).toBe('Keep mine');
    expect(r.codes.find((c) => c.name === 'New code')!.parentId).toBe(codes[2].id);
  });
  it('rejects bad input clearly', () => {
    expect(() => parseCodebookJson('{')).toThrow(/valid JSON/);
    expect(() => parseCodebookCsv('foo,bar\n1,2')).toThrow(/name/);
  });
});

describe('AI prompt helpers', () => {
  it('batches stay under the byte budget', () => {
    const items = Array.from({ length: 300 }, (_, i) => ({ id: `r${i}`, text: 'অনেক কথা '.repeat(200) }));
    const batches = buildSuggestBatches(codes, items);
    expect(batches.length).toBeGreaterThan(1);
    for (const b of batches) expect(byteLength(b.prompt)).toBeLessThanOrEqual(PROMPT_BUDGET_BYTES);
    expect(batches.flatMap((b) => b.ids)).toHaveLength(300);
  });
  it('validates suggestions against ids and codebook names', () => {
    const m = parseCodeSuggestions([{ id: 'r1', codes: ['informal WORK', 'Invented'] }, { id: 'zz', codes: ['Belonging'] }, 'junk'], ['r1', 'r2'], codes);
    expect([...m.entries()]).toEqual([['r1', ['b']]]);
  });
  it('parses codebook suggestions defensively', () => {
    const s = parseCodebookSuggestions({ codes: [{ name: 'Trust', description: 'd', examples: ['q', 3], parent: 'Trust' }, { name: 'trust' }, { foo: 1 }] });
    expect(s).toEqual([{ name: 'Trust', description: 'd', inclusion: '', exclusion: '', examples: ['q'], parent: null }]);
  });
});
