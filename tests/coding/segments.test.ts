import { describe, expect, it } from 'vitest';
import { addSegmentMerged, assignLanes, buildRuns, rangesOverlap, splitLines, subtractRange, trimRange } from '../../src/lib/coding/segments';
import type { CodedSegment } from '../../src/core/coding-types';

const S = (id: string, start: number, end: number, codeId = 'c', coder = 'A'): CodedSegment => ({ id, docId: 'd', codeId, coder, start, end, origin: 'manual', createdAt: 0 });

describe('segment utilities', () => {
  it('overlap and trim', () => {
    expect(rangesOverlap({ start: 0, end: 5 }, { start: 5, end: 9 })).toBe(false);
    expect(rangesOverlap({ start: 0, end: 6 }, { start: 5, end: 9 })).toBe(true);
    expect(trimRange('  hello  ', 0, 9)).toEqual({ start: 2, end: 7 });
    expect(trimRange('   ', 0, 3)).toBeNull();
  });
  it('merges overlapping and touching segments of the same code and coder only', () => {
    let segs = [S('a', 0, 10), S('b', 20, 30), S('x', 5, 25, 'other'), S('y', 5, 25, 'c', 'B')];
    const r = addSegmentMerged(segs, S('n', 10, 21));
    const merged = r.segments.filter((s) => s.codeId === 'c' && s.coder === 'A');
    expect(merged).toHaveLength(1);
    expect([merged[0].start, merged[0].end]).toEqual([0, 30]);
    expect(r.segments).toHaveLength(3);
  });
  it('subtracts a range, splitting a segment', () => {
    let n = 0;
    const out = subtractRange([S('a', 0, 30), S('b', 0, 30, 'other')], 'd', 'c', 'A', 10, 20, () => `new${n++}`);
    const c = out.filter((s) => s.codeId === 'c').map((s) => [s.start, s.end]);
    expect(c).toEqual([[0, 10], [20, 30]]);
    expect(out.find((s) => s.codeId === 'other')!.end).toBe(30);
  });
  it('builds runs of constant coverage', () => {
    const runs = buildRuns(0, 20, [S('a', 2, 10), S('b', 5, 15)]);
    expect(runs.map((r) => [r.start, r.end, r.segIds.join('+')])).toEqual([
      [0, 2, ''],
      [2, 5, 'a'],
      [5, 10, 'a+b'],
      [10, 15, 'b'],
      [15, 20, ''],
    ]);
  });
  it('assigns gutter lanes to overlapping segments', () => {
    const { lanes, count } = assignLanes([S('a', 0, 10), S('b', 5, 15), S('c', 12, 20)]);
    expect(count).toBe(2);
    expect(lanes.get('a')).not.toBe(lanes.get('b'));
    expect(lanes.get('c')).toBe(lanes.get('a'));
  });
  it('splits lines keeping empty lines', () => {
    expect(splitLines('a\n\nbc\r\nd')).toEqual([{ start: 0, end: 1 }, { start: 2, end: 2 }, { start: 3, end: 5 }, { start: 7, end: 8 }]);
  });
});
