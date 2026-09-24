// Intercoder reliability: Cohen's kappa, percent agreement and Krippendorff's alpha (nominal).
//
// Units of analysis:
// - Survey responses (kind 'response'): one unit per response. A response counts as coded with a
//   code by a coder when that coder has any segment of the code in it.
// - Documents: one unit per sentence (see splitSentences). A sentence counts as coded with a code
//   by a coder when one of that coder's segments of the code overlaps any character of it.
// By default only documents that both coders have coded (at least one segment each) are compared;
// documents coded by only one of them are reported in `oneSided` so the UI can say so, and with
// `{ units: 'either' }` they are compared too (the other coder's silence counts as "not applied").
// For each code, each unit gives a pair of binary ratings (applied / not applied).

import type { CodedSegment, TextDoc } from '../../core/coding-types';
import { splitSentences } from './text';
import type { Range } from './segments';

/** Cohen's kappa for two raters over the same units (any nominal categories). NaN when undefined. */
export function cohenKappa(a: Array<number | string>, b: Array<number | string>): number {
  if (a.length !== b.length) throw new Error('Rating lists must have the same length.');
  const n = a.length;
  if (!n) return NaN;
  const cats = [...new Set([...a, ...b])];
  const ia = new Map<number | string, number>(), ib = new Map<number | string, number>();
  let agree = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    ia.set(a[i], (ia.get(a[i]) ?? 0) + 1);
    ib.set(b[i], (ib.get(b[i]) ?? 0) + 1);
  }
  const po = agree / n;
  let pe = 0;
  for (const c of cats) pe += ((ia.get(c) ?? 0) / n) * ((ib.get(c) ?? 0) / n);
  if (Math.abs(1 - pe) < 1e-12) return NaN;
  return (po - pe) / (1 - pe);
}

export function percentAgreement(a: Array<number | string>, b: Array<number | string>): number {
  if (!a.length) return NaN;
  let k = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) k++;
  return (100 * k) / a.length;
}

/**
 * Krippendorff's alpha for nominal data. `data[coder][unit]`, null = missing. Units with fewer
 * than two ratings are not pairable and are ignored. NaN when there is no variation at all.
 */
export function krippendorffAlphaNominal(data: Array<Array<number | string | null>>): number {
  const nUnits = Math.max(0, ...data.map((r) => r.length));
  const o = new Map<string, number>(); // key "c\u0000k"
  for (let u = 0; u < nUnits; u++) {
    const vals: string[] = [];
    for (const row of data) {
      const v = row[u];
      if (v !== null && v !== undefined && !(typeof v === 'number' && Number.isNaN(v))) vals.push(String(v));
    }
    const m = vals.length;
    if (m < 2) continue;
    for (let i = 0; i < m; i++)
      for (let j = 0; j < m; j++) {
        if (i === j) continue;
        const key = `${vals[i]}\u0000${vals[j]}`;
        o.set(key, (o.get(key) ?? 0) + 1 / (m - 1));
      }
  }
  const nc = new Map<string, number>();
  let n = 0;
  let disagreeObs = 0;
  for (const [key, w] of o) {
    const [c, k] = key.split('\u0000');
    nc.set(c, (nc.get(c) ?? 0) + w);
    n += w;
    if (c !== k) disagreeObs += w;
  }
  if (n <= 1) return NaN;
  let sumSq = 0;
  for (const v of nc.values()) sumSq += v * v;
  const disagreeExp = (n * n - sumSq) / (n - 1);
  if (disagreeExp === 0) return NaN;
  return 1 - disagreeObs / disagreeExp;
}

/** Landis & Koch (1977) verbal bands for kappa (a rule of thumb, not a test). */
export function landisKoch(k: number): string {
  if (!Number.isFinite(k)) return 'not computable';
  if (k < 0) return 'poor (less than chance)';
  if (k <= 0.2) return 'slight';
  if (k <= 0.4) return 'fair';
  if (k <= 0.6) return 'moderate';
  if (k <= 0.8) return 'substantial';
  return 'almost perfect';
}

export interface ReliabilityUnit {
  docId: string;
  start: number;
  end: number;
}

export interface CodeAgreement {
  codeId: string;
  kappa: number;
  alpha: number;
  agreement: number;
  both: number;
  onlyA: number;
  onlyB: number;
  neither: number;
}

export interface Disagreement {
  unit: ReliabilityUnit;
  codeId: string;
  /** The coder who applied the code (the other did not). */
  appliedBy: 'A' | 'B';
}

export interface ReliabilityResult {
  coderA: string;
  coderB: string;
  docIds: string[];
  nResponseUnits: number;
  nSentenceUnits: number;
  units: ReliabilityUnit[];
  perCode: CodeAgreement[];
  /** Krippendorff's alpha over all unit x code decisions pooled. */
  pooledAlpha: number;
  /** Percent agreement over all unit x code decisions pooled. */
  pooledAgreement: number;
  /** Mean of the defined per-code kappas. */
  meanKappa: number;
  disagreements: Disagreement[];
  /** Documents only one coder has coded: left out with units 'both', included with 'either'. */
  oneSided: { a: string[]; b: string[] };
  /** Which sources were compared. */
  scope: 'both' | 'either';
}

export interface CompareOptions {
  /** 'both' (default): sources both coders coded. 'either': sources at least one of them coded. */
  units?: 'both' | 'either';
}

function overlaps(s: CodedSegment, u: Range): boolean {
  return s.start < u.end && u.start < s.end;
}

/** Compare two coders over the documents both have coded. `codeIds` = codes to compare. */
export function compareCoders(docs: TextDoc[], segments: CodedSegment[], coderA: string, coderB: string, codeIds: string[], opts: CompareOptions = {}): ReliabilityResult {
  const either = opts.units === 'either';
  const byDoc = new Map<string, { a: CodedSegment[]; b: CodedSegment[] }>();
  for (const s of segments) {
    if (s.coder !== coderA && s.coder !== coderB) continue;
    const e = byDoc.get(s.docId) ?? { a: [], b: [] };
    if (s.coder === coderA) e.a.push(s);
    else e.b.push(s);
    byDoc.set(s.docId, e);
  }
  const units: ReliabilityUnit[] = [];
  const unitSegs: Array<{ a: CodedSegment[]; b: CodedSegment[] }> = [];
  const docIds: string[] = [];
  let nResp = 0, nSent = 0;
  const oneSided = { a: [] as string[], b: [] as string[] };
  for (const d of docs) {
    const e = byDoc.get(d.id);
    if (!e || (!e.a.length && !e.b.length)) continue;
    if (!e.a.length || !e.b.length) {
      (e.a.length ? oneSided.a : oneSided.b).push(d.id);
      if (!either) continue;
    }
    docIds.push(d.id);
    const us: Range[] = d.kind === 'response' ? [{ start: 0, end: d.text.length }] : splitSentences(d.text);
    for (const u of us) {
      units.push({ docId: d.id, start: u.start, end: u.end });
      unitSegs.push({ a: e.a.filter((s) => overlaps(s, u)), b: e.b.filter((s) => overlaps(s, u)) });
      if (d.kind === 'response') nResp++;
      else nSent++;
    }
  }
  const perCode: CodeAgreement[] = [];
  const disagreements: Disagreement[] = [];
  const pooledA: number[] = [], pooledB: number[] = [];
  for (const codeId of codeIds) {
    const ra: number[] = [], rb: number[] = [];
    let both = 0, onlyA = 0, onlyB = 0, neither = 0;
    unitSegs.forEach((us, i) => {
      const x = us.a.some((s) => s.codeId === codeId) ? 1 : 0;
      const y = us.b.some((s) => s.codeId === codeId) ? 1 : 0;
      ra.push(x);
      rb.push(y);
      if (x && y) both++;
      else if (x) {
        onlyA++;
        disagreements.push({ unit: units[i], codeId, appliedBy: 'A' });
      } else if (y) {
        onlyB++;
        disagreements.push({ unit: units[i], codeId, appliedBy: 'B' });
      } else neither++;
    });
    for (const x of ra) pooledA.push(x); // not push(...ra): one argument per unit overflows on large projects
    for (const x of rb) pooledB.push(x);
    perCode.push({
      codeId,
      kappa: cohenKappa(ra, rb),
      alpha: krippendorffAlphaNominal([ra, rb]),
      agreement: percentAgreement(ra, rb),
      both,
      onlyA,
      onlyB,
      neither,
    });
  }
  const defined = perCode.map((c) => c.kappa).filter(Number.isFinite);
  return {
    coderA,
    coderB,
    docIds,
    nResponseUnits: nResp,
    nSentenceUnits: nSent,
    units,
    perCode,
    pooledAlpha: krippendorffAlphaNominal([pooledA, pooledB]),
    pooledAgreement: percentAgreement(pooledA, pooledB),
    meanKappa: defined.length ? defined.reduce((s, x) => s + x, 0) / defined.length : NaN,
    disagreements,
    oneSided,
    scope: either ? 'either' : 'both',
  };
}
