import { describe, expect, it } from 'vitest';
import { cohenKappa, compareCoders, krippendorffAlphaNominal, landisKoch, percentAgreement } from '../../src/lib/coding/reliability';
import type { CodedSegment, TextDoc } from '../../src/core/coding-types';

// Expected values computed with sklearn.metrics.cohen_kappa_score and the `krippendorff` package
// (see scripts in the report); hard-coded so CI does not need Python.
const A = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0];
const B = [1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1];

describe("Cohen's kappa", () => {
  it('matches sklearn for binary ratings', () => {
    expect(cohenKappa(A, B)).toBeCloseTo(0.5, 12);
  });
  it('matches sklearn for three categories', () => {
    const c = ['x', 'y', 'z', 'x', 'x', 'y', 'z', 'z', 'y', 'x'];
    const d = ['x', 'y', 'y', 'x', 'z', 'y', 'z', 'x', 'y', 'x'];
    expect(cohenKappa(c, d)).toBeCloseTo(0.5454545454545454, 12);
  });
  it('matches sklearn for a rare code with no joint use (negative kappa)', () => {
    expect(cohenKappa([0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 0, 0])).toBeCloseTo(-0.11111111111111116, 12);
  });
  it('is NaN when both raters use one category throughout', () => {
    expect(cohenKappa([0, 0, 0], [0, 0, 0])).toBeNaN();
  });
  it('percent agreement', () => {
    expect(percentAgreement(A, B)).toBeCloseTo(75, 12);
  });
});

describe("Krippendorff's alpha (nominal)", () => {
  it('matches the krippendorff package for two coders', () => {
    expect(krippendorffAlphaNominal([A, B])).toBeCloseTo(0.5112781954887218, 12);
    expect(krippendorffAlphaNominal([[0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 0, 0]])).toBeCloseTo(-0.05555555555555558, 12);
  });
  it('matches the krippendorff package with three coders and missing data', () => {
    const n = null;
    const data = [
      [n, n, n, n, n, 3, 4, 1, 2, 1, 1, 3, 3, n, 3],
      [1, n, 2, 1, 3, 3, 4, 3, n, n, n, n, n, n, n],
      [n, n, 2, 1, 3, 4, 4, n, 2, 1, 1, 3, 3, n, 4],
    ];
    expect(krippendorffAlphaNominal(data)).toBeCloseTo(0.691358024691358, 12);
  });
});

describe('Landis & Koch bands', () => {
  it('labels', () => {
    expect(landisKoch(0.1)).toBe('slight');
    expect(landisKoch(0.5)).toBe('moderate');
    expect(landisKoch(0.85)).toBe('almost perfect');
    expect(landisKoch(NaN)).toBe('not computable');
  });
});

describe('compareCoders', () => {
  const docs: TextDoc[] = A.map((_, i) => ({ id: `r${i}`, name: `R${i}`, kind: 'response', text: `answer ${i}`, createdAt: 0 }));
  const seg = (docId: string, coder: string, codeId: string): CodedSegment => ({ id: `${docId}${coder}${codeId}`, docId, codeId, coder, start: 0, end: 8, origin: 'manual', createdAt: 0 });
  it('uses responses as units and gives the same kappa as the raw ratings', () => {
    const segments: CodedSegment[] = [];
    A.forEach((x, i) => {
      segments.push(seg(`r${i}`, 'Ann', x ? 'k1' : 'k0'));
      segments.push(seg(`r${i}`, 'Ben', B[i] ? 'k1' : 'k0'));
    });
    const r = compareCoders(docs, segments, 'Ann', 'Ben', ['k1']);
    expect(r.docIds.length).toBe(20);
    expect(r.perCode[0].kappa).toBeCloseTo(0.5, 12);
    expect(r.perCode[0].alpha).toBeCloseTo(0.5112781954887218, 12);
    expect(r.perCode[0].onlyA + r.perCode[0].onlyB).toBe(5);
    expect(r.disagreements.length).toBe(5);
  });
  it('splits documents into sentence units and skips documents only one coder coded', () => {
    const doc: TextDoc = { id: 'd', name: 'Interview', kind: 'document', text: 'I moved here in 2010. Dr. Rao helped me. Work was hard. We managed.', createdAt: 0 };
    const other: TextDoc = { id: 'e', name: 'Other', kind: 'document', text: 'Only one coder. Here.', createdAt: 0 };
    const s = (coder: string, start: number, end: number, docId = 'd'): CodedSegment => ({ id: `${coder}${start}${docId}`, docId, codeId: 'c', coder, start, end, origin: 'manual', createdAt: 0 });
    const segments = [s('A', 0, 20), s('A', 42, 55), s('B', 3, 10), s('B', 22, 40), s('A', 0, 5, 'e')];
    const r = compareCoders([doc, other], segments, 'A', 'B', ['c']);
    expect(r.docIds).toEqual(['d']);
    expect(r.nSentenceUnits).toBe(4);
    // Units: s1 both, s2 B only, s3 A only, s4 neither
    expect(r.perCode[0]).toMatchObject({ both: 1, onlyA: 1, onlyB: 1, neither: 1 });
  });
});
