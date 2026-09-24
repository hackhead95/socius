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

  // The 20 responses two coders coded in the QA run (response id, Coder 1's codes, Priya's codes).
  // Two responses were coded by only one coder (1007 by Priya, 1018 by Coder 1); three by neither.
  const QA: Array<[string, string[], string[]]> = [
    ['1001', ['safety', 'lights'], ['safety']], ['1002', ['flood'], ['flood']], ['1003', ['rent'], ['rent']], ['1004', ['water'], ['air', 'water']],
    ['1005', ['safety'], ['safety']], ['1007', [], ['traffic']], ['1008', ['flood'], ['flood']], ['1009', [], []], ['1010', ['flood'], ['flood']],
    ['1011', ['flood'], ['flood']], ['1012', ['water'], ['water']], ['1013', ['traffic'], ['traffic']], ['1014', ['flood', 'waste', 'water'], ['flood', 'safety', 'waste', 'water']],
    ['1015', [], []], ['1016', ['safety', 'lights', 'waste'], ['safety', 'lights', 'waste']], ['1017', ['traffic'], ['traffic']], ['1018', ['rent', 'waste'], []],
    ['1019', ['flood'], ['flood']], ['1020', [], []], ['1021', ['flood'], ['flood']],
  ];
  const qaDocs: TextDoc[] = QA.map(([id]) => ({ id, name: `resp_id ${id}`, kind: 'response', text: `answer ${id}`, createdAt: 0 }));
  const qaSegs: CodedSegment[] = QA.flatMap(([id, a, b]) => [...a.map((k) => seg(id, 'C1', k)), ...b.map((k) => seg(id, 'Priya', k))]);
  const qaCodes = ['water', 'waste', 'lights', 'flood', 'traffic', 'safety', 'rent', 'air'];
  it('reports sources only one coder coded, and can include them (values from sklearn and krippendorff)', () => {
    const both = compareCoders(qaDocs, qaSegs, 'C1', 'Priya', qaCodes);
    expect(both.docIds.length).toBe(15);
    expect(both.oneSided).toEqual({ a: ['1018'], b: ['1007'] });
    expect(both.scope).toBe('both');
    expect(both.units.length).toBe(15);
    expect(both.pooledAlpha).toBeCloseTo(0.912121583527393, 12);
    const either = compareCoders(qaDocs, qaSegs, 'C1', 'Priya', qaCodes, { units: 'either' });
    expect(either.docIds.length).toBe(17);
    const k = Object.fromEntries(either.perCode.map((c) => [c.codeId, [c.kappa, c.alpha]]));
    expect(k.waste[0]).toBeCloseTo(0.7671232876712328, 12);
    expect(k.waste[1]).toBeCloseTo(0.7724137931034483, 12);
    expect(k.lights[0]).toBeCloseTo(0.6382978723404256, 12);
    expect(k.safety[0]).toBeCloseTo(0.8210526315789474, 12);
    expect(k.safety[1]).toBeCloseTo(0.8253968253968254, 12);
    expect(k.rent[1]).toBeCloseTo(0.6451612903225807, 12);
    expect(k.air[0]).toBeCloseTo(0, 12);
    expect(either.pooledAlpha).toBeCloseTo(0.8379186602870814, 12);
    expect(either.disagreements.filter((d) => d.unit.docId === '1018').map((d) => d.codeId).sort()).toEqual(['rent', 'waste']);
  });
});
