// Segment utilities: overlap tests, merging, subtracting ranges, paragraph runs for rendering.

import type { CodedSegment } from '../../core/coding-types';

export interface Range {
  start: number;
  end: number;
}

/** True if [a.start, a.end) and [b.start, b.end) share at least one character. */
export function rangesOverlap(a: Range, b: Range): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Shrink a range so it does not start or end on whitespace. Returns null if nothing is left. */
export function trimRange(text: string, start: number, end: number): Range | null {
  let s = Math.max(0, Math.min(start, end));
  let e = Math.min(text.length, Math.max(start, end));
  while (s < e && /\s/.test(text[s])) s++;
  while (e > s && /\s/.test(text[e - 1])) e--;
  return e > s ? { start: s, end: e } : null;
}

/**
 * Add a segment, merging it with any segment of the same document, code and coder that overlaps or
 * touches it (so coding the same passage twice never double counts). Memos are concatenated.
 * Returns the new array and the resulting (possibly merged) segment.
 */
export function addSegmentMerged(segments: CodedSegment[], seg: CodedSegment): { segments: CodedSegment[]; segment: CodedSegment } {
  let merged = { ...seg };
  const keep: CodedSegment[] = [];
  const memos: string[] = [];
  for (const s of segments) {
    if (s.docId === seg.docId && s.codeId === seg.codeId && s.coder === seg.coder && s.start <= merged.end && merged.start <= s.end) {
      merged = { ...merged, start: Math.min(merged.start, s.start), end: Math.max(merged.end, s.end), id: s.id, createdAt: Math.min(s.createdAt, merged.createdAt), origin: s.origin === 'manual' ? 'manual' : merged.origin };
      if (s.memo) memos.push(s.memo);
    } else keep.push(s);
  }
  if (seg.memo) memos.push(seg.memo);
  if (memos.length) merged.memo = [...new Set(memos)].join('\n');
  keep.push(merged);
  return { segments: keep, segment: merged };
}

/**
 * Remove [start, end) of `codeId` (by `coder`, or any coder when coder is null) from a document.
 * Segments partly inside are trimmed or split in two.
 */
export function subtractRange(
  segments: CodedSegment[],
  docId: string,
  codeId: string,
  coder: string | null,
  start: number,
  end: number,
  makeId: () => string,
): CodedSegment[] {
  const out: CodedSegment[] = [];
  for (const s of segments) {
    if (s.docId !== docId || s.codeId !== codeId || (coder !== null && s.coder !== coder) || !(s.start < end && start < s.end)) {
      out.push(s);
      continue;
    }
    if (s.start < start) out.push({ ...s, end: start });
    if (s.end > end) out.push({ ...s, id: s.start < start ? makeId() : s.id, start: end });
  }
  return out;
}

/** Segments grouped by document id (each list sorted by start). */
export function indexByDoc(segments: CodedSegment[]): Map<string, CodedSegment[]> {
  const m = new Map<string, CodedSegment[]>();
  for (const s of segments) {
    const a = m.get(s.docId);
    if (a) a.push(s);
    else m.set(s.docId, [s]);
  }
  for (const a of m.values()) a.sort((x, y) => x.start - y.start || y.end - x.end);
  return m;
}

/** Paragraph ranges: text split at line breaks. Empty lines give empty ranges (kept for spacing). */
export function splitLines(text: string): Range[] {
  const out: Range[] = [];
  let s = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === '\n') {
      let e = i;
      if (e > s && text[e - 1] === '\r') e--;
      out.push({ start: s, end: e });
      s = i + 1;
    }
  }
  return out;
}

export interface Run extends Range {
  /** Ids of segments covering this run, in the order given. */
  segIds: string[];
}

/** Split [start, end) into runs where the set of covering segments is constant. */
export function buildRuns(start: number, end: number, segs: Array<Pick<CodedSegment, 'id' | 'start' | 'end'>>): Run[] {
  const cuts = new Set<number>([start, end]);
  for (const s of segs) {
    if (s.start > start && s.start < end) cuts.add(s.start);
    if (s.end > start && s.end < end) cuts.add(s.end);
  }
  const pts = [...cuts].sort((a, b) => a - b);
  const runs: Run[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (b <= a) continue;
    runs.push({ start: a, end: b, segIds: segs.filter((s) => s.start < b && a < s.end).map((s) => s.id) });
  }
  if (!runs.length) runs.push({ start, end, segIds: [] });
  return runs;
}

/** Greedy lane assignment so overlapping segments get different gutter lanes. Returns lane per id. */
export function assignLanes(segs: Array<Pick<CodedSegment, 'id' | 'start' | 'end'>>): { lanes: Map<string, number>; count: number } {
  const sorted = [...segs].sort((a, b) => a.start - b.start || b.end - a.end);
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();
  for (const s of sorted) {
    let lane = laneEnds.findIndex((e) => e <= s.start);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(s.end);
    } else laneEnds[lane] = s.end;
    lanes.set(s.id, lane);
  }
  return { lanes, count: laneEnds.length };
}

