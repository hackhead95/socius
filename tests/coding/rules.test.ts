import { describe, expect, it } from 'vitest';
import { findRuleMatches, parseRule } from '../../src/lib/coding/rules';
import type { CodeDef, TextDoc } from '../../src/core/coding-types';

const code = (id: string, rules: string[]): CodeDef => ({ id, name: id, description: '', color: '#000', parentId: null, rules, createdAt: 0 });

describe('rule parsing', () => {
  it('reads regex with flags and plain words', () => {
    expect(parseRule('/jobs?/i')!.re!.test('JOB')).toBe(true);
    expect(parseRule('/jobs?/')!.re!.flags).toContain('g');
    expect(parseRule('# comment')).toBeNull();
    expect(parseRule('/(/')!.error).toMatch(/Invalid/);
    expect(parseRule('/a*/')!.error).toMatch(/empty/);
  });
  it('plain words are case-insensitive whole words with * wildcard', () => {
    const r = parseRule('work*')!.re!;
    expect('Working hard'.match(r)?.[0]).toBe('Working');
    r.lastIndex = 0;
    expect(r.test('homework')).toBe(false);
    const p = parseRule('public transport')!.re!;
    expect(p.test('Public   transport is bad')).toBe(true);
  });
});

describe('findRuleMatches', () => {
  const doc: TextDoc = { id: 'd1', name: 'I1', kind: 'document', text: 'Dr. Das found a job. The rent is high.\nI lost my job last year. Nothing else.', createdAt: 0 };
  const resp: TextDoc = { id: 'r1', name: 'R1', kind: 'response', text: '  Jobs are scarce  ', createdAt: 0 };
  const codes = [code('work', ['job*']), code('housing', ['/rent|housing/i'])];
  it('sentence scope codes each matching sentence', () => {
    const m = findRuleMatches([doc], codes, 'sentence', [], 'C1');
    const texts = m.map((x) => `${x.codeId}:${doc.text.slice(x.start, x.end)}`);
    expect(texts).toEqual(['work:Dr. Das found a job.', 'work:I lost my job last year.', 'housing:The rent is high.']);
  });
  it('paragraph scope', () => {
    const m = findRuleMatches([doc], codes, 'paragraph', [], 'C1').filter((x) => x.codeId === 'work');
    expect(m.map((x) => doc.text.slice(x.start, x.end))).toEqual(['Dr. Das found a job. The rent is high.', 'I lost my job last year. Nothing else.']);
  });
  it('whole-response scope spans 0..length for responses', () => {
    const m = findRuleMatches([resp], codes, 'text', [], 'C1');
    expect(m).toHaveLength(1);
    expect([m[0].start, m[0].end]).toEqual([0, resp.text.length]);
    expect(m[0].hits[0]).toEqual({ start: 2, end: 6 });
  });
  it('flags units already coded by the same coder', () => {
    const existing = [{ id: 's', docId: 'r1', codeId: 'work', start: 0, end: resp.text.length, coder: 'C1', origin: 'manual' as const, createdAt: 0 }];
    expect(findRuleMatches([resp], codes, 'text', existing, 'C1')[0].alreadyCoded).toBe(true);
    expect(findRuleMatches([resp], codes, 'text', existing, 'C2')[0].alreadyCoded).toBe(false);
  });
});
