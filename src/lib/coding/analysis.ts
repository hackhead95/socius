// Code frequencies, co-occurrence and code-by-attribute counts. Pure functions over explicit
// lists of codes, documents and segments (callers filter by coder / document kind first).

import type { CodeDef, CodedSegment, TextDoc } from '../../core/coding-types';
import { descendantIds } from './tree';

export interface CodeFrequency {
  codeId: string;
  /** Number of coded segments. */
  segments: number;
  /** Documents / responses with at least one segment of this code. */
  docs: number;
  /** Percentage of the documents in scope. */
  pctDocs: number;
  /** Documents coded with this code or any of its sub-codes (equals `docs` for codes without children). */
  docsInclSub: number;
  pctDocsInclSub: number;
  /** Total coded characters (a rough measure of coverage). */
  chars: number;
}

export function codeFrequencies(codes: CodeDef[], docs: TextDoc[], segments: CodedSegment[]): { rows: CodeFrequency[]; nDocs: number; nCodedDocs: number } {
  const docIds = new Set(docs.map((d) => d.id));
  const segs = segments.filter((s) => docIds.has(s.docId));
  const docsByCode = new Map<string, Set<string>>();
  const segCount = new Map<string, number>();
  const chars = new Map<string, number>();
  for (const s of segs) {
    segCount.set(s.codeId, (segCount.get(s.codeId) ?? 0) + 1);
    chars.set(s.codeId, (chars.get(s.codeId) ?? 0) + (s.end - s.start));
    const set = docsByCode.get(s.codeId) ?? new Set<string>();
    set.add(s.docId);
    docsByCode.set(s.codeId, set);
  }
  const n = docs.length;
  const pct = (k: number) => (n ? (100 * k) / n : 0);
  const rows = codes.map((c) => {
    const own = docsByCode.get(c.id) ?? new Set<string>();
    const all = new Set(own);
    for (const d of descendantIds(codes, c.id)) for (const x of docsByCode.get(d) ?? []) all.add(x);
    return {
      codeId: c.id,
      segments: segCount.get(c.id) ?? 0,
      docs: own.size,
      pctDocs: pct(own.size),
      docsInclSub: all.size,
      pctDocsInclSub: pct(all.size),
      chars: chars.get(c.id) ?? 0,
    };
  });
  const coded = new Set(segs.map((s) => s.docId));
  return { rows, nDocs: n, nCodedDocs: coded.size };
}

export type CooccurrenceMode = 'document' | 'overlap';

/**
 * Code co-occurrence matrix.
 * - 'document': cell (i, j) = number of documents coded with both codes; diagonal = documents with code i.
 * - 'overlap': cell (i, j) = number of pairs of overlapping segments (code i with code j) in the same
 *   document; diagonal = number of segments of code i.
 */
export function cooccurrence(codeIds: string[], docs: TextDoc[], segments: CodedSegment[], mode: CooccurrenceMode): number[][] {
  const idx = new Map(codeIds.map((id, i) => [id, i]));
  const k = codeIds.length;
  const m = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  const docIds = new Set(docs.map((d) => d.id));
  const byDoc = new Map<string, CodedSegment[]>();
  for (const s of segments) {
    if (!docIds.has(s.docId) || !idx.has(s.codeId)) continue;
    const arr = byDoc.get(s.docId);
    if (arr) arr.push(s);
    else byDoc.set(s.docId, [s]);
  }
  for (const segs of byDoc.values()) {
    if (mode === 'document') {
      const present = [...new Set(segs.map((s) => idx.get(s.codeId)!))];
      for (const a of present) for (const b of present) m[a][b]++;
    } else {
      for (const s of segs) m[idx.get(s.codeId)!][idx.get(s.codeId)!]++;
      const sorted = [...segs].sort((a, b) => a.start - b.start);
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length && sorted[j].start < sorted[i].end; j++) {
          const a = idx.get(sorted[i].codeId)!, b = idx.get(sorted[j].codeId)!;
          if (a === b) continue;
          m[a][b]++;
          m[b][a]++;
        }
      }
    }
  }
  return m;
}

export interface CodeByAttribute {
  /** Attribute values (columns), sorted. */
  values: string[];
  /** Documents per attribute value (column bases). */
  bases: number[];
  /** counts[codeIndex][valueIndex] = documents with that value coded with the code. */
  counts: number[][];
  /** Column percentages (count / base * 100). */
  colPct: number[][];
  /** Documents without a value for the attribute (excluded). */
  nMissing: number;
}

/** Codes by a document attribute (e.g. gender): documents coded, with column percentages. */
export function codeByAttribute(codeIds: string[], docs: TextDoc[], segments: CodedSegment[], attribute: string, valueOrder?: string[]): CodeByAttribute {
  const valueOf = (d: TextDoc) => (d.attributes?.[attribute] ?? '').trim();
  const inScope = docs.filter((d) => valueOf(d) !== '');
  const nMissing = docs.length - inScope.length;
  const distinct = [...new Set(inScope.map(valueOf))];
  const values = valueOrder ? [...valueOrder.filter((v) => distinct.includes(v)), ...distinct.filter((v) => !valueOrder.includes(v)).sort(naturalCompare)] : distinct.sort(naturalCompare);
  const vIdx = new Map(values.map((v, i) => [v, i]));
  const bases = new Array<number>(values.length).fill(0);
  const docVal = new Map<string, number>();
  for (const d of inScope) {
    const vi = vIdx.get(valueOf(d))!;
    bases[vi]++;
    docVal.set(d.id, vi);
  }
  const cIdx = new Map(codeIds.map((id, i) => [id, i]));
  const counts = codeIds.map(() => new Array<number>(values.length).fill(0));
  const seen = new Set<string>();
  for (const s of segments) {
    const vi = docVal.get(s.docId);
    const ci = cIdx.get(s.codeId);
    if (vi === undefined || ci === undefined) continue;
    const key = `${s.docId}\u0000${s.codeId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts[ci][vi]++;
  }
  const colPct = counts.map((row) => row.map((c, j) => (bases[j] ? (100 * c) / bases[j] : 0)));
  return { values, bases, counts, colPct, nMissing };
}

/** Attribute names present on any document, sorted. */
export function attributeKeys(docs: TextDoc[]): string[] {
  const s = new Set<string>();
  for (const d of docs) for (const k of Object.keys(d.attributes ?? {})) s.add(k);
  return [...s].sort((a, b) => a.localeCompare(b));
}

/** Distinct values of an attribute, sorted naturally. */
export function attributeValues(docs: TextDoc[], key: string): string[] {
  const s = new Set<string>();
  for (const d of docs) {
    const v = d.attributes?.[key]?.trim();
    if (v) s.add(v);
  }
  return [...s].sort(naturalCompare);
}

export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
